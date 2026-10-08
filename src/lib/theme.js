import { useEffect, useState } from 'react';
import * as THREE from 'three';

const TOKENS = ['bg', 'accent', 'accent-2', 'text', 'muted', 'star', 'star-warm', 'star-cool', 'nebula-1', 'nebula-2', 'nebula-3'];

/* Parses a `--token: r g b` custom property into a THREE.Color. */
export function readToken(name, el = document.documentElement) {
  const raw = getComputedStyle(el).getPropertyValue(`--${name}`).trim();
  const [r, g, b] = raw.split(/\s+/).map(Number);
  if ([r, g, b].some((n) => Number.isNaN(n))) return new THREE.Color('#ffffff');
  // Tokens are sRGB; convert into three's linear working space so on-screen colour matches the CSS.
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}

export function readThemeColors() {
  return Object.fromEntries(TOKENS.map((t) => [t, readToken(t)]));
}

/*
 * Returns THREE.Color versions of the CSS theme tokens, re-read whenever the
 * theme flips. App applies `data-theme` in a layout effect, which always runs
 * before this passive effect, so the computed styles are already current.
 */
export function useThemeColors(theme) {
  const [colors, setColors] = useState(() => readThemeColors());
  useEffect(() => {
    setColors(readThemeColors());
  }, [theme]);
  return colors;
}
