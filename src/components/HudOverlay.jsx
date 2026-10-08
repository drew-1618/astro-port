import { useEffect, useRef, useState } from 'react';
import { Eye, LocateFixed, Moon, Volume2, VolumeX } from 'lucide-react';
import { angleToPoint, constellationInView, formatDec, formatRA, localSiderealTime, ndcToRaDec } from '../lib/celestial';
import { sectorIcon } from './ui/icons';
import Telemetry from './ui/Telemetry';

/*
 * Live RA/Dec under the pointer, sampled at most once per animation frame.
 * On touch screens there's no hovering pointer, so it reads the sky at the
 * centre of the screen (the reticle) until the user touches somewhere.
 */
function useCursorRaDec(cameraRef) {
  const [coords, setCoords] = useState({ ra: 0, dec: 0 });
  const frame = useRef(0);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const sample = () => {
      frame.current = 0;
      const camera = cameraRef.current;
      if (!camera) return;
      setCoords(ndcToRaDec(last.current.x, last.current.y, camera));
    };
    const onMove = (e) => {
      last.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
      if (!frame.current) frame.current = requestAnimationFrame(sample);
    };
    // Keep the readout drifting even when the pointer is still (sky moves under the cursor while slewing).
    const idle = setInterval(() => {
      if (!frame.current) frame.current = requestAnimationFrame(sample);
    }, 250);
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      clearInterval(idle);
      cancelAnimationFrame(frame.current);
    };
  }, [cameraRef]);

  return coords;
}

/*
 * What the view is pointed at, re-checked ~4×/s so it follows dragging and
 * zooming. While a target is selected and still near the centre of the view
 * it's reported as is; otherwise the constellation at the centre is named.
 */
function useViewLabel(cameraRef, fields, targetLabel, targetPoint) {
  const [label, setLabel] = useState(targetLabel || 'ALL-SKY');
  useEffect(() => {
    const check = () => {
      const camera = cameraRef.current;
      if (!camera) return;
      const onTarget = targetLabel && targetPoint && angleToPoint(camera, targetPoint) < Math.max(8, camera.fov * 0.3);
      if (onTarget) {
        setLabel(targetLabel);
        return;
      }
      const name = constellationInView(camera, fields, Math.max(12, camera.fov * 0.35));
      const { ra, dec } = ndcToRaDec(0, 0, camera);
      setLabel(name ? `FIELD · ${name.toUpperCase()}` : `OPEN SKY · ${formatRA(ra).slice(0, 7)} ${formatDec(dec).slice(0, 4)}`);
    };
    check();
    const id = setInterval(check, 250);
    return () => clearInterval(id);
  }, [cameraRef, fields, targetLabel, targetPoint]);
  return label;
}

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Reticle({ slewing }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 120"
      className="pointer-events-none fixed left-1/2 top-1/2 z-10 h-20 w-20 -translate-x-1/2 -translate-y-1/2 text-accent/50 lg:h-28 lg:w-28"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.8">
        <circle cx="60" cy="60" r="34" strokeDasharray="2 4" className={slewing ? 'origin-center animate-spin' : ''} style={{ animationDuration: '3s' }} />
        <circle cx="60" cy="60" r="3" />
        <path d="M60 4v26M60 90v26M4 60h26M90 60h26" />
        <path d="M30 22h-8v8M90 22h8v8M30 98h-8v-8M90 98h8v-8" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

function StatusDot({ slewing }) {
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${slewing ? 'animate-blink bg-warn' : 'bg-accent'}`} />;
}

/*
 * Fixed observatory chrome, in three layouts (see src/lib/layout.js):
 *   desktop   — header, left sector dock, footer telemetry bar.
 *   mobile    — compact two-row header (identity/toggles, status/RA-Dec) and a bottom tab bar.
 *   landscape — single-row header and a left icon rail.
 */
export default function HudOverlay({
  profile,
  sectors,
  activeSectorId,
  targetLabel,
  targetPoint,
  fields,
  slewing,
  redMode,
  audioOn,
  cameraRef,
  showReticle,
  onToggleRed,
  onToggleAudio,
  onRecenter,
  onSelectSector,
}) {
  const { ra, dec } = useCursorRaDec(cameraRef);
  const now = useClock();
  const lst = localSiderealTime(now, profile.site.lon);
  // Live field of view; the readout re-renders with the RA/Dec sampler (~4×/s), so it tracks zooming.
  const fovDeg = cameraRef.current?.fov ?? 60;
  const fov = fovDeg < 10 ? fovDeg.toFixed(1) : Math.round(fovDeg);
  const activeSector = sectors.find((s) => s.id === activeSectorId);

  const viewLabel = useViewLabel(cameraRef, fields, targetLabel, targetPoint);
  const status = slewing ? `SLEWING → ${targetLabel || 'ALL-SKY'}` : activeSector ? 'TRACKING: SIDEREAL' : 'PARKED';
  // Phones have no Target readout, so their status line names what's in view.
  const mobileStatus = slewing ? status : `${activeSector ? 'TRACKING' : 'PARKED'} · ${viewLabel.replace(/^FIELD · /, '')}`;
  const site = `${profile.site.name} · ${Math.abs(profile.site.lat).toFixed(2)}°${profile.site.lat >= 0 ? 'N' : 'S'} ${Math.abs(profile.site.lon).toFixed(2)}°${profile.site.lon >= 0 ? 'E' : 'W'}`;

  const toggles = (
    <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
      <button type="button" className="hud-btn min-w-[36px] px-1.5 sm:min-w-[40px] sm:px-2 xl:px-3" aria-pressed={audioOn} onClick={onToggleAudio} title="Ambient audio" aria-label="Ambient audio">
        {audioOn ? <Volume2 size={16} aria-hidden /> : <VolumeX size={16} aria-hidden />}
        <span className="hidden xl:inline">Audio</span>
      </button>
      <button type="button" className="hud-btn min-w-[36px] px-1.5 sm:min-w-[40px] sm:px-2 xl:px-3" aria-pressed={redMode} onClick={onToggleRed} title="Dark-sky red filter" aria-label="Dark-sky red filter">
        {redMode ? <Eye size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
        <span className="hidden xl:inline">Red filter</span>
      </button>
      <button type="button" className="hud-btn min-w-[36px] px-1.5 sm:min-w-[40px] sm:px-2 xl:px-3" onClick={onRecenter} title="Recenter camera" aria-label="Recenter camera">
        <LocateFixed size={16} aria-hidden />
        <span className="hidden xl:inline">Recenter</span>
      </button>
    </div>
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-20 font-mono">
      {/* Header */}
      <header data-occluder className="pointer-events-auto absolute inset-x-0 top-0 border-b border-line/10 bg-gradient-to-b from-bg/95 to-bg/60 px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-[2px] lg:px-4 lg:py-3 land:py-1.5 land:pl-[max(0.75rem,env(safe-area-inset-left))] land:pr-[max(0.75rem,env(safe-area-inset-right))]">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onRecenter} className="focus-ring flex min-w-0 items-center gap-2.5 text-left lg:gap-3" aria-label="Recenter to all-sky view">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-accent/50 text-xs font-bold text-accent land:h-7 land:w-7">
              {profile.initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-sans text-sm font-semibold text-ink sm:text-[15px]">{profile.name}</span>
              <span className="block text-xs uppercase leading-tight tracking-[0.06em] text-muted sm:truncate sm:tracking-[0.12em] land:hidden">
                {/* On narrow screens wrap at the "·" separators, never mid-phrase. */}
                {profile.title.split(' · ').map((part, i) => (
                  <span key={part}>
                    {/* Separator sits outside the nowrap span so the line can break there. */}
                    {i > 0 && ' · '}
                    <span className="whitespace-nowrap">{part}</span>
                  </span>
                ))}
              </span>
            </span>
          </button>

          {/* Status: desktop + landscape inline */}
          <div className="hidden min-w-0 items-center gap-6 lg:flex land:flex" aria-live="polite">
            <span className="flex min-w-0 max-w-[340px] items-center gap-2 truncate whitespace-nowrap text-[13px] uppercase tracking-[0.14em] text-accent land:max-w-[240px] land:text-xs land:tracking-[0.12em]">
              <StatusDot slewing={slewing} />
              <span className="truncate">{status}</span>
            </span>
            <Telemetry label={viewLabel === targetLabel ? 'Target' : 'In view'} value={viewLabel} className="max-w-[220px] xl:max-w-[280px]" />
          </div>

          {toggles}
        </div>

        {/* Mobile second row: status + live sky coordinates (labels arrive pre-cased so Greek star letters survive) */}
        <div className="mt-1.5 flex items-center justify-between gap-3 text-xs tracking-[0.12em] lg:hidden land:hidden" aria-live="polite">
          <span className="flex min-w-0 items-center gap-1.5 text-accent">
            <StatusDot slewing={slewing} />
            <span className="truncate">{mobileStatus}</span>
          </span>
          <span className="shrink-0 text-[11px] tabular-nums text-muted sm:text-xs">
            {formatRA(ra).slice(0, 7)} <span className="text-muted/60">·</span> {formatDec(dec).slice(0, 8)}
            {' '}
            <span className="text-muted/60">·</span> {fov}°
          </span>
        </div>
      </header>

      {/* Desktop navigation dock */}
      <nav data-occluder aria-label="Sectors" className="pointer-events-auto absolute left-4 top-1/2 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
        <span className="hud-label mb-1 pl-1">GoTo · Sectors</span>
        {sectors.map((s) => {
          const Icon = sectorIcon(s.icon);
          const active = s.id === activeSectorId;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectSector(s.id)}
              className={`glass focus-ring group flex w-60 items-center gap-3 rounded-sm px-3 py-2 text-left transition-colors hover:border-accent/50 ${
                active ? 'border-accent/70' : ''
              }`}
            >
              <Icon size={16} aria-hidden className={active ? 'text-accent' : 'text-muted group-hover:text-accent'} />
              <span className="min-w-0">
                <span className={`block text-xs uppercase tracking-[0.16em] ${active ? 'text-accent' : 'text-muted'}`}>{s.name}</span>
                <span className="block truncate font-sans text-sm text-ink">{s.subtitle}</span>
              </span>
            </button>
          );
        })}
      </nav>

      {/* Landscape icon rail */}
      <nav
        data-occluder
        aria-label="Sectors"
        className="pointer-events-auto absolute bottom-2 left-0 top-14 hidden flex-col justify-center gap-1.5 pl-[max(0.5rem,env(safe-area-inset-left))] land:flex"
      >
        {sectors.map((s) => {
          const Icon = sectorIcon(s.icon);
          const active = s.id === activeSectorId;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={active}
              aria-label={`${s.name}: ${s.subtitle}`}
              title={s.short}
              onClick={() => onSelectSector(s.id)}
              className={`glass focus-ring grid h-11 w-11 touch-manipulation place-items-center rounded-sm transition-colors active:bg-accent/10 ${
                active ? 'border-accent/70 text-accent' : 'text-muted'
              }`}
            >
              <Icon size={17} aria-hidden />
            </button>
          );
        })}
      </nav>

      {/* Mobile bottom tab bar (height mirrors CHROME.mobile.tabBar in layout.js) */}
      <nav
        data-occluder
        aria-label="Sectors"
        className="pointer-events-auto absolute inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line/15 bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden land:hidden"
      >
        {sectors.map((s) => {
          const Icon = sectorIcon(s.icon);
          const active = s.id === activeSectorId;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={active}
              aria-label={`${s.name}: ${s.subtitle}`}
              onClick={() => onSelectSector(s.id)}
              className={`relative flex h-14 touch-manipulation flex-col items-center justify-center gap-1 transition-colors active:bg-accent/10 ${
                active ? 'text-accent' : 'text-muted'
              }`}
            >
              {active && <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 rounded-b bg-accent" />}
              <Icon size={20} aria-hidden />
              <span className="text-[11px] uppercase tracking-normal">{s.short}</span>
            </button>
          );
        })}
      </nav>

      {showReticle && <Reticle slewing={slewing} />}

      {/* Desktop footer telemetry */}
      <footer data-occluder className="pointer-events-auto absolute inset-x-0 bottom-0 hidden border-t border-line/10 bg-gradient-to-t from-bg/90 to-bg/40 px-4 py-2.5 lg:block">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Telemetry label="Cursor RA" value={formatRA(ra)} className="w-28" />
            <Telemetry label="Cursor Dec" value={formatDec(dec)} className="w-28" />
            <Telemetry label="FOV" value={`${fov}°`} className="w-10" />
            <Telemetry label="LST" value={formatRA(lst).slice(0, 7)} className="w-16" />
            <Telemetry label="UTC" value={now.toISOString().slice(11, 19)} className="hidden w-16 xl:flex" />
          </div>
          <div className="flex min-w-0 items-center gap-6">
            <Telemetry label="Site" value={site} className="min-w-0" />
            <Telemetry label="Mount" value={slewing ? 'SLEWING' : 'SIDEREAL'} valueClassName={slewing ? '!text-warn' : ''} />
          </div>
        </div>
      </footer>
    </div>
  );
}
