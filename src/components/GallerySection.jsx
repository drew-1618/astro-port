import { Maximize2 } from 'lucide-react';
import AstroMedia from './ui/AstroMedia';
import StarChip from './ui/StarChip';

function MetaRow({ label, value, wide = false }) {
  if (!value) return null;
  return (
    <div className={`justify-between gap-3 border-b border-line/10 py-1 last:border-0 ${wide ? 'hidden sm:flex land:hidden' : 'flex'}`}>
      <dt className="hud-label shrink-0">{label}</dt>
      <dd className="truncate text-right font-mono text-[11px] text-ink/85" title={String(value)}>
        {value}
      </dd>
    </div>
  );
}

/* Sector Delta: astrophotography grid with optical metadata on every capture. */
export default function GallerySection({ photos, highlightId, onOpen }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 land:grid-cols-1">
      {photos.map((p) => (
        <button
          key={p.id}
          id={`item-${p.id}`}
          type="button"
          onClick={() => onOpen('photo', p)}
          className={`glass reticle focus-ring group flex overflow-hidden rounded-sm text-left transition-colors hover:border-accent/50 sm:flex-col land:flex-row ${
            highlightId === p.id ? 'border-accent/70' : ''
          }`}
        >
          {/* Phones / landscape: square thumbnail beside the metadata. Wider screens: 4:3 image on top. */}
          <div className="relative w-28 shrink-0 sm:w-full land:w-28">
            <AstroMedia photo={p} className="aspect-square h-full w-full transition-transform duration-700 group-hover:scale-[1.03] sm:aspect-[4/3] sm:h-auto land:aspect-square land:h-full" />
            <div className="pointer-events-none absolute inset-x-0 top-0 hidden items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/90 sm:flex land:hidden">
              <span>{p.catalogId}</span>
              <Maximize2 size={12} aria-hidden className="opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent sm:hidden land:block">{p.catalogId}</p>
            <h3 className="text-sm font-semibold text-ink">{p.target}</h3>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{p.type}</p>
            <StarChip itemId={p.id} />
            <dl className="mt-2">
              <MetaRow label="Optics" value={p.optics.telescope} />
              <MetaRow label="Focal" value={p.optics.focalLength} wide />
              <MetaRow label="Integ." value={p.integration.totalTime} />
              <MetaRow label="Subs" value={`${p.integration.subs} × ${p.integration.subExposure}`} />
              <MetaRow label="Gain" value={p.integration.isoGain} wide />
              <MetaRow label="Proc." value={p.processing.join(', ')} wide />
            </dl>
          </div>
        </button>
      ))}
    </div>
  );
}
