/**
 * US City Geo-Resolver
 *
 * Extracted from src/sources/geo-resolver.ts for the multi-country architecture.
 * Resolves US city names via Census Geocoder + FCC Area API.
 * Re-exports old types for backward compatibility.
 */

import type { UnifiedGeoResolution } from "../types.js";

const GEOCODER_BASE = "https://geocoding.geo.census.gov/geocoder";
const FCC_API = "https://geo.fcc.gov/api/census/area";

// State FIPS → abbreviation mapping
const STATE_FIPS_TO_ABBREV: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

// Common aliases
const ALIASES: Record<string, string> = {
  "nyc": "new york", "ny": "new york",
  "la": "los angeles", "l.a.": "los angeles",
  "sf": "san francisco",
  "dc": "washington", "d.c.": "washington", "washington dc": "washington",
  "philly": "philadelphia",
  "vegas": "las vegas", "lv": "las vegas",
  "nola": "new orleans",
  "slc": "salt lake city",
  "okc": "oklahoma city",
  "kc": "kansas city",
  "indy": "indianapolis",
  "jax": "jacksonville",
  "cle": "cleveland",
  "pgh": "pittsburgh",
  "stl": "st. louis", "st louis": "st. louis", "saint louis": "st. louis",
  "cincy": "cincinnati",
  "buf": "buffalo",
  "mke": "milwaukee",
  "abq": "albuquerque",
  "rva": "richmond",
  "atl": "atlanta",
  "pdx": "portland",
  "msp": "minneapolis",
  "dtw": "detroit",
  "sea": "seattle",
  "den": "denver",
  "bos": "boston",
  "clt": "charlotte",
  "sac": "sacramento",
};

/** Backward-compat: old GeoResolution type */
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

// In-memory cache
const cache = new Map<string, UnifiedGeoResolution>();

/**
 * Resolve a US city name to geographic identifiers.
 * Returns UnifiedGeoResolution with country: 'US'.
 */
export async function resolveUSCity(input: string): Promise<UnifiedGeoResolution> {
  const normalized = input.toLowerCase().trim();
  const aliased = ALIASES[normalized] || normalized;

  if (cache.has(aliased)) {
    return { ...cache.get(aliased)!, cached: true };
  }

  console.error(`[city-data-mcp] US Geo-resolving: "${input}"`);

  let geoResult = await tryGeocodeWithGeography(aliased);

  if (!geoResult) {
    geoResult = await tryGeocodeWithFallback(aliased, input);
  }

  if (!geoResult) {
    throw new Error(
      `Could not resolve "${input}" to a US location. Try a more specific city name (e.g., "Springfield, IL" instead of "Springfield").`
    );
  }

  cache.set(aliased, geoResult);
  return { ...geoResult, cached: false };
}

/** Backward-compat export matching the old function signature */
export const resolveCity = resolveUSCity;

async function tryGeocodeWithGeography(city: string): Promise<UnifiedGeoResolution | null> {
  try {
    const query = city.includes(",") ? city : `${city}, US`;
    const url = `${GEOCODER_BASE}/geographies/onelineaddress?address=${encodeURIComponent(query)}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const data = await fetchWithTimeout(url, 8000);
    const match = data?.result?.addressMatches?.[0];
    if (!match) return null;

    const lat = parseFloat(match.coordinates.y);
    const lon = parseFloat(match.coordinates.x);
    const matchedAddress = match.matchedAddress || "";

    const geos = match.geographies;
    let stateFips = "";
    let countyFips = "";
    let countyName = "";

    const tract = geos?.["Census Tracts"]?.[0];
    if (tract) {
      stateFips = tract.STATE || "";
      countyFips = tract.COUNTY || "";
    }

    const county = geos?.["Counties"]?.[0];
    if (county) {
      stateFips = stateFips || county.STATE || "";
      countyFips = countyFips || county.COUNTY || "";
      countyName = county.NAME || "";
    }

    const state = geos?.["States"]?.[0];
    if (state && !stateFips) {
      stateFips = state.STATE || "";
    }

    if (!stateFips || !countyFips) return null;

    const stateAbbrev = STATE_FIPS_TO_ABBREV[stateFips] || "";
    const zipMatch = matchedAddress.match(/\b(\d{5})\b/);
    const zip = zipMatch ? zipMatch[1] : null;
    const cityName = extractCityName(matchedAddress, city);

    return {
      input: city,
      city: cityName,
      country: 'US',
      lat,
      lon,
      adminArea: countyName || "Unknown County",
      adminAreaCode: `${stateFips}${countyFips}`,
      stateOrProvince: stateAbbrev,
      cached: false,
      stateFips,
      countyFips,
      fullCountyFips: `${stateFips}${countyFips}`,
      stateAbbrev,
      zip,
    };
  } catch (e) {
    console.error(`[city-data-mcp] US geography geocoder failed:`, e);
    return null;
  }
}

async function tryGeocodeWithFallback(city: string, originalInput: string): Promise<UnifiedGeoResolution | null> {
  try {
    const query = city.includes(",") ? city : `${city}, US`;
    const url = `${GEOCODER_BASE}/locations/onelineaddress?address=${encodeURIComponent(query)}&benchmark=Public_AR_Current&format=json`;
    const data = await fetchWithTimeout(url, 8000);
    const match = data?.result?.addressMatches?.[0];
    if (!match) return null;

    const lat = parseFloat(match.coordinates.y);
    const lon = parseFloat(match.coordinates.x);
    const matchedAddress = match.matchedAddress || "";

    const fccUrl = `${FCC_API}?lat=${lat}&lon=${lon}&format=json`;
    const fccData = await fetchWithTimeout(fccUrl, 5000);
    const fccResult = fccData?.results?.[0];

    if (!fccResult) return null;

    const stateFips = fccResult.state_fips || "";
    const countyFips = fccResult.county_fips?.slice(2) || "";
    const countyName = fccResult.county_name || "Unknown County";
    const stateAbbrev = STATE_FIPS_TO_ABBREV[stateFips] || "";

    const zipMatch = matchedAddress.match(/\b(\d{5})\b/);
    const zip = zipMatch ? zipMatch[1] : null;
    const cityName = extractCityName(matchedAddress, city);

    return {
      input: city,
      city: cityName,
      country: 'US',
      lat,
      lon,
      adminArea: countyName,
      adminAreaCode: `${stateFips}${countyFips}`,
      stateOrProvince: stateAbbrev,
      cached: false,
      stateFips,
      countyFips,
      fullCountyFips: `${stateFips}${countyFips}`,
      stateAbbrev,
      zip,
    };
  } catch (e) {
    console.error(`[city-data-mcp] US fallback geocoder failed:`, e);
    return null;
  }
}

function extractCityName(matchedAddress: string, fallback: string): string {
  const parts = matchedAddress.split(",").map(p => p.trim());
  if (parts.length >= 2) {
    const candidate = /\d/.test(parts[0]) ? parts[1] : parts[0];
    if (candidate && candidate.length > 1) return candidate;
  }
  return fallback.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export async function fetchWithTimeout(url: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function isCached(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  const aliased = ALIASES[normalized] || normalized;
  return cache.has(aliased);
}
