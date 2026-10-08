import { ArrowUpRight, Crosshair } from 'lucide-react';
import SpectralBadge from '../ui/SpectralBadge';
import StarChip from '../ui/StarChip';

function formatTimeline({ start, end }) {
  if (!end || end === start) return start;
  return `${start} → ${end}`;
}

/* Sector Alpha: each project rendered as an "Observation Target" card. */
export default function ProjectsSection({ projects, highlightId, onOpen }) {
  return (
    <div className="grid gap-4">
      {projects.map((p) => (
        <button
          key={p.id}
          id={`item-${p.id}`}
          type="button"
          onClick={() => onOpen('project', p)}
          className={`glass reticle focus-ring group block w-full rounded-sm p-4 text-left transition-colors hover:border-accent/50 ${
            highlightId === p.id ? 'border-accent/70' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-accent">
              <Crosshair size={12} aria-hidden /> Target {p.targetId}
            </span>
            <span className="font-mono text-xs uppercase tracking-widest text-muted">{formatTimeline(p.timeline)}</span>
          </div>
          <StarChip itemId={p.id} className="mt-1" />
          <h3 className="mt-1.5 flex items-center gap-2 text-lg font-semibold text-ink">
            {p.title}
            {p.featured && (
              <span className="rounded-sm border border-warn/40 px-1.5 py-px font-mono text-[11px] uppercase tracking-widest text-warn">
                Featured
              </span>
            )}
          </h3>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            {p.context} · CLASS {p.classification.join(' / ')}
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/80">{p.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.stack.map((t) => (
              <SpectralBadge key={t} label={t} size="xs" />
            ))}
          </div>
          <span className="mt-3 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-accent">
            Open observation log <ArrowUpRight size={12} aria-hidden />
          </span>
        </button>
      ))}
    </div>
  );
}
