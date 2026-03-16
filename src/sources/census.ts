/**
 * US Census Bureau API Client — Dynamic Edition
 *
 * Now supports ANY US city/town/CDP — not just a hardcoded list.
 *
 * How it works:
 * 1. User asks for "Boise" or "Chapel Hill" or any place name
 * 2. We search the Census API for all places matching that name
 * 3. We fetch demographic data for the matched place
 *
 * The Census defines ~30,000 "places" (cities, towns, CDPs, boroughs).
 * All of them have ACS data available.
 *
 * API key: Free, register at https://api.census.gov/data/key_signup.html
 * Set as CENSUS_API_KEY environment variable.
 */

// Census variable codes → human-readable names
const VARIABLES: Record<string, { code: string; label: string; format: "number" | "dollar" | "percent" }> = {
  totalPopulation:    { code: "B01003_001E", label: "Total Population", format: "number" },
  medianAge:          { code: "B01002_001E", label: "Median Age", format: "number" },
  medianIncome:       { code: "B19013_001E", label: "Median Household Income", format: "dollar" },
  perCapitaIncome:    { code: "B19301_001E", label: "Per Capita Income", format: "dollar" },
  povertyCount:       { code: "B17001_002E", label: "Population Below Poverty Line", format: "number" },
  totalForPoverty:    { code: "B17001_001E", label: "Population for Poverty Calculation", format: "number" },
  bachelorsDegree:    { code: "B15003_022E", label: "Bachelor's Degree Holders", format: "number" },
  totalOver25:        { code: "B15003_001E", label: "Population 25+", format: "number" },
  medianHomeValue:    { code: "B25077_001E", label: "Median Home Value", format: "dollar" },
  medianRent:         { code: "B25064_001E", label: "Median Gross Rent", format: "dollar" },
  totalHousingUnits:  { code: "B25001_001E", label: "Total Housing Units", format: "number" },
  vacantUnits:        { code: "B25002_003E", label: "Vacant Housing Units", format: "number" },
  totalWorkers:       { code: "B08301_001E", label: "Total Workers (Commuting)", format: "number" },
  driveAlone:         { code: "B08301_003E", label: "Drive Alone to Work", format: "number" },
  publicTransit:      { code: "B08301_010E", label: "Public Transit Commuters", format: "number" },
  workFromHome:       { code: "B08301_021E", label: "Work From Home", format: "number" },
};

// Common aliases so users don't have to be precise
const ALIASES: Record<string, string> = {
  "nyc": "New York city",
  "new york": "New York city",
  "new york city": "New York city",
  "manhattan": "New York city",
  "sf": "San Francisco city",
  "san fran": "San Francisco city",
  "la": "Los Angeles city",
  "l.a.": "Los Angeles city",
  "dc": "Washington city",
  "washington dc": "Washington city",
  "d.c.": "Washington city",
  "philly": "Philadelphia city",
  "vegas": "Las Vegas city",
  "nola": "New Orleans city",
};

// State FIPS codes
const STATE_FIPS: Record<string, string> = {
  AL: "01", AK: "02", AZ: "04", AR: "05", CA: "06", CO: "08", CT: "09", DE: "10",
  DC: "11", FL: "12", GA: "13", HI: "15", ID: "16", IL: "17", IN: "18", IA: "19",
  KS: "20", KY: "21", LA: "22", ME: "23", MD: "24", MA: "25", MI: "26", MN: "27",
  MS: "28", MO: "29", MT: "30", NE: "31", NV: "32", NH: "33", NJ: "34", NM: "35",
  NY: "36", NC: "37", ND: "38", OH: "39", OK: "40", OR: "41", PA: "42", RI: "44",
  SC: "45", SD: "46", TN: "47", TX: "48", UT: "49", VT: "50", VA: "51", WA: "53",
  WV: "54", WI: "55", WY: "56",
};

const STATE_NAMES: Record<string, string> = {
  "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas", "06": "California",
  "08": "Colorado", "09": "Connecticut", "10": "Delaware", "11": "District of Columbia",
  "12": "Florida", "13": "Georgia", "15": "Hawaii", "16": "Idaho", "17": "Illinois",
  "18": "Indiana", "19": "Iowa", "20": "Kansas", "21": "Kentucky", "22": "Louisiana",
  "23": "Maine", "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota",
  "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska", "32": "Nevada",
  "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico", "36": "New York",
  "37": "North Carolina", "38": "North Dakota", "39": "Ohio", "40": "Oklahoma", "41": "Oregon",
  "42": "Pennsylvania", "44": "Rhode Island", "45": "South Carolina", "46": "South Dakota",
  "47": "Tennessee", "48": "Texas", "49": "Utah", "50": "Vermont", "51": "Virginia",
  "53": "Washington", "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming",
};

const BASE_URL = "https://api.census.gov/data";
const ACS_YEAR = "2023";
const ACS_DATASET = "acs/acs5";

export interface CensusResult {
  city: string;
  state: string;
  stateFips: string;
  placeFips: string;
  demographics: {
    population: number | null;
    medianAge: number | null;
    medianIncome: number | null;
    perCapitaIncome: number | null;
    povertyRate: number | null;
    bachelorsDegreeRate: number | null;
  };
  housing: {
    medianHomeValue: number | null;
    medianRent: number | null;
    totalUnits: number | null;
    vacancyRate: number | null;
  };
  commuting: {
    driveAloneRate: number | null;
    publicTransitRate: number | null;
    workFromHomeRate: number | null;
  };
}

export interface CensusPlaceMatch {
  name: string;       // e.g., "Denver city, Colorado"
  stateFips: string;  // e.g., "08"
  placeFips: string;  // e.g., "20000"
  population: number;
}

// Cache the place search results to avoid repeated API calls
const placeCache = new Map<string, CensusPlaceMatch[]>();

/**
 * Search for a city/place in the Census API.
 * Returns all matching places sorted by population (largest first).
 */
export async function searchCensusPlaces(query: string): Promise<CensusPlaceMatch[]> {
  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) {
    throw new Error("CENSUS_API_KEY not set.");
  }

  // Check alias first
  const normalized = query.toLowerCase().trim();
  const aliased = ALIASES[normalized] || query;

  // Check cache
  const cacheKey = aliased.toLowerCase();
  if (placeCache.has(cacheKey)) {
    return placeCache.get(cacheKey)!;
  }

  // Query Census for all places, filtering by name
  // We fetch NAME + population for all places across all states
  const url = `${BASE_URL}/${ACS_YEAR}/${ACS_DATASET}?get=NAME,B01003_001E&for=place:*&key=${apiKey}`;

  console.error(`[city-data-mcp] Census place search for "${aliased}"`);

  // We cache the full place list on first call — it's ~30K rows but only fetched once
  if (!placeCache.has("__ALL__")) {
    console.error(`[city-data-mcp] Fetching full place list from Census (one-time)...`);

    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Census API error (${response.status}): ${errorText.slice(0, 200)}`);
    }

    const data = (await response.json()) as string[][];
    // data[0] = headers: ["NAME", "B01003_001E", "state", "place"]
    // data[1+] = rows

    const allPlaces: CensusPlaceMatch[] = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      allPlaces.push({
        name: row[0],
        population: parseInt(row[1]) || 0,
        stateFips: row[2],
        placeFips: row[3],
      });
    }

    placeCache.set("__ALL__", allPlaces);
    console.error(`[city-data-mcp] Cached ${allPlaces.length} places`);
  }

  const allPlaces = placeCache.get("__ALL__")!;

  // Search: match by name (case-insensitive, partial match)
  const searchTerm = aliased.toLowerCase();
  const matches = allPlaces.filter((p) => {
    const placeName = p.name.toLowerCase();
    // Match the city part (before the comma)
    const cityPart = placeName.split(",")[0].trim();
    // Exact match on city name (without "city", "town", etc. suffix)
    const baseName = cityPart.replace(/\s+(city|town|village|borough|cdp|municipality)$/i, "").trim();
    return baseName === searchTerm || cityPart === searchTerm || cityPart.startsWith(searchTerm + " ");
  });

  // Sort by population descending — biggest city first
  matches.sort((a, b) => b.population - a.population);

  // Cache this search
  placeCache.set(cacheKey, matches);

  return matches;
}

/**
 * Resolve a city name to Census FIPS codes.
 * Returns the best match (largest population) or null.
 * Now works for ANY US city/town, not just a hardcoded list.
 */
export async function resolveCensusFips(input: string): Promise<{ key: string; fips: { state: string; place: string; name: string } } | null> {
  const matches = await searchCensusPlaces(input);

  if (matches.length === 0) {
    return null;
  }

  // Return the largest match
  const best = matches[0];
  const stateName = STATE_NAMES[best.stateFips] || best.stateFips;

  return {
    key: `${best.stateFips}_${best.placeFips}`,
    fips: {
      state: best.stateFips,
      place: best.placeFips,
      name: best.name.split(",")[0].trim(), // Just the city name
    },
  };
}

/**
 * List is no longer meaningful since we support all cities.
 * Returns a note explaining dynamic search.
 */
export function listCensusCities(): Array<{ key: string; name: string; state: string }> {
  return [{ key: "any", name: "Any US city, town, or CDP (~30,000 places)", state: "all" }];
}

/**
 * Fetch demographic data from the Census API for a city.
 * Now accepts state + place FIPS directly.
 */
export async function queryCensus(cityKeyOrState: string, placeFips?: string): Promise<CensusResult> {
  let stateFips: string;
  let place: string;
  let cityName: string;

  if (placeFips) {
    // Direct FIPS provided
    stateFips = cityKeyOrState;
    place = placeFips;
    cityName = `Place ${placeFips}`;
  } else {
    // Resolve from name
    const match = await resolveCensusFips(cityKeyOrState);
    if (!match) {
      throw new Error(`City "${cityKeyOrState}" not found in Census data.`);
    }
    stateFips = match.fips.state;
    place = match.fips.place;
    cityName = match.fips.name;
  }

  const apiKey = process.env.CENSUS_API_KEY;
  if (!apiKey) {
    throw new Error("CENSUS_API_KEY not set.");
  }

  const variableCodes = Object.values(VARIABLES).map((v) => v.code);
  const getParam = `NAME,${variableCodes.join(",")}`;

  const url = `${BASE_URL}/${ACS_YEAR}/${ACS_DATASET}?get=${getParam}&for=place:${place}&in=state:${stateFips}&key=${apiKey}`;

  console.error(`[city-data-mcp] Census API: ${url.replace(apiKey, "***")}`);

  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Census API error (${response.status}): ${errorText.slice(0, 200)}`);
  }

  const data = (await response.json()) as string[][];
  if (data.length < 2) {
    throw new Error(`No Census data found for ${cityName}`);
  }

  const headers = data[0];
  const values = data[1];

  // Use NAME from response if available
  const nameIdx = headers.indexOf("NAME");
  if (nameIdx >= 0 && values[nameIdx]) {
    const fullName = values[nameIdx];
    cityName = fullName.split(",")[0].trim();
  }

  // Build lookup
  const lookup: Record<string, number | null> = {};
  for (const [varName, varDef] of Object.entries(VARIABLES)) {
    const idx = headers.indexOf(varDef.code);
    if (idx >= 0 && values[idx] !== null && values[idx] !== undefined) {
      const num = Number(values[idx]);
      lookup[varName] = isNaN(num) || num < 0 ? null : num;
    } else {
      lookup[varName] = null;
    }
  }

  const povertyRate = safeRate(lookup.povertyCount, lookup.totalForPoverty);
  const bachelorsDegreeRate = safeRate(lookup.bachelorsDegree, lookup.totalOver25);
  const vacancyRate = safeRate(lookup.vacantUnits, lookup.totalHousingUnits);
  const driveAloneRate = safeRate(lookup.driveAlone, lookup.totalWorkers);
  const publicTransitRate = safeRate(lookup.publicTransit, lookup.totalWorkers);
  const workFromHomeRate = safeRate(lookup.workFromHome, lookup.totalWorkers);

  return {
    city: cityName,
    state: STATE_NAMES[stateFips] || stateFips,
    stateFips,
    placeFips: place,
    demographics: {
      population: lookup.totalPopulation,
      medianAge: lookup.medianAge,
      medianIncome: lookup.medianIncome,
      perCapitaIncome: lookup.perCapitaIncome,
      povertyRate,
      bachelorsDegreeRate,
    },
    housing: {
      medianHomeValue: lookup.medianHomeValue,
      medianRent: lookup.medianRent,
      totalUnits: lookup.totalHousingUnits,
      vacancyRate,
    },
    commuting: {
      driveAloneRate,
      publicTransitRate,
      workFromHomeRate,
    },
  };
}

/**
 * Format Census results into readable text for Claude.
 */
export function formatCensusResults(result: CensusResult): string {
  const fmt = (n: number | null, type: "number" | "dollar" | "percent"): string => {
    if (n === null) return "N/A";
    if (type === "dollar") return `$${n.toLocaleString()}`;
    if (type === "percent") return `${(n * 100).toFixed(1)}%`;
    return n.toLocaleString();
  };

  return `**${result.city}** (${result.state}) — Census Demographics (ACS ${ACS_YEAR} 5-Year Estimates)

**Population & Demographics**
  - Population: ${fmt(result.demographics.population, "number")}
  - Median Age: ${fmt(result.demographics.medianAge, "number")}
  - Median Household Income: ${fmt(result.demographics.medianIncome, "dollar")}
  - Per Capita Income: ${fmt(result.demographics.perCapitaIncome, "dollar")}
  - Poverty Rate: ${fmt(result.demographics.povertyRate, "percent")}
  - Bachelor's Degree Rate (25+): ${fmt(result.demographics.bachelorsDegreeRate, "percent")}

**Housing**
  - Median Home Value: ${fmt(result.housing.medianHomeValue, "dollar")}
  - Median Gross Rent: ${fmt(result.housing.medianRent, "dollar")}
  - Total Housing Units: ${fmt(result.housing.totalUnits, "number")}
  - Vacancy Rate: ${fmt(result.housing.vacancyRate, "percent")}

**Commuting**
  - Drive Alone: ${fmt(result.commuting.driveAloneRate, "percent")}
  - Public Transit: ${fmt(result.commuting.publicTransitRate, "percent")}
  - Work From Home: ${fmt(result.commuting.workFromHomeRate, "percent")}`;
}

function safeRate(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (numerator == null || denominator == null || denominator === 0) return null;
  return numerator / denominator;
}
