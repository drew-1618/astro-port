import { ArrowUpRight, MapPin } from 'lucide-react';
import SpectralBadge from '../ui/SpectralBadge';
import StarChip from '../ui/StarChip';

/* Sector Beta: chronological mission log with a trajectory rail. */
export default function ExperienceSection({ experience, highlightId, onOpen }) {
  return (
    <ol className="relative ml-2 border-l border-dashed border-line/30 pl-6">
      {experience.map((x, i) => (
        <li key={x.id} id={`item-${x.id}`} className="relative mb-6 last:mb-0">
          <span
            aria-hidden
            className={`absolute -left-[31px] top-4 grid h-3.5 w-3.5 place-items-center rounded-full border ${
              i === 0 ? 'border-accent bg-accent/30' : 'border-line/50 bg-bg'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'animate-blink bg-accent' : 'bg-muted'}`} />
          </span>
          <button
            type="button"
            onClick={() => onOpen('role', x)}
            className={`glass reticle focus-ring group block w-full rounded-sm p-4 text-left transition-colors hover:border-accent/50 ${
              highlightId === x.id ? 'border-accent/70' : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs uppercase tracking-[0.14em]">
              <span className="text-accent">{x.missionId}</span>
              <span className="text-muted">
                {x.start} — {x.end}
              </span>
            </div>
            <StarChip itemId={x.id} className="mt-1" />
            <h3 className="mt-1.5 text-base font-semibold leading-snug text-ink">{x.role}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-[15px] text-ink/70">
              {x.org}
              <span className="text-muted">·</span>
              <MapPin size={12} aria-hidden className="text-muted" />
              <span className="text-muted">{x.location}</span>
            </p>
            <p className="mt-2 text-[15px] text-ink/80">{x.summary}</p>
            <ul className="mt-2 space-y-1.5">
              {x.impact.slice(0, 2).map((line) => (
                <li key={line} className="flex gap-2 text-sm leading-relaxed text-ink/75">
                  <span aria-hidden className="mt-2 h-px w-2.5 shrink-0 bg-accent" />
                  {line}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {x.tools.map((t) => (
                <SpectralBadge key={t} label={t} size="xs" />
              ))}
            </div>
            <span className="mt-3 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.14em] text-muted transition-colors group-hover:text-accent">
              Full mission log ({x.impact.length} entries) <ArrowUpRight size={12} aria-hidden />
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
