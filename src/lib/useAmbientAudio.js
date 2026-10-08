import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * Procedural observatory ambience built entirely from WebAudio nodes: a pair of
 * detuned low drones breathing through a slowly modulated low-pass filter, plus
 * a whisper of filtered noise (the "dome fan"). `blip()` plays a short sweep
 * used as the slew-confirmation chirp. Nothing plays until the user opts in.
 */
export function useAmbientAudio() {
  const [enabled, setEnabled] = useState(false);
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const nodesRef = useRef([]);
  const enabledRef = useRef(false);

  const build = useCallback(() => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

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
    noiseGain.gain.value = 0.018;
    noise.connect(noiseFilter).connect(noiseGain).connect(master);

    [lfo, noise, ...drones].forEach((n) => n.start());
    nodesRef.current = [lfo, noise, ...drones];
    ctxRef.current = ctx;
    masterRef.current = master;
    return ctx;
  }, []);

  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    const ctx = ctxRef.current || (next ? build() : null);
    if (!ctx) return;
    enabledRef.current = next;
    const now = ctx.currentTime;
    const gain = masterRef.current.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    if (next) {
      ctx.resume();
      gain.linearRampToValueAtTime(0.35, now + 1.5);
    } else {
      gain.linearRampToValueAtTime(0, now + 0.6);
    }
    setEnabled(next);
  }, [build]);

  const blip = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !enabledRef.current) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.18);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
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
    },
    [],
  );

  return { enabled, toggle, blip };
}
