import { hashString } from '../../lib/celestial';

const BANDS = ['bg-accent', 'bg-accent-2', 'bg-warn'];

/*
 * Tech/instrument badge styled like a spectral line: a narrow coloured
 * emission bar followed by a monospace label. The band colour is derived
 * from the label, so the same tech always gets the same line.
 */
export default function SpectralBadge({ label, note, size = 'sm' }) {
  const band = BANDS[hashString(label) % BANDS.length];
  const pad = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border border-line/15 bg-bg/50 font-mono uppercase tracking-wider text-ink/85 ${pad}`}
      title={note || label}
    >
      <span aria-hidden className={`h-3 w-[3px] rounded-full ${band} shadow-[0_0_6px_currentColor]`} />
      {label}
      {note && <span className="normal-case tracking-normal text-muted">· {note}</span>}
    </span>
  );
}
