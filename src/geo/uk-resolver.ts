/**
 * UK City Geo-Resolver
 *
 * Resolves UK city names to geographic identifiers using:
 * 1. Built-in lookup table of ~50 major UK cities
 * 2. postcodes.io API for postcode/place search
 *
 * Returns UnifiedGeoResolution with country: 'UK'.
 */

import type { UnifiedGeoResolution } from "../types.js";
import { fetchWithTimeout } from "./us-resolver.js";

// ── Major UK Cities Lookup ──────────────────────────────────────────────────

interface UKCityEntry {
  name: string;
  lat: number;
  lon: number;
  ladCode: string;
  ladName: string;
  regionCode: string;
  regionName: string;
  postcode: string;
  constituencyCode?: string;
}

const UK_CITIES: Record<string, UKCityEntry> = {
  "london": { name: "London", lat: 51.5074, lon: -0.1278, ladCode: "E09000001", ladName: "City of London", regionCode: "E12000007", regionName: "London", postcode: "EC1A 1BB" },
  "birmingham": { name: "Birmingham", lat: 52.4862, lon: -1.8904, ladCode: "E08000025", ladName: "Birmingham", regionCode: "E12000005", regionName: "West Midlands", postcode: "B1 1BB" },
  "manchester": { name: "Manchester", lat: 53.4808, lon: -2.2426, ladCode: "E08000003", ladName: "Manchester", regionCode: "E12000002", regionName: "North West", postcode: "M1 1AE" },
  "leeds": { name: "Leeds", lat: 53.8008, lon: -1.5491, ladCode: "E08000035", ladName: "Leeds", regionCode: "E12000003", regionName: "Yorkshire and The Humber", postcode: "LS1 1UR" },
  "glasgow": { name: "Glasgow", lat: 55.8642, lon: -4.2518, ladCode: "S12000049", ladName: "Glasgow City", regionCode: "S92000003", regionName: "Scotland", postcode: "G1 1DN" },
  "edinburgh": { name: "Edinburgh", lat: 55.9533, lon: -3.1883, ladCode: "S12000036", ladName: "City of Edinburgh", regionCode: "S92000003", regionName: "Scotland", postcode: "EH1 1YZ" },
  "liverpool": { name: "Liverpool", lat: 53.4084, lon: -2.9916, ladCode: "E08000012", ladName: "Liverpool", regionCode: "E12000002", regionName: "North West", postcode: "L1 1JQ" },
  "bristol": { name: "Bristol", lat: 51.4545, lon: -2.5879, ladCode: "E06000023", ladName: "Bristol, City of", regionCode: "E12000009", regionName: "South West", postcode: "BS1 1EJ" },
  "sheffield": { name: "Sheffield", lat: 53.3811, lon: -1.4701, ladCode: "E08000019", ladName: "Sheffield", regionCode: "E12000003", regionName: "Yorkshire and The Humber", postcode: "S1 1WB" },
  "newcastle": { name: "Newcastle upon Tyne", lat: 54.9783, lon: -1.6178, ladCode: "E08000021", ladName: "Newcastle upon Tyne", regionCode: "E12000001", regionName: "North East", postcode: "NE1 1EE" },
  "newcastle upon tyne": { name: "Newcastle upon Tyne", lat: 54.9783, lon: -1.6178, ladCode: "E08000021", ladName: "Newcastle upon Tyne", regionCode: "E12000001", regionName: "North East", postcode: "NE1 1EE" },
  "nottingham": { name: "Nottingham", lat: 52.9548, lon: -1.1581, ladCode: "E06000018", ladName: "Nottingham", regionCode: "E12000004", regionName: "East Midlands", postcode: "NG1 1AB" },
  "cardiff": { name: "Cardiff", lat: 51.4816, lon: -3.1791, ladCode: "W06000015", ladName: "Cardiff", regionCode: "W92000004", regionName: "Wales", postcode: "CF10 1EP" },
  "belfast": { name: "Belfast", lat: 54.5973, lon: -5.9301, ladCode: "N09000003", ladName: "Belfast", regionCode: "N92000002", regionName: "Northern Ireland", postcode: "BT1 1AA" },
  "leicester": { name: "Leicester", lat: 52.6369, lon: -1.1398, ladCode: "E06000016", ladName: "Leicester", regionCode: "E12000004", regionName: "East Midlands", postcode: "LE1 1AA" },
  "southampton": { name: "Southampton", lat: 50.9097, lon: -1.4044, ladCode: "E06000045", ladName: "Southampton", regionCode: "E12000008", regionName: "South East", postcode: "SO14 7DW" },
  "brighton": { name: "Brighton", lat: 50.8225, lon: -0.1372, ladCode: "E06000043", ladName: "Brighton and Hove", regionCode: "E12000008", regionName: "South East", postcode: "BN1 1AE" },
  "plymouth": { name: "Plymouth", lat: 50.3755, lon: -4.1427, ladCode: "E06000026", ladName: "Plymouth", regionCode: "E12000009", regionName: "South West", postcode: "PL1 1AB" },
  "reading": { name: "Reading", lat: 51.4543, lon: -0.9781, ladCode: "E06000038", ladName: "Reading", regionCode: "E12000008", regionName: "South East", postcode: "RG1 1AZ" },
  "aberdeen": { name: "Aberdeen", lat: 57.1497, lon: -2.0943, ladCode: "S12000033", ladName: "Aberdeen City", regionCode: "S92000003", regionName: "Scotland", postcode: "AB10 1AN" },
  "dundee": { name: "Dundee", lat: 56.4620, lon: -2.9707, ladCode: "S12000042", ladName: "Dundee City", regionCode: "S92000003", regionName: "Scotland", postcode: "DD1 1DA" },
  "coventry": { name: "Coventry", lat: 52.4068, lon: -1.5197, ladCode: "E08000026", ladName: "Coventry", regionCode: "E12000005", regionName: "West Midlands", postcode: "CV1 1FY" },
  "stoke-on-trent": { name: "Stoke-on-Trent", lat: 53.0027, lon: -2.1794, ladCode: "E06000021", ladName: "Stoke-on-Trent", regionCode: "E12000005", regionName: "West Midlands", postcode: "ST1 1LZ" },
  "stoke": { name: "Stoke-on-Trent", lat: 53.0027, lon: -2.1794, ladCode: "E06000021", ladName: "Stoke-on-Trent", regionCode: "E12000005", regionName: "West Midlands", postcode: "ST1 1LZ" },
  "wolverhampton": { name: "Wolverhampton", lat: 52.5870, lon: -2.1288, ladCode: "E08000031", ladName: "Wolverhampton", regionCode: "E12000005", regionName: "West Midlands", postcode: "WV1 1AD" },
  "derby": { name: "Derby", lat: 52.9225, lon: -1.4746, ladCode: "E06000015", ladName: "Derby", regionCode: "E12000004", regionName: "East Midlands", postcode: "DE1 1AN" },
  "swansea": { name: "Swansea", lat: 51.6214, lon: -3.9436, ladCode: "W06000011", ladName: "Swansea", regionCode: "W92000004", regionName: "Wales", postcode: "SA1 1LE" },
  "sunderland": { name: "Sunderland", lat: 54.9069, lon: -1.3838, ladCode: "E08000024", ladName: "Sunderland", regionCode: "E12000001", regionName: "North East", postcode: "SR1 1AA" },
  "oxford": { name: "Oxford", lat: 51.7520, lon: -1.2577, ladCode: "E07000178", ladName: "Oxford", regionCode: "E12000008", regionName: "South East", postcode: "OX1 1BX" },
  "cambridge": { name: "Cambridge", lat: 52.2053, lon: 0.1218, ladCode: "E07000008", ladName: "Cambridge", regionCode: "E12000006", regionName: "East of England", postcode: "CB2 1TN" },
  "york": { name: "York", lat: 53.9591, lon: -1.0815, ladCode: "E06000014", ladName: "York", regionCode: "E12000003", regionName: "Yorkshire and The Humber", postcode: "YO1 6GA" },
  "bath": { name: "Bath", lat: 51.3811, lon: -2.3590, ladCode: "E06000022", ladName: "Bath and North East Somerset", regionCode: "E12000009", regionName: "South West", postcode: "BA1 1SU" },
  "exeter": { name: "Exeter", lat: 50.7184, lon: -3.5339, ladCode: "E07000041", ladName: "Exeter", regionCode: "E12000009", regionName: "South West", postcode: "EX1 1HS" },
  "norwich": { name: "Norwich", lat: 52.6309, lon: 1.2974, ladCode: "E07000148", ladName: "Norwich", regionCode: "E12000006", regionName: "East of England", postcode: "NR1 1BA" },
  "canterbury": { name: "Canterbury", lat: 51.2802, lon: 1.0789, ladCode: "E07000106", ladName: "Canterbury", regionCode: "E12000008", regionName: "South East", postcode: "CT1 1BA" },
  "blackpool": { name: "Blackpool", lat: 53.8142, lon: -3.0503, ladCode: "E06000009", ladName: "Blackpool", regionCode: "E12000002", regionName: "North West", postcode: "FY1 1AD" },
  "middlesbrough": { name: "Middlesbrough", lat: 54.5742, lon: -1.2350, ladCode: "E06000002", ladName: "Middlesbrough", regionCode: "E12000001", regionName: "North East", postcode: "TS1 1DB" },
  "bolton": { name: "Bolton", lat: 53.5785, lon: -2.4299, ladCode: "E08000001", ladName: "Bolton", regionCode: "E12000002", regionName: "North West", postcode: "BL1 1BA" },
  "luton": { name: "Luton", lat: 51.8787, lon: -0.4200, ladCode: "E06000032", ladName: "Luton", regionCode: "E12000006", regionName: "East of England", postcode: "LU1 1AA" },
  "ipswich": { name: "Ipswich", lat: 52.0567, lon: 1.1482, ladCode: "E07000202", ladName: "Ipswich", regionCode: "E12000006", regionName: "East of England", postcode: "IP1 1AX" },
};

// In-memory cache
const cache = new Map<string, UnifiedGeoResolution>();

/**
 * Resolve a UK city name to geographic identifiers.
 */
export async function resolveUKCity(input: string): Promise<UnifiedGeoResolution> {
  const normalized = input.toLowerCase().trim();

  if (cache.has(normalized)) {
    return { ...cache.get(normalized)!, cached: true };
  }

  console.error(`[city-data-mcp] UK Geo-resolving: "${input}"`);

  // Step 1: Check built-in lookup table
  const lookup = UK_CITIES[normalized];
  if (lookup) {
    const result: UnifiedGeoResolution = {
      input,
      city: lookup.name,
      country: 'UK',
      lat: lookup.lat,
      lon: lookup.lon,
      adminArea: lookup.ladName,
      adminAreaCode: lookup.ladCode,
      stateOrProvince: lookup.regionName,
      cached: false,
      ladCode: lookup.ladCode,
      regionCode: lookup.regionCode,
      postcode: lookup.postcode,
    };
    cache.set(normalized, result);
    return result;
  }

  // Step 2: Check if input looks like a postcode
  const postcodePattern = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
  if (postcodePattern.test(input.trim())) {
    const result = await resolveByPostcode(input.trim());
    if (result) {
      cache.set(normalized, result);
      return result;
    }
  }

  // Step 3: Try postcodes.io places search
  const result = await resolveByPlaceSearch(input);
  if (result) {
    cache.set(normalized, result);
    return result;
  }

  throw new Error(
    `Could not resolve "${input}" to a UK location. Try a well-known UK city name (e.g., "Manchester", "Edinburgh") or a UK postcode.`
  );
}

async function resolveByPostcode(postcode: string): Promise<UnifiedGeoResolution | null> {
  try {
    const clean = postcode.replace(/\s+/g, "");
    const url = `https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`;
    const data = await fetchWithTimeout(url, 5000);
    if (!data?.result) return null;

    const r = data.result;
    return {
      input: postcode,
      city: r.admin_district || r.parish || postcode,
      country: 'UK',
      lat: r.latitude,
      lon: r.longitude,
      adminArea: r.admin_district || "",
      adminAreaCode: r.codes?.admin_district || "",
      stateOrProvince: r.region || r.country || "",
      cached: false,
      ladCode: r.codes?.admin_district || "",
      regionCode: r.codes?.nuts || "",
      postcode: r.postcode || postcode,
      constituencyCode: r.codes?.parliamentary_constituency || "",
    };
  } catch {
    return null;
  }
}

async function resolveByPlaceSearch(query: string): Promise<UnifiedGeoResolution | null> {
  try {
    const url = `https://api.postcodes.io/places?q=${encodeURIComponent(query)}&limit=1`;
    const data = await fetchWithTimeout(url, 5000);
    const place = data?.result?.[0];
    if (!place) return null;

    return {
      input: query,
      city: place.name_1 || query,
      country: 'UK',
      lat: parseFloat(place.latitude),
      lon: parseFloat(place.longitude),
      adminArea: place.county_unitary || place.district_borough || "",
      adminAreaCode: place.code || "",
      stateOrProvince: place.region || place.country || "",
      cached: false,
      ladCode: place.code || "",
      regionCode: "",
    };
  } catch {
    return null;
  }
}
