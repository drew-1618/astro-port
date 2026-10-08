import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Github, X } from 'lucide-react';
import SpectralBadge from './ui/SpectralBadge';
import AstroMedia from './ui/AstroMedia';
import StarChip from './ui/StarChip';

const KIND_META = {
  project: { header: 'Observation Log', idKey: 'targetId' },
  role: { header: 'Mission Log', idKey: 'missionId' },
  photo: { header: 'Capture Log', idKey: 'catalogId' },
};

function Section({ title, children }) {
  return (
    <section className="mt-5">
      <h4 className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-accent">{title}</h4>
      {children}
    </section>
  );
}

function Bullets({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((line) => (
        <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-ink/85">
          <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-accent" />
          {line}
        </li>
      ))}
    </ul>
  );
}

function MetaGrid({ rows }) {
  const visible = rows.filter(([, v]) => v !== null && v !== undefined && v !== '');
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {visible.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-3 border-b border-line/10 pb-1">
          <dt className="hud-label shrink-0">{k}</dt>
          <dd className="text-right font-mono text-xs text-ink/90">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function ProjectBody({ item }) {
  return (
    <>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {item.context} · {item.timeline.start}
        {item.timeline.end && item.timeline.end !== item.timeline.start ? ` → ${item.timeline.end}` : ''}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {item.classification.map((c) => (
          <span key={c} className="rounded-sm border border-accent/30 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
            {c}
          </span>
        ))}
      </div>
      <p className="mt-4 text-[15px] leading-relaxed text-ink/90">{item.description}</p>
      {item.metrics?.length > 0 && (
        <Section title="Telemetry">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {item.metrics.map((m) => (
              <div key={m.label} className="rounded-sm border border-line/15 bg-bg/50 p-2.5">
                <div className="hud-label">{m.label}</div>
                <div className="mt-1 font-mono text-sm text-accent">{m.value}</div>
              </div>
            ))}
          </div>
        </Section>
      )}
      <Section title="Architecture">
        <Bullets items={item.architecture} />
      </Section>
      <Section title="Spectral signature (stack)">
        <div className="flex flex-wrap gap-1.5">
          {item.stack.map((t) => (
            <SpectralBadge key={t} label={t} />
          ))}
        </div>
      </Section>
      {(item.repo || item.demo) && (
        <div className="mt-6 flex flex-wrap gap-2">
          {item.repo && (
            <a href={item.repo} target="_blank" rel="noreferrer" className="hud-btn">
              <Github size={13} aria-hidden /> Repository
            </a>
          )}
          {item.demo && (
            <a href={item.demo} target="_blank" rel="noreferrer" className="hud-btn border-accent/50 text-accent">
              <ExternalLink size={13} aria-hidden /> Live demo
            </a>
          )}
        </div>
      )}
    </>
  );
}

function RoleBody({ item }) {
  return (
    <>
      <p className="text-sm text-ink/80">
        {item.org} · {item.location}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {item.start} — {item.end}
      </p>
      <p className="mt-4 text-[15px] leading-relaxed text-ink/90">{item.summary}</p>
      <Section title="Impact & responsibilities">
        <Bullets items={item.impact} />
      </Section>
      <Section title="Instruments used">
        <div className="flex flex-wrap gap-1.5">
          {item.tools.map((t) => (
            <SpectralBadge key={t} label={t} />
          ))}
        </div>
      </Section>
    </>
  );
}

function PhotoBody({ item }) {
  const { optics, integration } = item;
  return (
    <>
      <AstroMedia photo={item} eager className="-mx-4 mt-1 aspect-[4/3] sm:-mx-6 land:mx-auto land:h-[55dvh] land:w-auto" />
      <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted">
        {item.type} · {item.date} · {item.location}
      </p>
      {item.notes && <p className="mt-3 text-[15px] leading-relaxed text-ink/90">{item.notes}</p>}
      <Section title="Optical train">
        <MetaGrid
          rows={[
            ['Telescope / Lens', optics.telescope],
            ['Focal length', optics.focalLength],
            ['Mount', optics.mount],
            ['Camera', optics.camera],
          ]}
        />
      </Section>
      <Section title="Integration">
        <MetaGrid
          rows={[
            ['Sub-exposures', integration.subs],
            ['Sub length', integration.subExposure],
            ['ISO / Gain', integration.isoGain],
            ['Total time', integration.totalTime],
            ['Filters', integration.filters],
            ['Barlow', integration.barlow],
          ]}
        />
      </Section>
      <Section title="Processing">
        <div className="flex flex-wrap gap-1.5">
          {item.processing.map((t) => (
            <SpectralBadge key={t} label={t} />
          ))}
        </div>
      </Section>
    </>
  );
}

const BODIES = { project: ProjectBody, role: RoleBody, photo: PhotoBody };

/*
 * Universal detail modal. `kind` selects the layout; `items` is the full
 * collection so prev/next can step through neighbours (also ←/→ keys).
 */
export default function ObservationModal({ kind, item, items, onClose, onNavigate }) {
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  const swipeStart = useRef(null);
  const meta = KIND_META[kind];
  const Body = BODIES[kind];
  const index = items.findIndex((i) => i.id === item.id);

  useEffect(() => {
    returnFocusRef.current = document.activeElement;
    dialogRef.current?.querySelector('[data-autofocus]')?.focus();
    return () => returnFocusRef.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && items.length > 1) onNavigate(items[(index + 1) % items.length]);
      else if (e.key === 'ArrowLeft' && items.length > 1) onNavigate(items[(index - 1 + items.length) % items.length]);
      else if (e.key === 'Tab') {
        const focusables = dialogRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, items, onClose, onNavigate]);

  useEffect(() => {
    dialogRef.current?.querySelector('[data-scroll]')?.scrollTo({ top: 0 });
  }, [item]);

  const title = item.title || item.role || item.target;

  // Horizontal swipe on touch screens steps to the previous / next entry.
  const onTouchStart = (e) => {
    const t = e.touches[0];
    swipeStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    if (!swipeStart.current || items.length < 2) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeStart.current.x;
    const dy = t.clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    onNavigate(items[(index + (dx < 0 ? 1 : -1) + items.length) % items.length]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6 land:p-2" role="presentation">
      <div className="absolute inset-0 bg-bg/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="obs-title"
        className="glass reticle relative flex max-h-[92dvh] w-full max-w-3xl animate-[panelUp_.3s_ease-out] flex-col rounded-t-xl sm:rounded-sm land:max-h-full"
      >
        <span aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted/40 sm:hidden" />
        <header className="flex items-start justify-between gap-4 border-b border-line/15 px-4 py-3 sm:px-6 sm:py-4 land:py-2">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent">
              {meta.header} · {item[meta.idKey]}
            </p>
            <h2 id="obs-title" className="mt-1 text-xl font-semibold leading-tight text-ink sm:text-2xl">
              {title}
            </h2>
            <StarChip itemId={item.id} withCoords className="mt-1" />
          </div>
          <button type="button" onClick={onClose} className="hud-btn min-w-[40px] shrink-0 px-2" aria-label="Close" data-autofocus>
            <X size={16} aria-hidden />
          </button>
        </header>

        <div
          data-scroll
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="scrollbar-thin min-h-0 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 sm:px-6"
        >
          <Body item={item} />
        </div>

        {items.length > 1 && (
          <footer className="flex items-center justify-between border-t border-line/15 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 land:py-1.5">
            <button
              type="button"
              className="hud-btn"
              onClick={() => onNavigate(items[(index - 1 + items.length) % items.length])}
            >
              <ChevronLeft size={13} aria-hidden /> Prev
            </button>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              {index + 1} / {items.length}
              <span className="ml-2 sm:hidden">· swipe</span>
            </span>
            <button type="button" className="hud-btn" onClick={() => onNavigate(items[(index + 1) % items.length])}>
              Next <ChevronRight size={13} aria-hidden />
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
