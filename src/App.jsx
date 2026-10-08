import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, MapPin, RadioTower } from 'lucide-react';
import * as data from './data/portfolioData';
import { buildSky, homePose, itemPose, sectorPose } from './lib/celestial';
import { constellations } from './data/skyCatalog';
import { SkyContext } from './lib/skyContext';
import { useLayout, useMediaQuery, useViewport, viewportInsets } from './lib/layout';
import { useAmbientAudio } from './lib/useAmbientAudio';
import StarfieldCanvas from './components/StarfieldCanvas';
import HudOverlay from './components/HudOverlay';
import SectorPanel from './components/SectorPanel';
import ObservationModal from './components/ObservationModal';

const { profile, sectors, collections, sectorItems, itemLabel } = data;
const THEME_KEY = 'astro-port:theme';

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'red' ? 'red' : 'sky';
  } catch {
    return 'sky';
  }
}

/*
 * Intro card shown on the all-sky view. Sits above the tab bar on phones,
 * bottom-right on desktop, and as a compact right-hand card in landscape.
 */
function WelcomeCard({ onBegin, onComms, touch }) {
  return (
    <section className="glass reticle pointer-events-auto fixed inset-x-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-20 rounded-sm p-4 lg:inset-x-auto lg:bottom-20 lg:right-6 lg:w-[400px] land:inset-x-auto land:bottom-2 land:right-[max(0.5rem,env(safe-area-inset-right))] land:w-[min(340px,45vw)] land:p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent sm:tracking-[0.25em]">Observatory online · all-sky view</p>
      <h1 className="mt-1.5 text-lg font-semibold text-ink sm:text-xl land:text-base">{profile.name}</h1>
      <p className="flex items-center gap-1 font-mono text-[11px] text-muted">
        <MapPin size={12} aria-hidden /> {profile.location}
      </p>
      <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink/80 sm:line-clamp-none sm:text-sm land:hidden">{profile.summary}</p>
      <p className="mt-2 text-xs text-muted land:mt-1">
        {touch
          ? 'Tap a sector or any star to inspect it. Drag to look around, pinch to zoom.'
          : 'Pick a sector to slew the mount, or click any star to inspect it. Drag to look around, scroll to zoom.'}
      </p>
      <div className="mt-3 flex gap-2 land:mt-2">
        <button type="button" onClick={onBegin} className="hud-btn flex-1 border-accent/60 text-accent hover:bg-accent/10 sm:flex-none">
          Begin survey <ArrowRight size={13} aria-hidden />
        </button>
        <button type="button" onClick={onComms} className="hud-btn flex-1 sm:flex-none">
          <RadioTower size={13} aria-hidden /> Open comms
        </button>
      </div>
    </section>
  );
}

export default function App() {
  const [theme, setTheme] = useState(readStoredTheme);
  const [activeSectorId, setActiveSectorId] = useState(null);
  const [focused, setFocused] = useState(null); // { sectorId, itemId }
  const [modal, setModal] = useState(null); // { kind, sectorId, itemId }
  const [highlightId, setHighlightId] = useState(null);
  const [slewing, setSlewing] = useState(false);
  // Bumped on every navigation request so the camera re-slews even after the user has dragged away.
  const [slewRequest, setSlewRequest] = useState(0);
  const cameraRef = useRef(null);
  const audio = useAmbientAudio();
  const { blip } = audio;

  const [sheetCollapsed, setSheetCollapsed] = useState(false);
  const layout = useLayout();
  const viewport = useViewport();
  const touch = useMediaQuery('(pointer: coarse)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // Theme must land on <html> before the canvas re-reads its colour tokens.
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'red' ? '#080202' : '#060813');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage unavailable — theme just won't persist */
    }
  }, [theme]);

  const sky = useMemo(() => buildSky(sectors, constellations, sectorItems), []);

  const activeSector = sectors.find((s) => s.id === activeSectorId) || null;

  // Camera framing accounts for the screen shape and whatever UI currently covers it.
  const pose = useMemo(() => {
    const view = {
      aspect: viewport.w / viewport.h,
      insets: viewportInsets(layout, viewport, {
        panelOpen: Boolean(activeSector),
        sheetCollapsed,
        welcomeOpen: !activeSector,
      }),
    };
    const star = focused && sky.byItem[focused.itemId];
    if (star) return itemPose(star.position, view);
    if (activeSector) return sectorPose(sky.sectors[activeSector.id], view);
    return homePose(sky, view);
    // slewRequest forces a fresh pose object (and so a slew) even when nothing else changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused, activeSector, layout, viewport, sheetCollapsed, sky, slewRequest]);

  const targetLabel = useMemo(() => {
    const star = focused && sky.byItem[focused.itemId];
    if (star) return `${itemLabel(star.item).toUpperCase()} · ${star.deepSky ? star.name.toUpperCase() : star.designation}`;
    return activeSector
      ? `${activeSector.name} · ${sky.sectors[activeSector.id].constellation}`.toUpperCase()
      : 'ALL-SKY · WINTER HEXAGON';
  }, [focused, activeSector, sky]);

  const selectSector = useCallback(
    (id) => {
      setActiveSectorId(id);
      setFocused(null);
      setModal(null);
      setHighlightId(null);
      setSheetCollapsed(false);
      setSlewRequest((n) => n + 1);
      blip();
    },
    [blip],
  );

  const selectItem = useCallback(
    (sectorId, itemId) => {
      const sector = sectors.find((s) => s.id === sectorId);
      setActiveSectorId(sectorId);
      setFocused({ sectorId, itemId });
      setHighlightId(itemId);
      const isContentItem = (collections[sector.key] || []).some((i) => i.id === itemId);
      setModal(sector.modalKind && isContentItem ? { kind: sector.modalKind, sectorId, itemId } : null);
      setSlewRequest((n) => n + 1);
      blip();
    },
    [blip],
  );

  const openFromPanel = useCallback((kind, item) => {
    const sector = sectors.find((s) => s.modalKind === kind);
    setFocused({ sectorId: sector.id, itemId: item.id });
    setHighlightId(item.id);
    setModal({ kind, sectorId: sector.id, itemId: item.id });
    setSlewRequest((n) => n + 1);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setFocused(null);
    setSlewRequest((n) => n + 1);
  }, []);

  const navigateModal = useCallback((item) => {
    setModal((m) => (m ? { ...m, itemId: item.id } : m));
    setFocused((f) => (f ? { ...f, itemId: item.id } : f));
    setHighlightId(item.id);
    setSlewRequest((n) => n + 1);
  }, []);

  const recenter = useCallback(() => {
    setActiveSectorId(null);
    setFocused(null);
    setModal(null);
    setHighlightId(null);
    setSlewRequest((n) => n + 1);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !modal && activeSectorId) recenter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, activeSectorId, recenter]);

  const modalSector = modal && sectors.find((s) => s.id === modal.sectorId);
  const modalItems = modalSector ? collections[modalSector.key] : [];
  const modalItem = modal && modalItems.find((i) => i.id === modal.itemId);

  return (
    <SkyContext.Provider value={sky}>
      <StarfieldCanvas
        theme={theme}
        sectors={sectors}
        sky={sky}
        activeSectorId={activeSectorId}
        focusedItemId={focused?.itemId ?? null}
        pose={pose}
        reducedMotion={reducedMotion}
        cameraRef={cameraRef}
        onSelectSector={selectSector}
        onSelectItem={selectItem}
        onSlewChange={setSlewing}
      />
      <div className="viewport-vignette" aria-hidden />

      <HudOverlay
        profile={profile}
        sectors={sectors}
        activeSectorId={activeSectorId}
        targetLabel={targetLabel}
        slewing={slewing}
        redMode={theme === 'red'}
        audioOn={audio.enabled}
        cameraRef={cameraRef}
        showReticle={layout === 'desktop' || !activeSector}
        onToggleRed={() => setTheme((t) => (t === 'red' ? 'sky' : 'red'))}
        onToggleAudio={audio.toggle}
        onRecenter={recenter}
        onSelectSector={selectSector}
      />

      {!activeSector && (
        <WelcomeCard
          touch={touch}
          onBegin={() => selectSector(sectors[0].id)}
          onComms={() => selectItem('epsilon', 'comms')}
        />
      )}

      {activeSector && (
        <SectorPanel
          sector={activeSector}
          data={{ ...collections, profile }}
          highlightId={highlightId}
          collapsed={layout === 'mobile' && sheetCollapsed}
          onCollapsedChange={setSheetCollapsed}
          onOpen={openFromPanel}
          onClose={recenter}
        />
      )}

      {modalItem && (
        <ObservationModal
          kind={modal.kind}
          item={modalItem}
          items={modalItems}
          onClose={closeModal}
          onNavigate={navigateModal}
        />
      )}
    </SkyContext.Provider>
  );
}
