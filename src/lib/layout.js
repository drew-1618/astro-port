import { useEffect, useState } from 'react';

/*
 * Three layouts:
 *   desktop   ≥1024px wide: left sector dock, right side panel, footer telemetry.
 *   mobile    portrait phones/tablets: bottom tab bar + collapsible bottom sheet.
 *   landscape phones on their side: left icon rail + right side panel.
 * LANDSCAPE_QUERY must match the `land` screen in tailwind.config.js.
 */
export const DESKTOP_QUERY = '(min-width: 1024px)';
export const LANDSCAPE_QUERY = '(orientation: landscape) and (max-height: 540px) and (max-width: 1023px)';

/*
 * Pixel sizes of the fixed UI chrome, used to keep camera framing clear of it.
 * They mirror the Tailwind classes in HudOverlay / SectorPanel / WelcomeCard.
 */
const CHROME = {
  desktop: { header: 72, footer: 52, dock: 256, panel: (w) => Math.min(540, w * 0.42) + 24 },
  mobile: { header: 100, tabBar: 56, sheet: (h) => h * 0.52 + 8, sheetCollapsed: 92, welcome: 268, welcomePill: 76 },
  landscape: { header: 48, rail: 60, panel: (w) => Math.min(420, w * 0.5) + 16, welcome: (w) => Math.min(340, w * 0.45) + 16 },
};

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export function useLayout() {
  const desktop = useMediaQuery(DESKTOP_QUERY);
  const landscape = useMediaQuery(LANDSCAPE_QUERY);
  return landscape ? 'landscape' : desktop ? 'desktop' : 'mobile';
}

/* Viewport size, debounced so dragging a window edge doesn't re-slew the camera every frame. */
export function useViewport(delay = 200) {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    let timer;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setSize({ w: window.innerWidth, h: window.innerHeight }), delay);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [delay]);
  return size;
}

/*
 * Fractions of the viewport covered by UI on each side, given what's open.
 * `welcome` is the intro card's state: 'open' | 'collapsed' (pill) | 'hidden'.
 * The camera framing (framePose in celestial.js) fits targets into the rest.
 */
export function viewportInsets(layout, { w, h }, { panelOpen, sheetCollapsed, welcome = 'hidden' }) {
  const px = { top: 0, right: 0, bottom: 0, left: 0 };
  if (layout === 'desktop') {
    const c = CHROME.desktop;
    px.top = c.header;
    px.bottom = c.footer;
    px.left = c.dock;
    if (panelOpen) px.right = c.panel(w);
  } else if (layout === 'landscape') {
    const c = CHROME.landscape;
    px.top = c.header;
    px.bottom = 8;
    px.left = c.rail;
    if (panelOpen) px.right = c.panel(w);
    else if (welcome === 'open') px.right = c.welcome(w);
  } else {
    const c = CHROME.mobile;
    px.top = c.header;
    px.bottom = c.tabBar;
    if (panelOpen) px.bottom += sheetCollapsed ? c.sheetCollapsed : c.sheet(h);
    else if (welcome === 'open') px.bottom += c.welcome;
    else if (welcome === 'collapsed') px.bottom += c.welcomePill;
  }
  return { top: px.top / h, right: px.right / w, bottom: px.bottom / h, left: px.left / w };
}
