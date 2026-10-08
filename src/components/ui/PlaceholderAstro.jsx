import { useId, useMemo } from 'react';
import { mulberry32 } from '../../lib/celestial';

/*
 * Procedural stand-in for an astrophotograph, generated as SVG from the
 * capture's `placeholder` config ({ kind, seed }). Kinds: nebula, galaxy,
 * planet, moon, cluster. Real images replace this by setting `image` in data.
 */
export default function PlaceholderAstro({ kind = 'nebula', seed = 1, className = '' }) {
  const uid = useId().replace(/:/g, '');
  const field = useMemo(() => {
    const r = mulberry32(seed);
    return Array.from({ length: kind === 'cluster' ? 160 : 120 }, () => ({
      x: r() * 400,
      y: r() * 300,
      s: Math.pow(r(), 5) * 1.8 + 0.3,
      o: 0.4 + r() * 0.6,
    }));
  }, [kind, seed]);

  const body = useMemo(() => {
    const r = mulberry32(seed * 9973);
    switch (kind) {
      case 'galaxy':
        return (
          <g transform={`rotate(${-25 + r() * 20} 200 150)`}>
            <ellipse cx="200" cy="150" rx="170" ry="48" fill={`url(#${uid}-gal)`} filter={`url(#${uid}-tex)`} />
            <ellipse cx="200" cy="150" rx="60" ry="18" fill="#fff6e0" opacity="0.55" filter={`url(#${uid}-blur)`} />
            <ellipse cx="200" cy="150" rx="140" ry="22" fill="none" stroke="#3a2a1a" strokeWidth="5" opacity="0.45" filter={`url(#${uid}-blur)`} />
          </g>
        );
      case 'planet':
        return (
          <g transform="rotate(-18 200 150)">
            <ellipse cx="200" cy="150" rx="150" ry="34" fill="none" stroke="#d9c79f" strokeWidth="14" opacity="0.75" />
            <ellipse cx="200" cy="150" rx="126" ry="27" fill="none" stroke="#0b0b0b" strokeWidth="3" opacity="0.8" />
            <circle cx="200" cy="150" r="62" fill={`url(#${uid}-planet)`} />
            <path d="M 50 150 A 150 34 0 0 0 350 150" fill="none" stroke="#e8d6ae" strokeWidth="14" opacity="0.9" />
          </g>
        );
      case 'moon': {
        const craters = Array.from({ length: 26 }, () => ({
          x: 130 + r() * 140,
          y: 80 + r() * 140,
          rad: 2 + Math.pow(r(), 2) * 14,
        })).filter((c) => (c.x - 200) ** 2 + (c.y - 150) ** 2 < 95 ** 2);
        return (
          <g>
            <circle cx="200" cy="150" r="110" fill={`url(#${uid}-moon)`} filter={`url(#${uid}-tex)`} />
            {craters.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r={c.rad} fill="#000" opacity="0.22" />
            ))}
            <path d="M 200 40 A 110 110 0 0 0 200 260 A 70 110 0 0 1 200 40 Z" fill="#000" opacity="0.82" />
          </g>
        );
      }
      case 'cluster':
        return (
          <g>
            <ellipse cx="200" cy="150" rx="170" ry="120" fill={`url(#${uid}-refl)`} filter={`url(#${uid}-tex)`} opacity="0.8" />
            {Array.from({ length: 7 }, (_, i) => {
              const x = 110 + r() * 180;
              const y = 80 + r() * 140;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={14} fill="#bcd8ff" opacity="0.35" filter={`url(#${uid}-blur)`} />
                  <circle cx={x} cy={y} r={2.6} fill="#fff" />
                  <path d={`M ${x - 12} ${y} H ${x + 12} M ${x} ${y - 12} V ${y + 12}`} stroke="#fff" strokeWidth="0.6" opacity="0.7" />
                </g>
              );
            })}
          </g>
        );
      case 'nebula':
      default:
        return (
          <g>
            <ellipse cx={180 + r() * 40} cy={140 + r() * 20} rx="170" ry="120" fill={`url(#${uid}-neb)`} filter={`url(#${uid}-tex)`} />
            <ellipse cx={170 + r() * 60} cy={130 + r() * 40} rx="80" ry="60" fill="#ffd9e6" opacity="0.35" filter={`url(#${uid}-tex)`} />
            <ellipse cx="200" cy="150" rx="120" ry="60" fill="#1d6f8f" opacity="0.25" filter={`url(#${uid}-tex)`} />
          </g>
        );
    }
  }, [kind, seed, uid]);

  return (
    <svg viewBox="0 0 400 300" className={className} preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Placeholder ${kind} render`}>
      <defs>
        <filter id={`${uid}-tex`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="4" seed={seed % 100} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="38" />
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id={`${uid}-blur`}>
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <radialGradient id={`${uid}-neb`}>
          <stop offset="0%" stopColor="#ff8fb1" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#c2185b" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1a0b2e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-gal`}>
          <stop offset="0%" stopColor="#fff3d6" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#c9b28a" stopOpacity="0.55" />
          <stop offset="75%" stopColor="#5b7bb5" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-planet`} cx="40%" cy="35%">
          <stop offset="0%" stopColor="#f5e3b8" />
          <stop offset="70%" stopColor="#c7a46a" />
          <stop offset="100%" stopColor="#5d4423" />
        </radialGradient>
        <radialGradient id={`${uid}-moon`} cx="40%" cy="40%">
          <stop offset="0%" stopColor="#e9e9e4" />
          <stop offset="80%" stopColor="#9e9e98" />
          <stop offset="100%" stopColor="#5a5a56" />
        </radialGradient>
        <radialGradient id={`${uid}-refl`}>
          <stop offset="0%" stopColor="#6fa8ff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0b1a3a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="#04050b" />
      {field.map((st, i) => (
        <circle key={i} cx={st.x} cy={st.y} r={st.s} fill="#fff" opacity={st.o} />
      ))}
      {body}
    </svg>
  );
}
