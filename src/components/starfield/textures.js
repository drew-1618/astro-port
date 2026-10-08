import * as THREE from 'three';
import { mulberry32 } from '../../lib/celestial';

let glowTexture = null;
let nebulaTextures = null;

/* Soft radial falloff used for star halos. Drawn white so materials can tint it. */
export function getGlowTexture() {
  if (glowTexture) return glowTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.12, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.22)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  // Faint diffraction spikes.
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(size / 2, 6);
  ctx.lineTo(size / 2, size - 6);
  ctx.moveTo(6, size / 2);
  ctx.lineTo(size - 6, size / 2);
  ctx.stroke();
  glowTexture = new THREE.CanvasTexture(canvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
}

/*
 * A handful of grayscale cloud textures: overlapping soft blobs scattered with
 * a seeded RNG, faded to transparent at the edges. Tinted per-sprite.
 */
export function getNebulaTextures() {
  if (nebulaTextures) return nebulaTextures;
  nebulaTextures = [11, 23, 57].map((seed) => {
    const rand = mulberry32(seed);
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 46; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = Math.pow(rand(), 1.6) * size * 0.32;
      const x = size / 2 + Math.cos(angle) * dist;
      const y = size / 2 + Math.sin(angle) * dist * 0.7;
      const r = size * (0.06 + rand() * 0.2);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const a = 0.05 + rand() * 0.08;
      g.addColorStop(0, `rgba(255,255,255,${a})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    ctx.globalCompositeOperation = 'destination-in';
    const mask = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size / 2);
    mask.addColorStop(0, 'rgba(0,0,0,1)');
    mask.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
  return nebulaTextures;
}

let ringTexture = null;

/* Thin reticle ring with four tick marks, used to mark hovered/focused stars. */
export function getRingTexture() {
  if (ringTexture) return ringTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 4;
  [0, 1, 2, 3].forEach((i) => {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(size / 2 + Math.cos(a) * size * 0.4, size / 2 + Math.sin(a) * size * 0.4);
    ctx.lineTo(size / 2 + Math.cos(a) * size * 0.49, size / 2 + Math.sin(a) * size * 0.49);
    ctx.stroke();
  });
  ringTexture = new THREE.CanvasTexture(canvas);
  ringTexture.colorSpace = THREE.SRGBColorSpace;
  return ringTexture;
}
