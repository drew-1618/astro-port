import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { itemLabel } from '../../data/portfolioData';
import { getGlowTexture, getRingTexture } from './textures';

function setCursor(value) {
  document.body.classList.toggle('star-hover', value === 'pointer');
}

// R3F reports how far the pointer travelled between down and up; treat larger moves as drags.
const isDrag = (e) => e.delta > 6;

/*
 * Stars are screen-space sprites (sizeAttenuation off), so like real stars
 * they stay points of light at any zoom; apparent size comes from magnitude.
 */
const magToSize = (mag) => THREE.MathUtils.clamp(0.07 - mag * 0.011, 0.022, 0.095);

/*
 * Non-attenuated sprites still scale with 1/tan(fov/2), so zooming in (narrower
 * FOV) would balloon every star. This factor cancels that, leaving a slight
 * growth (exponent < 1) so zooming still reads as magnification.
 */
const REF_TAN = Math.tan(THREE.MathUtils.degToRad(25));
export const fovScale = (camera) => Math.pow(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / REF_TAN, 0.85);

/* Mixes the theme's cool / neutral / warm star tokens by spectral temperature. */
export function starColor(temp, colors) {
  const c = new THREE.Color();
  if (temp < 0.5) c.copy(colors['star-cool']).lerp(colors.star, temp * 2);
  else c.copy(colors.star).lerp(colors['star-warm'], (temp - 0.5) * 2);
  return c;
}

function ItemStar({ star, colors, sectorActive, focused, showLabel, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const haloRef = useRef();
  const ringRef = useRef();
  const hitRef = useRef();
  const glow = useMemo(() => getGlowTexture(), []);
  const ring = useMemo(() => getRingTexture(), []);
  const color = useMemo(() => starColor(star.temp, colors), [star.temp, colors]);
  // Deep-sky targets are faint in reality but must stay clickable.
  const base = Math.max(magToSize(star.mag), 0.045);
  const phase = star.index * 1.7;

  useEffect(() => () => hovered && setCursor('auto'), [hovered]);

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    const k = fovScale(camera);
    if (haloRef.current) {
      const pulse = 1 + Math.sin(t * 1.4 + phase) * 0.06;
      const target = base * (focused ? 1.45 : hovered ? 1.3 : sectorActive ? 1.1 : 0.9) * pulse * k;
      const s = THREE.MathUtils.lerp(haloRef.current.scale.x, target, 0.25);
      haloRef.current.scale.set(s, s, 1);
    }
    if (ringRef.current) {
      ringRef.current.material.rotation = t * 0.5;
      ringRef.current.scale.set(0.06 * k, 0.06 * k, 1);
    }
    // Keep the tap target a constant size on screen at any zoom.
    if (hitRef.current) hitRef.current.scale.set(0.05 * k, 0.05 * k, 1);
  });

  return (
    <group position={star.position}>
      <sprite ref={haloRef} scale={[base, base, 1]}>
        <spriteMaterial
          map={glow}
          color={hovered || focused ? colors.accent : color}
          sizeAttenuation={false}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      {(hovered || focused) && (
        <sprite ref={ringRef} scale={[0.06, 0.06, 1]}>
          <spriteMaterial map={ring} color={colors.accent} sizeAttenuation={false} transparent depthWrite={false} />
        </sprite>
      )}
      {/* Fixed-size invisible hit target so faint stars are as easy to click as bright ones. */}
      <sprite
        ref={hitRef}
        scale={[0.05, 0.05, 1]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setCursor('pointer');
        }}
        onPointerOut={() => {
          setHovered(false);
          setCursor('auto');
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isDrag(e)) return;
          onSelect(star.item.id);
        }}
      >
        <spriteMaterial sizeAttenuation={false} transparent opacity={0} depthWrite={false} />
      </sprite>
      {(hovered || (sectorActive && !focused && showLabel)) && (
        <Html center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className={`-translate-y-6 whitespace-nowrap text-center font-mono uppercase [text-shadow:0_0_6px_rgb(var(--bg))] ${
              hovered ? 'text-accent' : 'text-ink/75'
            }`}
          >
            <div className="text-xs tracking-widest">{itemLabel(star.item)}</div>
            {hovered && (
              <div className="text-[11px] normal-case tracking-wider text-muted">
                {star.deepSky ? star.name : <><span className="uppercase">{star.name}</span> · {star.designation}</>}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

const LABEL_CHAR_PX = 8.4; // 12px JetBrains Mono + tracking-widest
const LABEL_H_PX = 16;
const LABEL_RISE_PX = 26; // labels sit above their star (-translate-y-6 plus line height)
const LABEL_PAD_PX = 4;

/*
 * Greedy label placement for the active sector: a few times a second, project
 * each item star to the screen and keep its label only if the label's box
 * doesn't overlap one already placed (brightest stars win, off-screen stars
 * are skipped). Prevents unreadable piles of text where stars sit close
 * together (e.g. the deep-sky targets in Auriga, or any star on a phone), and
 * keeps labels out from under fixed UI marked with `data-occluder`.
 * Hidden labels still appear on hover, and every star stays tappable.
 */
function useLabelLayout(stars, active) {
  const [visible, setVisible] = useState(() => new Set());
  const lastKey = useRef('');
  const tick = useRef(0);
  const v = useMemo(() => new THREE.Vector3(), []);
  const order = useMemo(() => [...stars].sort((a, b) => a.mag - b.mag), [stars]);

  useFrame(({ camera, size }) => {
    if (!active || tick.current++ % 8) return;
    // Fixed UI (header, panels, nav, intro card) counts as already-occupied space.
    const placed = [...document.querySelectorAll('[data-occluder]')].map((el) => {
      const r = el.getBoundingClientRect();
      return { l: r.left, r: r.right, t: r.top, b: r.bottom };
    });
    const ids = [];
    order.forEach((star) => {
      v.set(...star.position).project(camera);
      if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) return;
      const w = itemLabel(star.item).length * LABEL_CHAR_PX + LABEL_PAD_PX * 2;
      const cx = ((v.x + 1) / 2) * size.width;
      const cy = ((1 - v.y) / 2) * size.height - LABEL_RISE_PX;
      const box = { l: cx - w / 2, r: cx + w / 2, t: cy - LABEL_H_PX / 2 - LABEL_PAD_PX, b: cy + LABEL_H_PX / 2 + LABEL_PAD_PX };
      // Keep labels fully on screen too.
      if (box.l < 0 || box.r > size.width) return;
      if (placed.some((p) => box.l < p.r && box.r > p.l && box.t < p.b && box.b > p.t)) return;
      placed.push(box);
      ids.push(star.item.id);
    });
    const key = ids.join('|');
    if (key !== lastKey.current) {
      lastKey.current = key;
      setVisible(new Set(ids));
    }
  });

  return visible;
}

/* Catalog stars with no portfolio item: drawn so the constellation reads correctly, not interactive. */
function BackgroundStar({ star, colors }) {
  const ref = useRef();
  const glow = useMemo(() => getGlowTexture(), []);
  const color = useMemo(() => starColor(star.temp, colors), [star.temp, colors]);
  const size = magToSize(star.mag) * 0.8;
  useFrame(({ camera }) => {
    const s = size * fovScale(camera);
    ref.current?.scale.set(s, s, 1);
  });
  return (
    <sprite ref={ref} position={star.position} scale={[size, size, 1]} raycast={() => null}>
      <spriteMaterial
        map={glow}
        color={color}
        opacity={0.75}
        sizeAttenuation={false}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  );
}

/*
 * One sector = one real constellation: its stick figure, its portfolio-item
 * stars, the remaining catalog stars, and a clickable name label.
 */
export default function SectorCluster({ sector, sky, colors, active, anyActive, focusedItemId, onSelectSector, onSelectItem }) {
  const lineRef = useRef();
  const [labelHover, setLabelHover] = useState(false);
  const segments = useMemo(() => sky.lines.flat(), [sky.lines]);
  const labels = useLabelLayout(sky.stars, active);

  useFrame((_, delta) => {
    const mat = lineRef.current?.material;
    if (mat) {
      const target = active ? 0.6 : anyActive ? 0.12 : 0.28;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, target, Math.min(1, delta * 3));
    }
  });

  return (
    <group>
      {segments.length > 1 && (
        <Line
          ref={lineRef}
          points={segments}
          segments
          color={colors.accent}
          lineWidth={1}
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      )}

      {sky.background.map((s) => (
        <BackgroundStar key={s.name} star={s} colors={colors} />
      ))}

      {sky.stars.map((star) => (
        <ItemStar
          key={star.item.id}
          star={star}
          colors={colors}
          sectorActive={active}
          focused={focusedItemId === star.item.id}
          showLabel={labels.has(star.item.id)}
          onSelect={(itemId) => onSelectItem(sector.id, itemId)}
        />
      ))}

      {/* The active sector is named in the panel header, so its in-sky label is hidden. */}
      {!active && (!anyActive || labelHover) && (
        <Html position={sky.labelPosition} center zIndexRange={[15, 0]}>
          <button
            type="button"
            disabled={active}
            onClick={() => onSelectSector(sector.id)}
            onPointerEnter={() => setLabelHover(true)}
            onPointerLeave={() => setLabelHover(false)}
            className="whitespace-nowrap text-center font-mono uppercase [text-shadow:0_0_6px_rgb(var(--bg))] disabled:cursor-default"
          >
            {/* Phones (portrait and landscape) get a shorter label so it doesn't run off the edge or collide. */}
            <span className={`block text-xs tracking-[0.12em] sm:text-[13px] sm:tracking-[0.18em] land:text-xs land:tracking-[0.12em] ${active || labelHover ? 'text-accent' : 'text-accent/70'}`}>
              <span className="hidden sm:inline land:hidden">{sector.name} · </span>
              {sky.constellation}
            </span>
            <span className="block text-[11px] tracking-[0.1em] text-muted sm:tracking-[0.14em]">
              <span className="sm:hidden land:inline">{sector.short}</span>
              <span className="hidden sm:inline land:hidden">{sector.subtitle}</span>
            </span>
          </button>
        </Html>
      )}
    </group>
  );
}
