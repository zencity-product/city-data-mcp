/**
 * 311 Service Request Trends
 *
 * Goes beyond raw record queries — uses SoQL aggregation (GROUP BY, COUNT,
 * date_trunc_ym) to return trend analysis server-side: top complaint categories,
 * volume over time, and category breakdowns.
 *
 * Supported cities: NYC, Chicago, SF, LA, Seattle, Boston, Denver,
 * Kansas City, Baltimore, Pittsburgh, Cincinnati, New Orleans, Austin.
 */

import type { SocrataRow } from "../../types.js";

// --- 311 dataset configs per city ---

interface Three11CityConfig {
  name: string;
  domain: string;
  dataset: string;
  complaintField: string;
  dateField: string;
}

const THREE11_CITIES: Record<string, Three11CityConfig> = {
  nyc: {
    name: "New York City",
    domain: "data.cityofnewyork.us",
    dataset: "erm2-nwe9",
    complaintField: "complaint_type",
    dateField: "created_date",
  },
  chicago: {
    name: "Chicago",
    domain: "data.cityofchicago.org",
    dataset: "v6vf-nfxy",
    complaintField: "sr_type",
    dateField: "created_date",
  },
  sf: {
    name: "San Francisco",
    domain: "data.sfgov.org",
    dataset: "vw6y-z8j6",
    complaintField: "service_name",
    dateField: "requested_datetime",
  },
  la: {
    name: "Los Angeles",
    domain: "data.lacity.org",
    dataset: "pvft-t9nq",
    complaintField: "type_name",
    dateField: "created_date",
  },
  seattle: {
    name: "Seattle",
    domain: "data.seattle.gov",
    dataset: "65db-xm6k",
    complaintField: "service_request_type",
    dateField: "open_datetime",
  },
  boston: {
    name: "Boston",
    domain: "data.boston.gov",
    dataset: "awu8-dc52",
    complaintField: "type",
    dateField: "open_dt",
  },
  denver: {
    name: "Denver",
    domain: "data.denvergov.org",
    dataset: "v6vp-ncmk",
    complaintField: "case_summary",
    dateField: "case_created_dttm",
  },
  "kansas city": {
    name: "Kansas City",
    domain: "data.kcmo.org",
    dataset: "7at3-sxhp",
    complaintField: "request_type",
    dateField: "creation_date",
  },
  baltimore: {
    name: "Baltimore",
    domain: "data.baltimorecity.gov",
    dataset: "9agw-sxsr",
    complaintField: "srtype",
    dateField: "createddate",
  },
  pittsburgh: {
    name: "Pittsburgh",
    domain: "data.wprdc.org",
    dataset: "f2bw-dgsn",
    complaintField: "request_type",
    dateField: "created_on",
  },
  cincinnati: {
    name: "Cincinnati",
    domain: "data.cincinnati-oh.gov",
    dataset: "4cjh-bm8b",
    complaintField: "service_name",
    dateField: "requested_datetime",
  },
  "new orleans": {
    name: "New Orleans",
    domain: "data.nola.gov",
    dataset: "3iz8-nghx",
    complaintField: "type_",
    dateField: "ticket_created_date_time",
  },
  austin: {
    name: "Austin",
    domain: "data.austintexas.gov",
    dataset: "xwdj-i9he",
    complaintField: "sr_type_desc",
    dateField: "sr_created_date",
  },
};

// Aliases so users can type "new york", "san francisco", etc.
const CITY_ALIASES: Record<string, string> = {
  "new york": "nyc",
  "new york city": "nyc",
  manhattan: "nyc",
  "san francisco": "sf",
  "san fran": "sf",
  "los angeles": "la",
  pgh: "pittsburgh",
  kc: "kansas city",
  nola: "new orleans",
  cincy: "cincinnati",
};

// --- Public interface ---

export interface Three11Result {
  city: string;
  period: { from: string; to: string; days: number };
  totalRequests: number;
  topCategories: Array<{
    category: string;
    count: number;
    percentOfTotal: number;
  }>;
  monthlyTrend: Array<{ month: string; count: number }>;
}

// --- Core query function ---

/**
 * Query 311 trends for a supported city.
 * Runs aggregation queries server-side via SoQL — no raw record download.
 *
 * @param city  City name or alias (e.g., "nyc", "Chicago", "san francisco")
 * @param days  Number of days to look back (default 90)
 */
export async function query311Trends(
  city: string,
  days: number = 90
): Promise<Three11Result> {
  const config = resolveThree11City(city);
  if (!config) {
    const supported = Object.values(THREE11_CITIES)
      .map((c) => c.name)
      .join(", ");
    throw new Error(
      `City "${city}" not supported for 311 trends. Supported: ${supported}`
    );
  }

  const fromDate = daysAgo(days);
  const toDate = new Date().toISOString().split("T")[0];

  // Run all three queries in parallel
  const [totalRows, categoryRows, trendRows] = await Promise.all([
    soqlQuery(config, buildTotalQuery(config, fromDate)),
    soqlQuery(config, buildCategoryQuery(config, fromDate)),
    soqlQuery(config, buildTrendQuery(config, fromDate)),
  ]);

  // Parse total
  const totalRequests =
    totalRows.length > 0 ? Number(totalRows[0].total) || 0 : 0;

  // Parse top categories
  const topCategories = categoryRows.map((row) => ({
    category: String(row[config.complaintField] || "Unknown"),
    count: Number(row.total) || 0,
    percentOfTotal:
      totalRequests > 0
        ? Math.round(((Number(row.total) || 0) / totalRequests) * 1000) / 10
        : 0,
  }));

  // Parse monthly trend
  const monthlyTrend = trendRows.map((row) => ({
    month: String(row.month || "").slice(0, 7), // "YYYY-MM"
    count: Number(row.total) || 0,
  }));

  return {
    city: config.name,
    period: { from: fromDate, to: toDate, days },
    totalRequests,
    topCategories,
    monthlyTrend,
  };
}

// --- Formatting ---

/**
 * Format a Three11Result into a readable string for Claude or terminal output.
 */
export function format311Results(result: Three11Result): string {
  const { city, period, totalRequests, topCategories, monthlyTrend } = result;

  const header = `**311 Service Requests — ${city}**\nPeriod: ${period.from} to ${period.to} (${period.days} days)\nTotal requests: ${totalRequests.toLocaleString()}`;

  const categorySection =
    topCategories.length > 0
      ? `\nTop complaint categories:\n${topCategories
          .map(
            (c, i) =>
              `  ${i + 1}. ${c.category}: ${c.count.toLocaleString()} (${c.percentOfTotal}%)`
          )
          .join("\n")}`
      : "\nNo category data available.";

  const trendSection =
    monthlyTrend.length > 0
      ? `\nMonthly trend:\n${monthlyTrend
          .map((t) => `  ${t.month}: ${t.count.toLocaleString()}`)
          .join("\n")}`
      : "\nNo trend data available.";

  return `${header}\n${categorySection}\n${trendSection}`;
}

// --- List supported cities ---

/**
 * List cities that have 311 trend analysis available.
 */
export function list311Cities(): Array<{ key: string; name: string }> {
  return Object.entries(THREE11_CITIES).map(([key, config]) => ({
    key,
    name: config.name,
  }));
}

// --- Internal helpers ---

function resolveThree11City(input: string): Three11CityConfig | null {
  const normalized = input.toLowerCase().trim();

  // Direct key match
  if (THREE11_CITIES[normalized]) {
    return THREE11_CITIES[normalized];
  }

  // Alias match
  const aliasKey = CITY_ALIASES[normalized];
  if (aliasKey && THREE11_CITIES[aliasKey]) {
    return THREE11_CITIES[aliasKey];
  }

  // Name match
  for (const config of Object.values(THREE11_CITIES)) {
    if (config.name.toLowerCase() === normalized) {
      return config;
    }
  }

  return null;
}

function daysAgo(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().split("T")[0];
}

function buildTotalQuery(config: Three11CityConfig, fromDate: string): string {
  return `SELECT count(*) as total WHERE ${config.dateField} > '${fromDate}'`;
}

function buildCategoryQuery(
  config: Three11CityConfig,
  fromDate: string
): string {
  return `SELECT ${config.complaintField}, count(*) as total WHERE ${config.dateField} > '${fromDate}' GROUP BY ${config.complaintField} ORDER BY total DESC LIMIT 10`;
}

function buildTrendQuery(
  config: Three11CityConfig,
  fromDate: string
): string {
  return `SELECT date_trunc_ym(${config.dateField}) as month, count(*) as total WHERE ${config.dateField} > '${fromDate}' GROUP BY month ORDER BY month`;
}

async function soqlQuery(
  config: Three11CityConfig,
  query: string
): Promise<SocrataRow[]> {
  const params = new URLSearchParams({ $query: query });
  const url = `https://${config.domain}/resource/${config.dataset}.json?${params}`;

  console.error(`[city-data-mcp] 311 query: ${url}`);

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Socrata API error (${response.status}): ${errorText.slice(0, 200)}`
    );
  }

  return (await response.json()) as SocrataRow[];
}
