/**
 * Backward-compatibility shim.
 *
 * The geo resolver has moved to src/geo/us-resolver.ts as part of the
 * multi-country refactor. This file re-exports a `resolveCity` that
 * returns the old `GeoResolution` shape (all fields required).
 */

import { resolveUSCity, fetchWithTimeout, isCached } from "../geo/us-resolver.js";

export { fetchWithTimeout, isCached };

export interface GeoResolution {
  input: string;
  city: string;
  lat: number;
  lon: number;
  stateFips: string;
  countyFips: string;
  fullCountyFips: string;
  countyName: string;
  stateAbbrev: string;
  zip: string | null;
  cached: boolean;
}

/**
 * Resolve a US city name — returns the old GeoResolution shape.
 */
export async function resolveCity(input: string): Promise<GeoResolution> {
  const unified = await resolveUSCity(input);
  return {
    input: unified.input,
    city: unified.city,
    lat: unified.lat,
    lon: unified.lon,
    stateFips: unified.stateFips || "",
    countyFips: unified.countyFips || "",
    fullCountyFips: unified.fullCountyFips || "",
    countyName: unified.adminArea || "Unknown County",
    stateAbbrev: unified.stateAbbrev || "",
    zip: unified.zip ?? null,
    cached: unified.cached,
  };
}

export function prewarmCache(_entries: Array<{ city: string; lat: number; lon: number; stateFips: string; countyFips: string; countyName: string; stateAbbrev: string; zip?: string }>) {
  // No-op — the new resolver has its own cache
}
