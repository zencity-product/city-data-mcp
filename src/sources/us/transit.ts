/**
 * National Transit Database (NTD) — Public Transit Performance
 *
 * The NTD Monthly Ridership dataset lives on data.transportation.gov (Socrata-powered).
 * Dataset ID: waa4-cmtn
 *
 * No API key needed. We query via SoQL, filtering by Urbanized Area (UZA) name
 * and aggregating ridership by agency and mode.
 *
 * Mode codes:
 *   MB = Bus, HR = Heavy Rail (Subway), LR = Light Rail, CR = Commuter Rail,
 *   SR = Streetcar, FB = Ferryboat, DR = Demand Response, VP = Vanpool,
 *   CB = Commuter Bus, RB = Rapid Bus (BRT), TB = Trolleybus, MG = Monorail
 */

const NTD_DOMAIN = "data.transportation.gov";
const NTD_DATASET_ID = "waa4-cmtn";

// ── Result interface ─────────────────────────────────────────────────────────

export interface TransitResult {
  city: string;
  agencies: Array<{
    name: string;
    modes: Array<{
      mode: string;
      modeName: string;
      ridership: number;
      serviceHours: number | null;
      serviceMiles: number | null;
    }>;
    totalRidership: number;
  }>;
  totalRidership: number;
  year: string;
}

// ── Mode code → human name ───────────────────────────────────────────────────

const MODE_NAMES: Record<string, string> = {
  MB: "Bus",
  HR: "Heavy Rail (Subway/Metro)",
  LR: "Light Rail",
  CR: "Commuter Rail",
  SR: "Streetcar",
  FB: "Ferryboat",
  DR: "Demand Response (Paratransit)",
  VP: "Vanpool",
  CB: "Commuter Bus",
  RB: "Rapid Bus (BRT)",
  TB: "Trolleybus",
  MG: "Monorail/Automated Guideway",
};

function modeName(code: string): string {
  return MODE_NAMES[code] || code;
}

// ── City → UZA name mapping ──────────────────────────────────────────────────
// UZA names are verbose (e.g., "New York--Newark, NY--NJ--CT"), so we use
// LIKE queries with a search fragment for reliable matching.

interface TransitCityConfig {
  name: string;
  uzaSearch: string; // Substring used in SoQL LIKE '%...%'
}

const TRANSIT_CITIES: Record<string, TransitCityConfig> = {
  nyc: { name: "New York City", uzaSearch: "New York--Newark" },
  chicago: { name: "Chicago", uzaSearch: "Chicago, IL" },
  la: { name: "Los Angeles", uzaSearch: "Los Angeles--Long Beach" },
  sf: { name: "San Francisco", uzaSearch: "San Francisco--Oakland" },
  seattle: { name: "Seattle", uzaSearch: "Seattle, WA" },
  boston: { name: "Boston", uzaSearch: "Boston, MA" },
  philadelphia: { name: "Philadelphia", uzaSearch: "Philadelphia, PA" },
  dc: { name: "Washington, D.C.", uzaSearch: "Washington, DC" },
  atlanta: { name: "Atlanta", uzaSearch: "Atlanta, GA" },
  miami: { name: "Miami", uzaSearch: "Miami, FL" },
  denver: { name: "Denver", uzaSearch: "Denver--Aurora" },
  portland: { name: "Portland", uzaSearch: "Portland, OR" },
  minneapolis: { name: "Minneapolis", uzaSearch: "Minneapolis--St. Paul" },
  dallas: { name: "Dallas", uzaSearch: "Dallas--Fort Worth" },
  houston: { name: "Houston", uzaSearch: "Houston, TX" },
  phoenix: { name: "Phoenix", uzaSearch: "Phoenix--Mesa" },
  detroit: { name: "Detroit", uzaSearch: "Detroit, MI" },
  baltimore: { name: "Baltimore", uzaSearch: "Baltimore, MD" },
  pittsburgh: { name: "Pittsburgh", uzaSearch: "Pittsburgh, PA" },
  cleveland: { name: "Cleveland", uzaSearch: "Cleveland, OH" },
  tampa: { name: "Tampa", uzaSearch: "Tampa--St. Petersburg" },
  san_diego: { name: "San Diego", uzaSearch: "San Diego, CA" },
  sacramento: { name: "Sacramento", uzaSearch: "Sacramento, CA" },
  salt_lake_city: { name: "Salt Lake City", uzaSearch: "Salt Lake City" },
  nashville: { name: "Nashville", uzaSearch: "Nashville" },
  charlotte: { name: "Charlotte", uzaSearch: "Charlotte, NC" },
  orlando: { name: "Orlando", uzaSearch: "Orlando, FL" },
  austin: { name: "Austin", uzaSearch: "Austin, TX" },
  las_vegas: { name: "Las Vegas", uzaSearch: "Las Vegas--Henderson" },
  san_antonio: { name: "San Antonio", uzaSearch: "San Antonio, TX" },
  jacksonville: { name: "Jacksonville", uzaSearch: "Jacksonville, FL" },
  columbus: { name: "Columbus", uzaSearch: "Columbus, OH" },
  indianapolis: { name: "Indianapolis", uzaSearch: "Indianapolis, IN" },
  oklahoma_city: { name: "Oklahoma City", uzaSearch: "Oklahoma City, OK" },
  memphis: { name: "Memphis", uzaSearch: "Memphis, TN--MS--AR" },
  louisville: { name: "Louisville", uzaSearch: "Louisville/Jefferson County, KY--IN" },
  milwaukee: { name: "Milwaukee", uzaSearch: "Milwaukee, WI" },
  albuquerque: { name: "Albuquerque", uzaSearch: "Albuquerque, NM" },
  tucson: { name: "Tucson", uzaSearch: "Tucson, AZ" },
  fresno: { name: "Fresno", uzaSearch: "Fresno, CA" },
  kansas_city: { name: "Kansas City", uzaSearch: "Kansas City, MO--KS" },
  omaha: { name: "Omaha", uzaSearch: "Omaha, NE--IA" },
  cincinnati: { name: "Cincinnati", uzaSearch: "Cincinnati, OH--KY--IN" },
  st_louis: { name: "St. Louis", uzaSearch: "St. Louis, MO--IL" },
  richmond: { name: "Richmond", uzaSearch: "Richmond, VA" },
  hartford: { name: "Hartford", uzaSearch: "Hartford, CT" },
  buffalo: { name: "Buffalo", uzaSearch: "Buffalo, NY" },
  rochester: { name: "Rochester", uzaSearch: "Rochester, NY" },
  providence: { name: "Providence", uzaSearch: "Providence, RI--MA" },
  virginia_beach: { name: "Virginia Beach", uzaSearch: "Virginia Beach, VA" },
  birmingham: { name: "Birmingham", uzaSearch: "Birmingham, AL" },
  boise: { name: "Boise", uzaSearch: "Boise, ID" },
  raleigh: { name: "Raleigh", uzaSearch: "Raleigh, NC" },
};

const TRANSIT_ALIASES: Record<string, string> = {
  "new york": "nyc",
  "new york city": "nyc",
  "manhattan": "nyc",
  "san francisco": "sf",
  "san fran": "sf",
  "los angeles": "la",
  "l.a.": "la",
  "washington": "dc",
  "washington dc": "dc",
  "d.c.": "dc",
  "philly": "philadelphia",
  "san diego": "san_diego",
  "salt lake": "salt_lake_city",
  "salt lake city": "salt_lake_city",
  "slc": "salt_lake_city",
  "vegas": "las_vegas",
  "las vegas": "las_vegas",
  "lv": "las_vegas",
  "tampa bay": "tampa",
  "st pete": "tampa",
  "pgh": "pittsburgh",
  "the burgh": "pittsburgh",
  "msp": "minneapolis",
  "dfw": "dallas",
  "san antonio": "san_antonio",
  "jax": "jacksonville",
  "columbus oh": "columbus",
  "indy": "indianapolis",
  "okc": "oklahoma_city",
  "oklahoma city": "oklahoma_city",
  "louisville": "louisville",
  "mke": "milwaukee",
  "abq": "albuquerque",
  "kansas city": "kansas_city",
  "kc": "kansas_city",
  "cincy": "cincinnati",
  "stl": "st_louis",
  "st louis": "st_louis",
  "saint louis": "st_louis",
  "rva": "richmond",
  "buf": "buffalo",
  "roc": "rochester",
  "pvd": "providence",
  "virginia beach": "virginia_beach",
  "vb": "virginia_beach",
  "birmingham": "birmingham",
  "bham": "birmingham",
  "raleigh": "raleigh",
};

// ── City resolution ──────────────────────────────────────────────────────────

function resolveTransitCity(input: string): { key: string; config: TransitCityConfig } | null {
  const normalized = input.toLowerCase().trim();

  if (TRANSIT_CITIES[normalized]) {
    return { key: normalized, config: TRANSIT_CITIES[normalized] };
  }

  const aliasKey = TRANSIT_ALIASES[normalized];
  if (aliasKey && TRANSIT_CITIES[aliasKey]) {
    return { key: aliasKey, config: TRANSIT_CITIES[aliasKey] };
  }

  // Match by display name
  for (const [key, config] of Object.entries(TRANSIT_CITIES)) {
    if (config.name.toLowerCase() === normalized) {
      return { key, config };
    }
  }

  return null;
}

// ── Socrata query helpers ────────────────────────────────────────────────────

interface NtdAggRow {
  agency: string;
  mode: string;
  total_ridership: string;
  total_vrh: string;
  total_vrm: string;
}

async function socrataQuery(soql: string): Promise<NtdAggRow[]> {
  const params = new URLSearchParams({ $query: soql });
  const url = `https://${NTD_DOMAIN}/resource/${NTD_DATASET_ID}.json?${params}`;

  console.error(`[city-data-mcp] Transit: ${url}`);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `NTD API error (${response.status}): ${errorText.slice(0, 200)}`
    );
  }

  return (await response.json()) as NtdAggRow[];
}

// ── Main query function ──────────────────────────────────────────────────────

/**
 * Query NTD ridership data for a city.
 * Aggregates by agency + mode for the most recent full year of data.
 */
export async function queryTransit(city: string): Promise<TransitResult> {
  const resolved = resolveTransitCity(city);
  if (!resolved) {
    const available = listTransitCities()
      .map((c) => c.name)
      .join(", ");
    throw new Error(
      `Unknown transit city: "${city}". Available cities: ${available}`
    );
  }

  const { config } = resolved;

  // Use the most recent full calendar year. If early in the year, fall back to prior year.
  const now = new Date();
  const year = now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear();
  const yearStr = String(year);

  // SoQL: aggregate ridership, service hours, and service miles by agency + mode
  const soql = `
    SELECT
      agency,
      mode,
      sum(upt) AS total_ridership,
      sum(vrh) AS total_vrh,
      sum(vrm) AS total_vrm
    WHERE
      uza_name like '%${config.uzaSearch}%'
      AND year = '${yearStr}'
    GROUP BY agency, mode
    ORDER BY total_ridership DESC
    LIMIT 50
  `.trim();

  const rows = await socrataQuery(soql);

  // Group by agency
  const agencyMap = new Map<
    string,
    {
      name: string;
      modes: TransitResult["agencies"][number]["modes"];
      totalRidership: number;
    }
  >();

  for (const row of rows) {
    const agencyName = row.agency || "Unknown Agency";
    const modeCode = row.mode || "??";
    const ridership = parseInt(row.total_ridership, 10) || 0;
    const vrh = row.total_vrh ? parseInt(row.total_vrh, 10) : null;
    const vrm = row.total_vrm ? parseInt(row.total_vrm, 10) : null;

    if (ridership === 0) continue;

    let entry = agencyMap.get(agencyName);
    if (!entry) {
      entry = { name: agencyName, modes: [], totalRidership: 0 };
      agencyMap.set(agencyName, entry);
    }

    entry.modes.push({
      mode: modeCode,
      modeName: modeName(modeCode),
      ridership,
      serviceHours: vrh,
      serviceMiles: vrm,
    });
    entry.totalRidership += ridership;
  }

  // Sort agencies by total ridership descending
  const agencies = Array.from(agencyMap.values()).sort(
    (a, b) => b.totalRidership - a.totalRidership
  );

  // Sort modes within each agency
  for (const agency of agencies) {
    agency.modes.sort((a, b) => b.ridership - a.ridership);
  }

  const totalRidership = agencies.reduce((sum, a) => sum + a.totalRidership, 0);

  return {
    city: config.name,
    agencies,
    totalRidership,
    year: yearStr,
  };
}

// ── Formatting ───────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Format transit results into readable text for Claude.
 */
export function formatTransitResults(result: TransitResult): string {
  const lines: string[] = [
    `**${result.city}** — Public Transit Performance (${result.year})\n`,
    `**Total Ridership**: ${formatNumber(result.totalRidership)} unlinked passenger trips`,
    `**Agencies**: ${result.agencies.length}\n`,
  ];

  for (const agency of result.agencies) {
    lines.push(`### ${agency.name} — ${formatNumber(agency.totalRidership)} trips`);

    for (const mode of agency.modes) {
      let modeLine = `  - **${mode.modeName}**: ${formatNumber(mode.ridership)} trips`;
      if (mode.serviceHours) {
        modeLine += ` | ${formatNumber(mode.serviceHours)} service hours`;
      }
      if (mode.serviceMiles) {
        modeLine += ` | ${formatNumber(mode.serviceMiles)} service miles`;
      }
      // Efficiency: trips per service hour
      if (mode.serviceHours && mode.serviceHours > 0) {
        const tripsPerHour = (mode.ridership / mode.serviceHours).toFixed(1);
        modeLine += ` | ${tripsPerHour} trips/hr`;
      }
      lines.push(modeLine);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ── City listing ─────────────────────────────────────────────────────────────

/**
 * List all cities with transit data available.
 */
export function listTransitCities(): Array<{ key: string; name: string }> {
  return Object.entries(TRANSIT_CITIES).map(([key, config]) => ({
    key,
    name: config.name,
  }));
}
