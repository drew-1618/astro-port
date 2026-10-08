import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * Procedural observatory ambience built entirely from WebAudio nodes:
 *   - low detuned drones breathing through a slowly modulated low-pass filter
 *     (felt on headphones / laptop speakers),
 *   - a soft mid-range pad (A3 · C#4 · E4) with slow tremolo, so phone
 *     speakers (which can't reproduce much below ~150 Hz) still carry it,
 *   - a whisper of filtered noise (the "dome fan").
 * `blip()` plays a short sweep used as the slew-confirmation chirp. Nothing
 * plays until the user opts in.
 *
 * Mobile specifics:
 *   - iOS routes Web Audio through the "ambient" audio session, which the
 *     ring/silent switch mutes. Declaring a playback session (Safari 16.4+)
 *     and, for older versions, looping a silent <audio> element started in
 *     the same tap moves it to the "playback" session so it's audible.
 *   - Browsers suspend audio when the tab is hidden or the phone locks;
 *     it's resumed when the page becomes visible again.
 */

/* A short silent WAV as a blob URL, used to unlock iOS media playback. */
function silentWavUrl() {
  const rate = 8000;
  const samples = rate / 2;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + samples, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, rate, true);
  v.setUint32(28, rate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true); // 8-bit
  str(36, 'data');
  v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128); // 8-bit silence
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

const MASTER_LEVEL = 0.5;

export function useAmbientAudio() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const nodesRef = useRef([]);
  const enabledRef = useRef(false);
  const unlockRef = useRef(null); // silent <audio> keeping iOS in the playback session

  const build = useCallback(() => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();

    // Gentle limiter so layering never clips on small speakers.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.ratio.value = 6;
    limiter.connect(ctx.destination);
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(limiter);

    // Low drones.
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 6;
    filter.connect(master);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.05;
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain).connect(filter.frequency);
    const drones = [55, 82.41, 110.3].map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 2 ? 'sine' : 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = (i - 1) * 7;
      const g = ctx.createGain();
      g.gain.value = i === 2 ? 0.05 : 0.08;
      osc.connect(g).connect(filter);
      return osc;
    });

    // Mid-range pad, audible on phone speakers, with a slow tremolo.
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 1600;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.05;
    padFilter.connect(padGain).connect(master);
    const tremolo = ctx.createOscillator();
    const tremoloDepth = ctx.createGain();
    tremolo.frequency.value = 0.12;
    tremoloDepth.gain.value = 0.025;
    tremolo.connect(tremoloDepth).connect(padGain.gain);
    const pad = [220, 277.18, 329.63].map((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (i - 1) * 4;
      osc.connect(padFilter);
      return osc;
    });

    // Dome-fan noise.
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 900;
    noiseFilter.Q.value = 0.6;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.02;
    noise.connect(noiseFilter).connect(noiseGain).connect(master);

    const sources = [lfo, tremolo, noise, ...drones, ...pad];
    sources.forEach((n) => n.start());
    nodesRef.current = sources;
    ctxRef.current = ctx;
    masterRef.current = master;
    return ctx;
  }, []);

  /* Must run inside the user's tap: moves iOS audio out of the mutable "ambient" session. */
  const unlockMobilePlayback = useCallback(() => {
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch {
      /* not supported */
    }
    if (!unlockRef.current) {
      const el = new Audio(silentWavUrl());
      el.loop = true;
      el.setAttribute('playsinline', '');
      el.setAttribute('x-webkit-airplay', 'deny');
      unlockRef.current = el;
    }
    unlockRef.current.play().catch(() => {
      /* autoplay refused; Web Audio may still work */
    });
  }, []);

  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    if (next) unlockMobilePlayback();
    const ctx = ctxRef.current || (next ? build() : null);
    if (!ctx) return;
    enabledRef.current = next;
    const gain = masterRef.current.gain;
    const fade = () => {
      const now = ctx.currentTime;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
      gain.linearRampToValueAtTime(next ? MASTER_LEVEL : 0, now + (next ? 1.2 : 0.6));
    };
    if (next) {
      // Schedule the fade once the clock is actually running (it's frozen while suspended).
      ctx.resume().then(fade, fade);
    } else {
      fade();
      setTimeout(() => {
        if (!enabledRef.current) unlockRef.current?.pause();
      }, 700);
    }
    setEnabled(next);
  }, [build, unlockMobilePlayback]);

  const blip = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !enabledRef.current || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.18);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(g).connect(masterRef.current);
    osc.start(now);
    osc.stop(now + 0.32);
  }, []);

  // Phones suspend audio when the page is hidden or the screen locks; pick it back up on return.
  useEffect(() => {
    const revive = () => {
      if (document.visibilityState !== 'visible' || !enabledRef.current) return;
      const ctx = ctxRef.current;
      if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
      unlockRef.current?.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', revive);
    window.addEventListener('pageshow', revive);
    window.addEventListener('pointerdown', revive);
    return () => {
      document.removeEventListener('visibilitychange', revive);
      window.removeEventListener('pageshow', revive);
      window.removeEventListener('pointerdown', revive);
    };
  }, []);

  useEffect(
    () => () => {
      nodesRef.current.forEach((n) => {
        try {
          n.stop();
        } catch {
          /* already stopped */
        }
      });
      ctxRef.current?.close();
      ctxRef.current = null;
      nodesRef.current = [];
      enabledRef.current = false;
      if (unlockRef.current) {
        unlockRef.current.pause();
        URL.revokeObjectURL(unlockRef.current.src);
        unlockRef.current = null;
      }
    },
    [],
  );

  return { enabled, toggle, blip };
}
