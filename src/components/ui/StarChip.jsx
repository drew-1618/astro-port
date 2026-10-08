import { Star } from 'lucide-react';
import { useStarFor } from '../../lib/skyContext';
import { formatDec, formatRA } from '../../lib/celestial';

/*
 * Small "mapped star" readout for a portfolio item: the real star (or deep-sky
 * object) it is drawn as in the sky, with its J2000 coordinates.
 */
export default function StarChip({ itemId, withCoords = false, className = '' }) {
  const star = useStarFor(itemId);
  if (!star) return null;
  const coords = `RA ${formatRA(star.ra)} · Dec ${formatDec(star.dec)}`;
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-1.5 font-mono text-[10px] tracking-wider text-muted ${className}`} title={coords}>
      <Star size={10} aria-hidden className="text-accent-2" />
      {/* Only the name is uppercased: CSS uppercase would turn Greek Bayer letters (α, β, γ) into Latin lookalikes. */}
      <span className="uppercase">{star.deepSky ? star.constellation : star.name}</span>
      {!star.deepSky && <span>· {star.designation}</span>}
      {withCoords && <span className="text-muted/80">· {coords}</span>}
      {withCoords && !star.deepSky && <span className="text-muted/80">· ~{star.ly.toLocaleString()} ly</span>}
    </span>
  );
}
