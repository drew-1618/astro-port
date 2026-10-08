import { createContext, useContext } from 'react';

/* The built sky (see buildSky in celestial.js), shared so UI can show which real star an item maps to. */
export const SkyContext = createContext(null);

/* Star info ({ name, designation, constellation, ra, dec, ly, deepSky }) for an item id, or null. */
export function useStarFor(itemId) {
  return useContext(SkyContext)?.byItem[itemId] ?? null;
}

export function useSkySector(sectorId) {
  return useContext(SkyContext)?.sectors[sectorId] ?? null;
}
