/**
 * Bureau of Labor Statistics (BLS) API Client
 *
 * BLS provides employment, unemployment, wages, and price data at national,
 * state, and metro area levels. We use the Public Data API v2.
 *
 * Key series we pull:
 * - Local Area Unemployment Statistics (LAUS) — metro unemployment
 * - Occupational Employment & Wage Statistics (OEWS) — metro wages
 * - Current Employment Statistics (CES) — metro employment by sector
 *
 * Series ID structure (LAUS example):
 *   LAUST360000000000003 = NY state unemployment rate
 *   Format: LAU + ST + area_code + measure_code
 *
 * API key: Free, register at https://www.bls.gov/developers/home.htm
 * v2 with key: 500 queries/day, 50 series per query, 20 years
 * v2 without key: 25 queries/day, 25 series, 10 years
 * Set as BLS_API_KEY environment variable.
 */

const BASE_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

// Metro area LAUS codes for unemployment data
// Format: LAUMT + state_fips + metro_code + measure
// Measure codes: 03 = unemployment rate, 04 = unemployment count, 05 = employment, 06 = labor force
const METRO_LAUS: Record<string, MetroBlsConfig> = {
  nyc: {
    name: "New York City",
    unemploymentRate: "LAUMT363562000000003",
    employment: "LAUMT363562000000005",
    laborForce: "LAUMT363562000000006",
  },
  chicago: {
    name: "Chicago",
    unemploymentRate: "LAUMT171698000000003",
    employment: "LAUMT171698000000005",
    laborForce: "LAUMT171698000000006",
  },
  sf: {
    name: "San Francisco",
    unemploymentRate: "LAUMT064186000000003",
    employment: "LAUMT064186000000005",
    laborForce: "LAUMT064186000000006",
  },
  la: {
    name: "Los Angeles",
    unemploymentRate: "LAUMT063108000000003",
    employment: "LAUMT063108000000005",
    laborForce: "LAUMT063108000000006",
  },
  seattle: {
    name: "Seattle",
    unemploymentRate: "LAUMT534266000000003",
    employment: "LAUMT534266000000005",
    laborForce: "LAUMT534266000000006",
  },
  houston: {
    name: "Houston",
    unemploymentRate: "LAUMT482642000000003",
    employment: "LAUMT482642000000005",
    laborForce: "LAUMT482642000000006",
  },
  phoenix: {
    name: "Phoenix",
    unemploymentRate: "LAUMT043806000000003",
    employment: "LAUMT043806000000005",
    laborForce: "LAUMT043806000000006",
  },
  denver: {
    name: "Denver",
    unemploymentRate: "LAUMT081974000000003",
    employment: "LAUMT081974000000005",
    laborForce: "LAUMT081974000000006",
  },
  boston: {
    name: "Boston",
    unemploymentRate: "LAUMT251446000000003",
    employment: "LAUMT251446000000005",
    laborForce: "LAUMT251446000000006",
  },
  austin: {
    name: "Austin",
    unemploymentRate: "LAUMT481242000000003",
    employment: "LAUMT481242000000005",
    laborForce: "LAUMT481242000000006",
  },
  dallas: {
    name: "Dallas",
    unemploymentRate: "LAUMT481910000000003",
    employment: "LAUMT481910000000005",
    laborForce: "LAUMT481910000000006",
  },
  dc: {
    name: "Washington, D.C.",
    unemploymentRate: "LAUMT114790000000003",
    employment: "LAUMT114790000000005",
    laborForce: "LAUMT114790000000006",
  },
  atlanta: {
    name: "Atlanta",
    unemploymentRate: "LAUMT131206000000003",
    employment: "LAUMT131206000000005",
    laborForce: "LAUMT131206000000006",
  },
  miami: {
    name: "Miami",
    unemploymentRate: "LAUMT123310000000003",
    employment: "LAUMT123310000000005",
    laborForce: "LAUMT123310000000006",
  },
  portland: {
    name: "Portland",
    unemploymentRate: "LAUMT413890000000003",
    employment: "LAUMT413890000000005",
    laborForce: "LAUMT413890000000006",
  },
  detroit: {
    name: "Detroit",
    unemploymentRate: "LAUMT261982000000003",
    employment: "LAUMT261982000000005",
    laborForce: "LAUMT261982000000006",
  },
  minneapolis: {
    name: "Minneapolis",
    unemploymentRate: "LAUMT273346000000003",
    employment: "LAUMT273346000000005",
    laborForce: "LAUMT273346000000006",
  },
  philadelphia: {
    name: "Philadelphia",
    unemploymentRate: "LAUMT423798000000003",
    employment: "LAUMT423798000000005",
    laborForce: "LAUMT423798000000006",
  },
  nashville: {
    name: "Nashville",
    unemploymentRate: "LAUMT473498000000003",
    employment: "LAUMT473498000000005",
    laborForce: "LAUMT473498000000006",
  },
  charlotte: {
    name: "Charlotte",
    unemploymentRate: "LAUMT371674000000003",
    employment: "LAUMT371674000000005",
    laborForce: "LAUMT371674000000006",
  },
  raleigh: {
    name: "Raleigh",
    unemploymentRate: "LAUMT373958000000003",
    employment: "LAUMT373958000000005",
    laborForce: "LAUMT373958000000006",
  },
  san_antonio: {
    name: "San Antonio",
    unemploymentRate: "LAUMT484170000000003",
    employment: "LAUMT484170000000005",
    laborForce: "LAUMT484170000000006",
  },
  san_diego: {
    name: "San Diego",
    unemploymentRate: "LAUMT064174000000003",
    employment: "LAUMT064174000000005",
    laborForce: "LAUMT064174000000006",
  },
  san_jose: {
    name: "San Jose",
    unemploymentRate: "LAUMT064194000000003",
    employment: "LAUMT064194000000005",
    laborForce: "LAUMT064194000000006",
  },
  jacksonville: {
    name: "Jacksonville",
    unemploymentRate: "LAUMT122726000000003",
    employment: "LAUMT122726000000005",
    laborForce: "LAUMT122726000000006",
  },
  columbus: {
    name: "Columbus",
    unemploymentRate: "LAUMT391814000000003",
    employment: "LAUMT391814000000005",
    laborForce: "LAUMT391814000000006",
  },
  indianapolis: {
    name: "Indianapolis",
    unemploymentRate: "LAUMT182690000000003",
    employment: "LAUMT182690000000005",
    laborForce: "LAUMT182690000000006",
  },
  memphis: {
    name: "Memphis",
    unemploymentRate: "LAUMT473282000000003",
    employment: "LAUMT473282000000005",
    laborForce: "LAUMT473282000000006",
  },
  oklahoma_city: {
    name: "Oklahoma City",
    unemploymentRate: "LAUMT403642000000003",
    employment: "LAUMT403642000000005",
    laborForce: "LAUMT403642000000006",
  },
  louisville: {
    name: "Louisville",
    unemploymentRate: "LAUMT213114000000003",
    employment: "LAUMT213114000000005",
    laborForce: "LAUMT213114000000006",
  },
  baltimore: {
    name: "Baltimore",
    unemploymentRate: "LAUMT241258000000003",
    employment: "LAUMT241258000000005",
    laborForce: "LAUMT241258000000006",
  },
  milwaukee: {
    name: "Milwaukee",
    unemploymentRate: "LAUMT553334000000003",
    employment: "LAUMT553334000000005",
    laborForce: "LAUMT553334000000006",
  },
  albuquerque: {
    name: "Albuquerque",
    unemploymentRate: "LAUMT351074000000003",
    employment: "LAUMT351074000000005",
    laborForce: "LAUMT351074000000006",
  },
  tucson: {
    name: "Tucson",
    unemploymentRate: "LAUMT044606000000003",
    employment: "LAUMT044606000000005",
    laborForce: "LAUMT044606000000006",
  },
  fresno: {
    name: "Fresno",
    unemploymentRate: "LAUMT062342000000003",
    employment: "LAUMT062342000000005",
    laborForce: "LAUMT062342000000006",
  },
  sacramento: {
    name: "Sacramento",
    unemploymentRate: "LAUMT064090000000003",
    employment: "LAUMT064090000000005",
    laborForce: "LAUMT064090000000006",
  },
  kansas_city: {
    name: "Kansas City",
    unemploymentRate: "LAUMT292814000000003",
    employment: "LAUMT292814000000005",
    laborForce: "LAUMT292814000000006",
  },
  omaha: {
    name: "Omaha",
    unemploymentRate: "LAUMT313654000000003",
    employment: "LAUMT313654000000005",
    laborForce: "LAUMT313654000000006",
  },
  cleveland: {
    name: "Cleveland",
    unemploymentRate: "LAUMT391746000000003",
    employment: "LAUMT391746000000005",
    laborForce: "LAUMT391746000000006",
  },
  tampa: {
    name: "Tampa",
    unemploymentRate: "LAUMT124530000000003",
    employment: "LAUMT124530000000005",
    laborForce: "LAUMT124530000000006",
  },
  new_orleans: {
    name: "New Orleans",
    unemploymentRate: "LAUMT223538000000003",
    employment: "LAUMT223538000000005",
    laborForce: "LAUMT223538000000006",
  },
  pittsburgh: {
    name: "Pittsburgh",
    unemploymentRate: "LAUMT423830000000003",
    employment: "LAUMT423830000000005",
    laborForce: "LAUMT423830000000006",
  },
  st_louis: {
    name: "St. Louis",
    unemploymentRate: "LAUMT294118000000003",
    employment: "LAUMT294118000000005",
    laborForce: "LAUMT294118000000006",
  },
  orlando: {
    name: "Orlando",
    unemploymentRate: "LAUMT123674000000003",
    employment: "LAUMT123674000000005",
    laborForce: "LAUMT123674000000006",
  },
  salt_lake_city: {
    name: "Salt Lake City",
    unemploymentRate: "LAUMT494162000000003",
    employment: "LAUMT494162000000005",
    laborForce: "LAUMT494162000000006",
  },
  richmond: {
    name: "Richmond",
    unemploymentRate: "LAUMT514006000000003",
    employment: "LAUMT514006000000005",
    laborForce: "LAUMT514006000000006",
  },
  hartford: {
    name: "Hartford",
    unemploymentRate: "LAUMT092554000000003",
    employment: "LAUMT092554000000005",
    laborForce: "LAUMT092554000000006",
  },
  buffalo: {
    name: "Buffalo",
    unemploymentRate: "LAUMT361538000000003",
    employment: "LAUMT361538000000005",
    laborForce: "LAUMT361538000000006",
  },
  rochester: {
    name: "Rochester",
    unemploymentRate: "LAUMT364038000000003",
    employment: "LAUMT364038000000005",
    laborForce: "LAUMT364038000000006",
  },
  cincinnati: {
    name: "Cincinnati",
    unemploymentRate: "LAUMT391714000000003",
    employment: "LAUMT391714000000005",
    laborForce: "LAUMT391714000000006",
  },
  las_vegas: {
    name: "Las Vegas",
    unemploymentRate: "LAUMT322982000000003",
    employment: "LAUMT322982000000005",
    laborForce: "LAUMT322982000000006",
  },
  providence: {
    name: "Providence",
    unemploymentRate: "LAUMT443930000000003",
    employment: "LAUMT443930000000005",
    laborForce: "LAUMT443930000000006",
  },
  virginia_beach: {
    name: "Virginia Beach",
    unemploymentRate: "LAUMT514726000000003",
    employment: "LAUMT514726000000005",
    laborForce: "LAUMT514726000000006",
  },
  birmingham: {
    name: "Birmingham",
    unemploymentRate: "LAUMT011382000000003",
    employment: "LAUMT011382000000005",
    laborForce: "LAUMT011382000000006",
  },
  boise: {
    name: "Boise",
    unemploymentRate: "LAUMT161426000000003",
    employment: "LAUMT161426000000005",
    laborForce: "LAUMT161426000000006",
  },
};

const CITY_ALIASES: Record<string, string> = {
  // Existing
  "new york": "nyc", "new york city": "nyc", "manhattan": "nyc",
  "san francisco": "sf", "san fran": "sf",
  "los angeles": "la", "l.a.": "la",
  "washington": "dc", "washington dc": "dc", "d.c.": "dc",
  "philly": "philadelphia",
  // New metros
  "san antonio": "san_antonio",
  "san diego": "san_diego",
  "san jose": "san_jose", "silicon valley": "san_jose", "sunnyvale": "san_jose", "santa clara": "san_jose",
  "jax": "jacksonville",
  "indy": "indianapolis",
  "okc": "oklahoma_city", "oklahoma": "oklahoma_city",
  "abq": "albuquerque",
  "sac": "sacramento", "sacto": "sacramento",
  "kc": "kansas_city", "kansas city": "kansas_city",
  "cle": "cleveland",
  "tampa bay": "tampa", "st pete": "tampa", "st petersburg": "tampa",
  "nola": "new_orleans", "new orleans": "new_orleans",
  "pgh": "pittsburgh", "the burgh": "pittsburgh",
  "stl": "st_louis", "saint louis": "st_louis", "st louis": "st_louis",
  "slc": "salt_lake_city", "salt lake": "salt_lake_city", "salt lake city": "salt_lake_city",
  "vegas": "las_vegas", "las vegas": "las_vegas", "lv": "las_vegas",
  "norfolk": "virginia_beach", "hampton roads": "virginia_beach", "virginia beach": "virginia_beach",
  "bham": "birmingham",
  "roc": "rochester",
  "cincy": "cincinnati",
  "pvd": "providence",
};

interface MetroBlsConfig {
  name: string;
  unemploymentRate: string;
  employment: string;
  laborForce: string;
}

interface BlsDataPoint {
  year: string;
  period: string;       // M01-M12 for monthly
  periodName: string;   // "January", etc.
  value: string;
}

export interface BlsCityResult {
  city: string;
  unemployment: {
    current: number | null;
    currentDate: string | null;
    yearAgo: number | null;
    yearAgoDate: string | null;
    change: number | null;
    monthly: Array<{ date: string; rate: number }>;
  };
  employment: {
    current: number | null;
    currentDate: string | null;
    yearAgo: number | null;
    change: number | null;
    changePercent: number | null;
  };
  laborForce: {
    current: number | null;
    currentDate: string | null;
  };
}

/**
 * Resolve a city name to its BLS config.
 */
export function resolveBlsCity(input: string): { key: string; config: MetroBlsConfig } | null {
  const normalized = input.toLowerCase().trim();

  if (METRO_LAUS[normalized]) {
    return { key: normalized, config: METRO_LAUS[normalized] };
  }

  const aliasKey = CITY_ALIASES[normalized];
  if (aliasKey && METRO_LAUS[aliasKey]) {
    return { key: aliasKey, config: METRO_LAUS[aliasKey] };
  }

  for (const [key, config] of Object.entries(METRO_LAUS)) {
    if (config.name.toLowerCase() === normalized) {
      return { key, config };
    }
  }

  return null;
}

/**
 * List all cities with BLS data available.
 */
export function listBlsCities(): Array<{ key: string; name: string }> {
  return Object.entries(METRO_LAUS).map(([key, config]) => ({
    key,
    name: config.name,
  }));
}

/**
 * Fetch employment data from BLS for a metro area.
 * Uses the v2 API — sends a POST with series IDs.
 */
export async function queryBls(cityKey: string): Promise<BlsCityResult> {
  const config = METRO_LAUS[cityKey];
  if (!config) {
    throw new Error(`Unknown city key: ${cityKey}`);
  }

  const apiKey = process.env.BLS_API_KEY;
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 2;

  const body: Record<string, unknown> = {
    seriesid: [config.unemploymentRate, config.employment, config.laborForce],
    startyear: String(startYear),
    endyear: String(currentYear),
  };

  if (apiKey) {
    body.registrationkey = apiKey;
  }

  console.error(`[city-data-mcp] BLS: Fetching ${config.name} (${startYear}-${currentYear})`);

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`BLS API error (${response.status}): ${errorText.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    status: string;
    message: string[];
    Results: {
      series: Array<{
        seriesID: string;
        data: BlsDataPoint[];
      }>;
    };
  };

  if (data.status !== "REQUEST_SUCCEEDED") {
    throw new Error(`BLS API error: ${data.message.join(", ")}`);
  }

  // Parse each series
  const seriesMap: Record<string, BlsDataPoint[]> = {};
  for (const series of data.Results.series) {
    seriesMap[series.seriesID] = series.data;
  }

  const unemploymentData = seriesMap[config.unemploymentRate] || [];
  const employmentData = seriesMap[config.employment] || [];
  const laborForceData = seriesMap[config.laborForce] || [];

  return {
    city: config.name,
    unemployment: parseUnemployment(unemploymentData),
    employment: parseEmployment(employmentData),
    laborForce: parseLaborForce(laborForceData),
  };
}

function parseUnemployment(data: BlsDataPoint[]): BlsCityResult["unemployment"] {
  // Data comes sorted newest first
  const monthly = data
    .filter((d) => d.period !== "M13") // M13 = annual average
    .slice(0, 24) // 2 years of monthly data
    .map((d) => ({
      date: `${d.year}-${d.period.replace("M", "")}`,
      rate: parseFloat(d.value),
    }))
    .filter((d) => !isNaN(d.rate));

  const current = monthly[0] || null;
  const yearAgo = monthly.length >= 12 ? monthly[12] : null;

  return {
    current: current?.rate ?? null,
    currentDate: current?.date ?? null,
    yearAgo: yearAgo?.rate ?? null,
    yearAgoDate: yearAgo?.date ?? null,
    change: current && yearAgo ? Math.round((current.rate - yearAgo.rate) * 10) / 10 : null,
    monthly,
  };
}

function parseEmployment(data: BlsDataPoint[]): BlsCityResult["employment"] {
  const filtered = data.filter((d) => d.period !== "M13");
  const current = filtered[0];
  const yearAgo = filtered.length >= 12 ? filtered[12] : null;

  if (!current) {
    return { current: null, currentDate: null, yearAgo: null, change: null, changePercent: null };
  }

  const currentVal = parseFloat(current.value);
  const yearAgoVal = yearAgo ? parseFloat(yearAgo.value) : null;
  const change = yearAgoVal ? currentVal - yearAgoVal : null;
  const changePercent = yearAgoVal ? Math.round(((currentVal - yearAgoVal) / yearAgoVal) * 1000) / 10 : null;

  return {
    current: currentVal,
    currentDate: `${current.year}-${current.period.replace("M", "")}`,
    yearAgo: yearAgoVal,
    change,
    changePercent,
  };
}

function parseLaborForce(data: BlsDataPoint[]): BlsCityResult["laborForce"] {
  const filtered = data.filter((d) => d.period !== "M13");
  const current = filtered[0];

  if (!current) {
    return { current: null, currentDate: null };
  }

  return {
    current: parseFloat(current.value),
    currentDate: `${current.year}-${current.period.replace("M", "")}`,
  };
}

/**
 * Format BLS results into readable text for Claude.
 */
export function formatBlsResults(result: BlsCityResult): string {
  const lines: string[] = [
    `**${result.city}** — Employment Data (BLS)\n`,
  ];

  // Unemployment
  if (result.unemployment.current !== null) {
    let uLine = `**Unemployment Rate**: ${result.unemployment.current}% (${result.unemployment.currentDate})`;
    if (result.unemployment.change !== null) {
      const arrow = result.unemployment.change > 0 ? "↑" : result.unemployment.change < 0 ? "↓" : "→";
      uLine += ` | ${arrow} ${Math.abs(result.unemployment.change)}pp year-over-year`;
    }
    lines.push(uLine);

    // Mini sparkline of recent months
    if (result.unemployment.monthly.length >= 6) {
      const recent = result.unemployment.monthly.slice(0, 6).reverse();
      const spark = recent.map((m) => `${m.rate}%`).join(" → ");
      lines.push(`  Recent trend: ${spark}`);
    }
  }

  // Employment
  if (result.employment.current !== null) {
    let eLine = `**Total Employment**: ${result.employment.current.toLocaleString()} (${result.employment.currentDate})`;
    if (result.employment.changePercent !== null) {
      const arrow = result.employment.changePercent > 0 ? "↑" : result.employment.changePercent < 0 ? "↓" : "→";
      eLine += ` | ${arrow} ${Math.abs(result.employment.changePercent)}% YoY`;
    }
    lines.push(eLine);
  }

  // Labor Force
  if (result.laborForce.current !== null) {
    lines.push(`**Labor Force**: ${result.laborForce.current.toLocaleString()} (${result.laborForce.currentDate})`);
  }

  // Labor force participation hint
  if (result.laborForce.current && result.employment.current) {
    const participation = ((result.employment.current / result.laborForce.current) * 100).toFixed(1);
    lines.push(`**Employment-to-Labor-Force Ratio**: ${participation}%`);
  }

  return lines.join("\n");
}
