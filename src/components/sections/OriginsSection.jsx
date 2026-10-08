import { Award, GraduationCap, Plane } from 'lucide-react';
import TransmissionTerminal from '../TransmissionTerminal';
import StarChip from '../ui/StarChip';

/* Sector Epsilon: academic history followed by the comms terminal. */
export default function OriginsSection({ education, profile, highlightId }) {
  return (
    <div className="grid gap-4">
      {education.map((e) => (
        <article
          key={e.id}
          id={`item-${e.id}`}
          className={`glass reticle rounded-sm p-4 transition-colors ${highlightId === e.id ? 'border-accent/70' : ''}`}
        >
          <div className="flex items-center justify-between gap-2 font-mono text-xs uppercase tracking-[0.14em]">
            <span className="flex items-center gap-1.5 text-accent">
              <GraduationCap size={12} aria-hidden /> Ground station
            </span>
            <span className="text-muted">{e.end}</span>
          </div>
          <StarChip itemId={e.id} className="mt-1" />
          <h3 className="mt-1.5 text-base font-semibold text-ink">{e.school}</h3>
          <p className="text-[15px] text-ink/80">{e.degree}</p>
          {e.concentration && <p className="text-[15px] text-ink/70">{e.concentration}</p>}
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <dt className="hud-label">GPA</dt>
              <dd className="hud-value text-[15px]">{e.gpa}</dd>
            </div>
            <div>
              <dt className="hud-label">Site</dt>
              <dd className="font-mono text-[13px] text-ink/80">{e.location}</dd>
            </div>
          </dl>
          {e.honors.length > 0 && (
            <ul className="mt-3 space-y-1">
              {e.honors.map((h) => (
                <li key={h} className="flex items-center gap-2 text-[15px] text-ink/80">
                  <Award size={13} aria-hidden className="text-warn" /> {h}
                </li>
              ))}
            </ul>
          )}
          {e.milestones.length > 0 && (
            <ul className="mt-3 space-y-1">
              {e.milestones.map((m) => (
                <li key={m.label} className="flex items-center gap-2 text-[15px] text-ink/80">
                  <Plane size={13} aria-hidden className="text-accent-2" />
                  {m.label}
                  <span className="font-mono text-xs text-muted">{m.date}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
      <TransmissionTerminal profile={profile} highlighted={highlightId === 'comms'} />
    </div>
  );
}
