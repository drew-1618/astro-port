import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { sectorIcon } from './ui/icons';
import { formatDec, formatRA } from '../lib/celestial';
import { useSkySector } from '../lib/skyContext';
import ProjectsSection from './sections/ProjectsSection';
import ExperienceSection from './sections/ExperienceSection';
import SkillsSection from './sections/SkillsSection';
import OriginsSection from './sections/OriginsSection';
import GallerySection from './GallerySection';

/*
 * Drawer listing the active sector's content.
 *   desktop / landscape: right-hand side panel.
 *   mobile: bottom sheet above the tab bar. Tap the grab handle or swipe the
 *   header down to collapse it to just its header (more sky visible), swipe
 *   up to expand. Heights mirror CHROME.mobile in src/lib/layout.js.
 * When `highlightId` changes (a star was tapped) the matching entry scrolls into view.
 */
export default function SectorPanel({ sector, data, highlightId, collapsed, onCollapsedChange, onOpen, onLocate, onClose }) {
  const scrollRef = useRef(null);
  const touchStart = useRef(null);
  const Icon = sectorIcon(sector.icon);
  const skySector = useSkySector(sector.id);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [sector.id]);

  useEffect(() => {
    if (!highlightId) return;
    onCollapsedChange(false);
    // Wait a frame so an expanding sheet has its full height before scrolling.
    const id = requestAnimationFrame(() => {
      const el = scrollRef.current?.querySelector(`#item-${CSS.escape(highlightId)}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [highlightId, onCollapsedChange]);

  const onTouchStart = (e) => {
    touchStart.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e) => {
    if (touchStart.current == null) return;
    const dy = e.changedTouches[0].clientY - touchStart.current;
    touchStart.current = null;
    if (dy > 40) onCollapsedChange(true);
    else if (dy < -40) onCollapsedChange(false);
  };

  const content = {
    projects: <ProjectsSection projects={data.projects} highlightId={highlightId} onOpen={onOpen} />,
    experience: <ExperienceSection experience={data.experience} highlightId={highlightId} onOpen={onOpen} />,
    skills: <SkillsSection skills={data.skills} highlightId={highlightId} onLocate={onLocate} />,
    astrophotos: <GallerySection photos={data.astrophotos} highlightId={highlightId} onOpen={onOpen} />,
    education: <OriginsSection education={data.education} profile={data.profile} highlightId={highlightId} onLocate={onLocate} />,
  }[sector.key];

  return (
    <aside
      data-occluder
      key={sector.id}
      aria-label={`${sector.name}: ${sector.subtitle}`}
      className={`glass pointer-events-auto fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 flex flex-col overflow-hidden rounded-t-xl border-b-0 transition-[max-height] duration-300 ease-out animate-[panelUp_.4s_ease-out] ${
        collapsed ? 'max-h-[100px]' : 'max-h-[52dvh]'
      } lg:inset-x-auto lg:bottom-16 lg:right-4 lg:top-20 lg:max-h-none lg:w-[min(540px,42vw)] lg:animate-[panelIn_.5s_ease-out] lg:rounded-sm lg:border-b land:inset-x-auto land:bottom-2 land:right-[max(0.5rem,env(safe-area-inset-right))] land:top-14 land:max-h-none land:w-[min(420px,50vw)] land:animate-[panelIn_.4s_ease-out] land:rounded-md land:border-b`}
    >
      <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="shrink-0 touch-none lg:touch-auto land:touch-auto">
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
          aria-expanded={!collapsed}
          className="flex w-full justify-center pb-1 pt-2 lg:hidden land:hidden"
        >
          <span aria-hidden className="h-1 w-10 rounded-full bg-muted/50" />
        </button>
        <header className="flex items-start justify-between gap-3 border-b border-line/15 px-4 pb-3 pt-1 lg:pt-3 land:py-2">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 hidden h-8 w-8 shrink-0 place-items-center rounded-sm border border-accent/40 text-accent sm:grid">
              <Icon size={16} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate font-mono text-xs uppercase tracking-[0.12em] text-accent sm:tracking-[0.18em]">
                {sector.name} · {skySector.constellation}
                <span className="hidden sm:inline">
                  {' '}
                  · RA {formatRA(skySector.ra).slice(0, 7)} · Dec {formatDec(skySector.dec).slice(0, 8)}
                </span>
              </p>
              <h2 className="truncate text-lg font-semibold text-ink">{sector.subtitle}</h2>
              <p className="truncate text-[13px] text-muted">{sector.description}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="hud-btn min-w-[40px] shrink-0 px-2" aria-label="Close sector panel">
            <X size={15} aria-hidden />
          </button>
        </header>
      </div>
      <div
        ref={scrollRef}
        className={`scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 ${collapsed ? 'invisible lg:visible land:visible' : ''}`}
      >
        {content}
      </div>
    </aside>
  );
}
