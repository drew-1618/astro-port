import { Aperture, Orbit, Radar, RadioTower, Sparkles, Star } from 'lucide-react';

/* Sector `icon` strings in portfolioData resolve through this map. */
const ICONS = { Aperture, Orbit, Radar, RadioTower, Sparkles };

export function sectorIcon(name) {
  return ICONS[name] || Star;
}
