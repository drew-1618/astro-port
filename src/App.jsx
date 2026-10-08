import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, MapPin, RadioTower } from 'lucide-react';
import * as data from './data/portfolioData';
import { buildSky, homePose, itemPose, sectorPose } from './lib/celestial';
import { constellations, contextConstellations } from './data/skyCatalog';
import { SkyContext } from './lib/skyContext';
import { DESKTOP_QUERY, useLayout, useMediaQuery, useViewport, viewportInsets } from './lib/layout';
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
 * Collapses to a small pill so it doesn't cover the sky.
 */
function WelcomeCard({ collapsed, onToggle, onBegin, onComms, touch }) {
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded="false"
        aria-label={`About ${profile.name}`}
        data-occluder
        className="glass reticle pointer-events-auto fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] left-3 z-20 flex touch-manipulation items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3.5 transition-colors hover:border-accent/50 active:bg-accent/10 lg:bottom-20 lg:left-auto lg:right-6 land:bottom-2 land:left-auto land:right-[max(0.5rem,env(safe-area-inset-right))]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full border border-accent/50 font-mono text-xs font-bold text-accent">{profile.initials}</span>
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-ink/80">About</span>
        <ChevronUp size={14} aria-hidden className="text-muted" />
      </button>
    );
  }
  return (
    <section data-occluder className="glass reticle pointer-events-auto fixed inset-x-3 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] z-20 rounded-sm p-4 lg:inset-x-auto lg:bottom-20 lg:right-6 lg:w-[400px] land:inset-x-auto land:bottom-2 land:right-[max(0.5rem,env(safe-area-inset-right))] land:w-[min(340px,45vw)] land:p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-accent sm:tracking-[0.18em]">Observatory online · all-sky view</p>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded="true"
          aria-label="Collapse intro"
          className="hud-btn -mr-1 -mt-1 min-h-[32px] min-w-[32px] shrink-0 px-1.5"
        >
          <ChevronDown size={15} aria-hidden />
        </button>
      </div>
      <h1 className="text-lg font-semibold text-ink sm:text-xl land:text-base">{profile.name}</h1>
      <p className="flex items-center gap-1 font-mono text-[13px] text-muted">
        <MapPin size={12} aria-hidden /> {profile.location}
      </p>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink/80 sm:line-clamp-none sm:text-[15px] land:hidden">{profile.summary}</p>
      <p className="mt-2 text-[13px] text-muted land:mt-1">
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

const WELCOME_KEY = 'astro-port:welcome';

/* Remembered per visitor; first visit starts collapsed on phones (sky first) and open on desktop. */
function readWelcomeCollapsed() {
  try {
    const saved = localStorage.getItem(WELCOME_KEY);
    if (saved) return saved === 'collapsed';
  } catch {
    /* storage unavailable */
  }
  return !window.matchMedia(DESKTOP_QUERY).matches;
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
  /*
   * Where the mount is pointed: { type: 'home' } | { type: 'sector', sectorId } |
   * { type: 'item', sectorId, itemId }. Only explicit navigation (sectors, stars,
   * cards, Recenter) changes it. Closing panels / detail views leaves it alone,
   * so the camera stays put and the visitor can keep looking around from there.
   */
  const [aim, setAim] = useState({ type: 'home' });
  const goTo = useCallback((next) => {
    setAim(next);
    setSlewRequest((n) => n + 1);
  }, []);
  const cameraRef = useRef(null);
  const audio = useAmbientAudio();
  const { blip } = audio;

  const [sheetCollapsed, setSheetCollapsed] = useState(false);
  const [welcomeCollapsed, setWelcomeCollapsed] = useState(readWelcomeCollapsed);
  // Read by the framing below without being a dependency: folding the intro card
  // shouldn't yank the camera, but the next slew (e.g. Recenter) uses the freed space.
  const welcomeCollapsedRef = useRef(welcomeCollapsed);
  welcomeCollapsedRef.current = welcomeCollapsed;
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

  const sky = useMemo(() => buildSky(sectors, constellations, sectorItems, contextConstellations), []);

  const activeSector = sectors.find((s) => s.id === activeSectorId) || null;

  // Read at slew time only: resizing, rotating or folding the sheet never yanks the camera.
  const frameRef = useRef();
  frameRef.current = { layout, viewport, sheetCollapsed };

  // A new pose (and so a slew) is computed only when navigation bumps slewRequest.
  const pose = useMemo(() => {
    const { layout: lay, viewport: vp, sheetCollapsed: sheet } = frameRef.current;
    const home = aim.type === 'home';
    const view = {
      aspect: vp.w / vp.h,
      insets: viewportInsets(lay, vp, {
        panelOpen: !home, // navigating to a sector or star opens its panel
        sheetCollapsed: !home && sheet,
        welcome: home ? (welcomeCollapsedRef.current ? 'collapsed' : 'open') : 'hidden',
      }),
    };
    const star = aim.type === 'item' && sky.byItem[aim.itemId];
    if (star) return itemPose(star.position, view);
    if (aim.type !== 'home') return sectorPose(sky.sectors[aim.sectorId], view);
    return homePose(sky, view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sky, slewRequest]);

  const targetLabel = useMemo(() => {
    const star = aim.type === 'item' && sky.byItem[aim.itemId];
    if (star) return `${itemLabel(star.item).toUpperCase()} · ${star.deepSky ? star.name.toUpperCase() : star.designation}`;
    const sector = aim.type === 'sector' && sectors.find((s) => s.id === aim.sectorId);
    return sector
      ? `${sector.name} · ${sky.sectors[sector.id].constellation}`.toUpperCase()
      : null; // nothing selected: the HUD names whatever constellation is in view
  }, [aim, sky]);

  const selectSector = useCallback(
    (id) => {
      setActiveSectorId(id);
      setFocused(null);
      setModal(null);
      setHighlightId(null);
      setSheetCollapsed(false);
      goTo({ type: 'sector', sectorId: id });
      blip();
    },
    [blip, goTo],
  );

  const selectItem = useCallback(
    (sectorId, itemId) => {
      const sector = sectors.find((s) => s.id === sectorId);
      setActiveSectorId(sectorId);
      setFocused({ sectorId, itemId });
      setHighlightId(itemId);
      const isContentItem = (collections[sector.key] || []).some((i) => i.id === itemId);
      setModal(sector.modalKind && isContentItem ? { kind: sector.modalKind, sectorId, itemId } : null);
      goTo({ type: 'item', sectorId, itemId });
      blip();
    },
    [blip, goTo],
  );

  const openFromPanel = useCallback(
    (kind, item) => {
      const sector = sectors.find((s) => s.modalKind === kind);
      setFocused({ sectorId: sector.id, itemId: item.id });
      setHighlightId(item.id);
      setModal({ kind, sectorId: sector.id, itemId: item.id });
      goTo({ type: 'item', sectorId: sector.id, itemId: item.id });
    },
    [goTo],
  );

  // Cards without a detail view (skill groups, schools, comms): just slew to their star.
  const locateFromPanel = useCallback(
    (itemId) => {
      if (!activeSectorId) return;
      setFocused({ sectorId: activeSectorId, itemId });
      setHighlightId(itemId);
      goTo({ type: 'item', sectorId: activeSectorId, itemId });
      blip();
    },
    [activeSectorId, blip, goTo],
  );

  // Closing a detail view keeps the camera where it is.
  const closeModal = useCallback(() => setModal(null), []);

  const navigateModal = useCallback(
    (item) => {
      setModal((m) => (m ? { ...m, itemId: item.id } : m));
      setFocused((f) => (f ? { ...f, itemId: item.id } : f));
      setHighlightId(item.id);
      setAim((a) => (a.type === 'item' ? { ...a, itemId: item.id } : a));
      setSlewRequest((n) => n + 1);
    },
    [],
  );

  // Closing the sector panel also leaves the camera where it is; only Recenter goes home.
  const closePanel = useCallback(() => {
    setActiveSectorId(null);
    setFocused(null);
    setModal(null);
    setHighlightId(null);
  }, []);

  const toggleWelcome = useCallback(() => {
    setWelcomeCollapsed((c) => {
      try {
        localStorage.setItem(WELCOME_KEY, c ? 'open' : 'collapsed');
      } catch {
        /* storage unavailable — choice just won't persist */
      }
      return !c;
    });
  }, []);

  const recenter = useCallback(() => {
    closePanel();
    goTo({ type: 'home' });
  }, [closePanel, goTo]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !modal && activeSectorId) closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, activeSectorId, closePanel]);

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
        targetPoint={pose.target}
        fields={sky.fields}
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
          collapsed={welcomeCollapsed}
          onToggle={toggleWelcome}
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
          onLocate={locateFromPanel}
          onClose={closePanel}
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
