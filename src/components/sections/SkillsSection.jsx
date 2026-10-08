import SpectralBadge from '../ui/SpectralBadge';
import StarChip from '../ui/StarChip';

/*
 * Sector Gamma: each skill group is a sensor array. The signal bars are a
 * decorative channel-count readout (one bar per item), not a self-rating.
 */
export default function SkillsSection({ skills, highlightId }) {
  return (
    <div className="grid gap-4">
      {skills.map((g) => (
        <section
          key={g.id}
          id={`item-${g.id}`}
          className={`glass reticle rounded-sm p-4 transition-colors ${highlightId === g.id ? 'border-accent/70' : ''}`}
          aria-labelledby={`skills-${g.id}`}
        >
          <header className="flex items-end justify-between gap-3">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-accent">Band {g.band}</span>
              <h3 id={`skills-${g.id}`} className="text-base font-semibold text-ink">
                {g.group}
              </h3>
              <StarChip itemId={g.id} />
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="hud-label">{g.items.length} channels</span>
              <div aria-hidden className="flex h-4 items-end gap-[3px]">
                {g.items.map((item, i) => (
                  <span
                    key={item.name}
                    className="w-[3px] rounded-sm bg-accent/70"
                    style={{ height: `${35 + ((i * 37) % 65)}%` }}
                  />
                ))}
              </div>
            </div>
          </header>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {g.items.map((item) => (
              <SpectralBadge key={item.name} label={item.name} note={item.note} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
