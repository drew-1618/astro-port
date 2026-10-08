import { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import { eclipticToRaDec, raDecToDirection } from '../../lib/celestial';

/*
 * The ecliptic, the Sun's yearly path and the plane the planets orbit in,
 * drawn as a faint dashed great circle. Solar-system photos sit along it.
 */
export default function Ecliptic({ colors }) {
  const points = useMemo(
    () =>
      Array.from({ length: 181 }, (_, i) => {
        const { ra, dec } = eclipticToRaDec(i * 2);
        return raDecToDirection(ra, dec).multiplyScalar(330).toArray();
      }),
    [],
  );
  const labelAt = useMemo(() => {
    const { ra, dec } = eclipticToRaDec(52);
    return raDecToDirection(ra, dec - 1.5).multiplyScalar(330).toArray();
  }, []);

  return (
    <group>
      <Line points={points} color={colors['accent-2']} lineWidth={1} dashed dashSize={3} gapSize={4} transparent opacity={0.22} depthWrite={false} />
      <Html position={labelAt} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
        <span className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-accent-2/60">Ecliptic</span>
      </Html>
    </group>
  );
}
