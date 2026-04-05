/**
 * Canada City Geo-Resolver
 *
 * Resolves Canadian city names using:
 * 1. Built-in lookup table of ~40 major Canadian cities
 * 2. Fallback to geocoder.ca API
 *
 * Returns UnifiedGeoResolution with country: 'CA'.
 */

import type { UnifiedGeoResolution } from "../types.js";
import { fetchWithTimeout } from "./us-resolver.js";

// ── Province codes ──────────────────────────────────────────────────────────

const PROVINCE_NAMES: Record<string, string> = {
  "AB": "Alberta", "BC": "British Columbia", "MB": "Manitoba",
  "NB": "New Brunswick", "NL": "Newfoundland and Labrador",
  "NS": "Nova Scotia", "NT": "Northwest Territories", "NU": "Nunavut",
  "ON": "Ontario", "PE": "Prince Edward Island", "QC": "Quebec",
  "SK": "Saskatchewan", "YT": "Yukon",
};

// ── Major Canadian Cities Lookup ────────────────────────────────────────────

interface CACityEntry {
  name: string;
  lat: number;
  lon: number;
  censusDivisionId: string;
  provinceCode: string;
  cmaCode?: string; // Census Metropolitan Area code
}

const CA_CITIES: Record<string, CACityEntry> = {
  "toronto": { name: "Toronto", lat: 43.6532, lon: -79.3832, censusDivisionId: "3520", provinceCode: "ON", cmaCode: "535" },
  "vancouver": { name: "Vancouver", lat: 49.2827, lon: -123.1207, censusDivisionId: "5915", provinceCode: "BC", cmaCode: "933" },
  "montreal": { name: "Montreal", lat: 45.5017, lon: -73.5673, censusDivisionId: "2466", provinceCode: "QC", cmaCode: "462" },
  "montréal": { name: "Montreal", lat: 45.5017, lon: -73.5673, censusDivisionId: "2466", provinceCode: "QC", cmaCode: "462" },
  "calgary": { name: "Calgary", lat: 51.0447, lon: -114.0719, censusDivisionId: "4806", provinceCode: "AB", cmaCode: "825" },
  "ottawa": { name: "Ottawa", lat: 45.4215, lon: -75.6972, censusDivisionId: "3506", provinceCode: "ON", cmaCode: "505" },
  "edmonton": { name: "Edmonton", lat: 53.5461, lon: -113.4938, censusDivisionId: "4811", provinceCode: "AB", cmaCode: "835" },
  "winnipeg": { name: "Winnipeg", lat: 49.8951, lon: -97.1384, censusDivisionId: "4611", provinceCode: "MB", cmaCode: "602" },
  "quebec city": { name: "Quebec City", lat: 46.8139, lon: -71.2080, censusDivisionId: "2420", provinceCode: "QC", cmaCode: "421" },
  "québec": { name: "Quebec City", lat: 46.8139, lon: -71.2080, censusDivisionId: "2420", provinceCode: "QC", cmaCode: "421" },
  "hamilton": { name: "Hamilton", lat: 43.2557, lon: -79.8711, censusDivisionId: "3525", provinceCode: "ON", cmaCode: "537" },
  "kitchener": { name: "Kitchener", lat: 43.4516, lon: -80.4925, censusDivisionId: "3530", provinceCode: "ON", cmaCode: "541" },
  "london": { name: "London", lat: 42.9849, lon: -81.2453, censusDivisionId: "3539", provinceCode: "ON", cmaCode: "555" },
  "halifax": { name: "Halifax", lat: 44.6488, lon: -63.5752, censusDivisionId: "1209", provinceCode: "NS", cmaCode: "205" },
  "victoria": { name: "Victoria", lat: 48.4284, lon: -123.3656, censusDivisionId: "5917", provinceCode: "BC", cmaCode: "935" },
  "oshawa": { name: "Oshawa", lat: 43.8971, lon: -78.8658, censusDivisionId: "3518", provinceCode: "ON", cmaCode: "532" },
  "windsor": { name: "Windsor", lat: 42.3149, lon: -83.0364, censusDivisionId: "3537", provinceCode: "ON", cmaCode: "559" },
  "saskatoon": { name: "Saskatoon", lat: 52.1332, lon: -106.6700, censusDivisionId: "4711", provinceCode: "SK", cmaCode: "725" },
  "regina": { name: "Regina", lat: 50.4452, lon: -104.6189, censusDivisionId: "4706", provinceCode: "SK", cmaCode: "705" },
  "st. john's": { name: "St. John's", lat: 47.5615, lon: -52.7126, censusDivisionId: "1001", provinceCode: "NL", cmaCode: "001" },
  "st john's": { name: "St. John's", lat: 47.5615, lon: -52.7126, censusDivisionId: "1001", provinceCode: "NL", cmaCode: "001" },
  "barrie": { name: "Barrie", lat: 44.3894, lon: -79.6903, censusDivisionId: "3543", provinceCode: "ON", cmaCode: "568" },
  "kelowna": { name: "Kelowna", lat: 49.8880, lon: -119.4960, censusDivisionId: "5935", provinceCode: "BC", cmaCode: "915" },
  "abbotsford": { name: "Abbotsford", lat: 49.0504, lon: -122.3045, censusDivisionId: "5909", provinceCode: "BC", cmaCode: "932" },
  "kingston": { name: "Kingston", lat: 44.2312, lon: -76.4860, censusDivisionId: "3510", provinceCode: "ON", cmaCode: "521" },
  "sudbury": { name: "Sudbury", lat: 46.4917, lon: -80.9930, censusDivisionId: "3553", provinceCode: "ON", cmaCode: "580" },
  "greater sudbury": { name: "Sudbury", lat: 46.4917, lon: -80.9930, censusDivisionId: "3553", provinceCode: "ON", cmaCode: "580" },
  "thunder bay": { name: "Thunder Bay", lat: 48.3809, lon: -89.2477, censusDivisionId: "3558", provinceCode: "ON", cmaCode: "595" },
  "moncton": { name: "Moncton", lat: 46.0878, lon: -64.7782, censusDivisionId: "1307", provinceCode: "NB", cmaCode: "305" },
  "fredericton": { name: "Fredericton", lat: 45.9636, lon: -66.6431, censusDivisionId: "1310", provinceCode: "NB", cmaCode: "320" },
  "charlottetown": { name: "Charlottetown", lat: 46.2382, lon: -63.1311, censusDivisionId: "1102", provinceCode: "PE" },
  "whitehorse": { name: "Whitehorse", lat: 60.7212, lon: -135.0568, censusDivisionId: "6001", provinceCode: "YT" },
  "yellowknife": { name: "Yellowknife", lat: 62.4540, lon: -114.3718, censusDivisionId: "6106", provinceCode: "NT" },
  "mississauga": { name: "Mississauga", lat: 43.5890, lon: -79.6441, censusDivisionId: "3521", provinceCode: "ON" },
  "brampton": { name: "Brampton", lat: 43.7315, lon: -79.7624, censusDivisionId: "3521", provinceCode: "ON" },
  "surrey": { name: "Surrey", lat: 49.1913, lon: -122.8490, censusDivisionId: "5915", provinceCode: "BC" },
  "burnaby": { name: "Burnaby", lat: 49.2488, lon: -122.9805, censusDivisionId: "5915", provinceCode: "BC" },
  "laval": { name: "Laval", lat: 45.6066, lon: -73.7124, censusDivisionId: "2465", provinceCode: "QC" },
  "gatineau": { name: "Gatineau", lat: 45.4765, lon: -75.7013, censusDivisionId: "2481", provinceCode: "QC" },
};

// In-memory cache
const cache = new Map<string, UnifiedGeoResolution>();

/**
 * Resolve a Canadian city name to geographic identifiers.
 */
export async function resolveCACity(input: string): Promise<UnifiedGeoResolution> {
  const normalized = input.toLowerCase().trim();

  if (cache.has(normalized)) {
    return { ...cache.get(normalized)!, cached: true };
  }

  console.error(`[city-data-mcp] CA Geo-resolving: "${input}"`);

  // Step 1: Check built-in lookup table
  const lookup = CA_CITIES[normalized];
  if (lookup) {
    const result: UnifiedGeoResolution = {
      input,
      city: lookup.name,
      country: 'CA',
      lat: lookup.lat,
      lon: lookup.lon,
      adminArea: lookup.name,
      adminAreaCode: lookup.censusDivisionId,
      stateOrProvince: PROVINCE_NAMES[lookup.provinceCode] || lookup.provinceCode,
      cached: false,
      censusDivisionId: lookup.censusDivisionId,
      provinceCode: lookup.provinceCode,
    };
    cache.set(normalized, result);
    return result;
  }

  // Step 2: Try geocoder.ca API
  const result = await resolveViaGeocoderCA(input);
  if (result) {
    cache.set(normalized, result);
    return result;
  }

  throw new Error(
    `Could not resolve "${input}" to a Canadian location. Try a well-known Canadian city name (e.g., "Toronto", "Vancouver", "Montreal").`
  );
}

async function resolveViaGeocoderCA(query: string): Promise<UnifiedGeoResolution | null> {
  try {
    const url = `https://geocoder.ca/?locate=${encodeURIComponent(query)}&geoit=JSON`;
    const data = await fetchWithTimeout(url, 5000);
    if (!data?.latt || !data?.longt) return null;

    const lat = parseFloat(data.latt);
    const lon = parseFloat(data.longt);
    const prov = data.standard?.prov || "";
    const city = data.standard?.city || query;

    return {
      input: query,
      city: city.split(" ").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" "),
      country: 'CA',
      lat,
      lon,
      adminArea: city,
      adminAreaCode: "",
      stateOrProvince: PROVINCE_NAMES[prov] || prov,
      cached: false,
      provinceCode: prov,
    };
  } catch {
    return null;
  }
}

/** Get the province code for a city (for StatCan queries) */
export function getProvinceCode(cityName: string): string | undefined {
  const normalized = cityName.toLowerCase().trim();
  return CA_CITIES[normalized]?.provinceCode;
}

/** Get the CMA code for a city (for StatCan metro queries) */
export function getCMACode(cityName: string): string | undefined {
  const normalized = cityName.toLowerCase().trim();
  return CA_CITIES[normalized]?.cmaCode;
}
