import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { BackgroundStar } from './SectorCluster';

/*
 * A constellation drawn purely for context (no portfolio sector), such as
 * Hercules around the M13 capture: real stars, stick figure and a faint name.
 */
export default function ContextConstellation({ con, colors, anyActive }) {
  const lineRef = useRef();
  const segments = useMemo(() => con.lines.flat(), [con.lines]);

  useFrame((_, delta) => {
    const mat = lineRef.current?.material;
    if (mat) mat.opacity = THREE.MathUtils.lerp(mat.opacity, anyActive ? 0.12 : 0.22, Math.min(1, delta * 3));
  });

  return (
    <group>
      {segments.length > 1 && (
        <Line ref={lineRef} points={segments} segments color={colors.accent} lineWidth={1} transparent opacity={0.22} depthWrite={false} />
      )}
      {con.background.map((s) => (
        <BackgroundStar key={s.name} star={s} colors={colors} />
      ))}
      <Html position={con.labelPosition} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <span className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.18em] text-muted/70 [text-shadow:0_0_6px_rgb(var(--bg))]">
          {con.name}
        </span>
      </Html>
    </group>
  );
}
