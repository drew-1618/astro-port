import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32 } from '../../lib/celestial';

// Fewer points on touch devices (phones/tablets) to keep frame times low.
const COARSE = window.matchMedia('(pointer: coarse)').matches;
const BASE_COUNT = COARSE ? 4500 : 7000;
// Extra faint stars that only appear as you zoom in, like a deeper limiting
// magnitude through higher magnification.
const FAINT_COUNT = COARSE ? 24000 : 60000;
const COUNT = BASE_COUNT + FAINT_COUNT;

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aTemp;
  attribute float aPhase;
  attribute float aFaint;
  uniform float uTime;
  uniform float uReveal;
  uniform float uPixelRatio;
  uniform vec3 uStar;
  uniform vec3 uWarm;
  uniform vec3 uCool;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.62 + 0.38 * sin(uTime * (0.6 + aPhase * 2.4) + aPhase * 6.2831);
    gl_PointSize = clamp(aSize * uPixelRatio * (1400.0 / -mv.z), 1.0, 7.0);
    vec3 tint = aTemp < 0.5 ? mix(uCool, uStar, aTemp * 2.0) : mix(uStar, uWarm, (aTemp - 0.5) * 2.0);
    vColor = tint;
    // aFaint 0 = always visible; (0,1] = revealed progressively as uReveal rises with zoom.
    float reveal = 1.0 - smoothstep(uReveal - 0.15, uReveal, aFaint);
    vAlpha = twinkle * reveal;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.5, 0.0, d);
    float alpha = pow(core, 2.2) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

/*
 * The far-field starfield (faint, beyond the catalog constellations): a deep shell of stars with a denser, tilted
 * "galactic band", a few compact clusters, and per-star twinkle/temperature
 * handled entirely in the shader.
 */
export default function BackgroundStars({ colors }) {
  const materialRef = useRef();
  const pointsRef = useRef();
  const { gl } = useThree();

  const geometry = useMemo(() => {
    const rand = mulberry32(20260701);
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const temps = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    const faint = new Float32Array(COUNT);
    const bandTilt = new THREE.Euler(0.45, 0, 0.6);
    const clusterCentres = Array.from({ length: 6 }, () =>
      new THREE.Vector3().randomDirection().multiplyScalar(1250 + rand() * 300),
    );
    const v = new THREE.Vector3();

    for (let i = 0; i < COUNT; i++) {
      const pick = rand();
      if (pick < 0.55) {
        // Uniform deep shell.
        v.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize().multiplyScalar(1100 + rand() * 800);
      } else if (pick < 0.92) {
        // Galactic band: a thick ring, then tilted.
        const a = rand() * Math.PI * 2;
        const r = 1200 + rand() * 600;
        const thickness = (rand() + rand() + rand() - 1.5) * 140;
        v.set(Math.cos(a) * r, thickness, Math.sin(a) * r).applyEuler(bandTilt);
      } else {
        // Compact open clusters.
        const c = clusterCentres[Math.floor(rand() * clusterCentres.length)];
        v.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(60).add(c);
      }
      positions.set([v.x, v.y, v.z], i * 3);
      const isFaint = i >= BASE_COUNT;
      sizes[i] = isFaint ? 1.9 + rand() * 1.3 : Math.pow(rand(), 6) * 6 + 0.8;
      temps[i] = rand();
      phases[i] = rand();
      faint[i] = isFaint ? 0.02 + rand() * 0.98 : 0;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aTemp', new THREE.BufferAttribute(temps, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aFaint', new THREE.BufferAttribute(faint, 1));
    return geo;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uStar: { value: new THREE.Color() },
      uWarm: { value: new THREE.Color() },
      uCool: { value: new THREE.Color() },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uStar.value.copy(colors.star);
    uniforms.uWarm.value.copy(colors['star-warm']);
    uniforms.uCool.value.copy(colors['star-cool']);
  }, [colors, uniforms]);

  useEffect(() => {
    uniforms.uPixelRatio.value = gl.getPixelRatio();
  }, [gl, uniforms]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ camera }, delta) => {
    uniforms.uTime.value += delta;
    // 0 at ≥55° FOV (no faint stars) → 1 at ≤8° (all of them).
    uniforms.uReveal.value = THREE.MathUtils.clamp((55 - camera.fov) / 47, 0, 1);
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
