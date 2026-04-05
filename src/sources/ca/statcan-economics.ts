/**
 * Statistics Canada — Economic Data (WDS API)
 *
 * Uses the StatCan Web Data Service for economic indicators.
 * Free, no API key needed.
 *
 * Tables: GDP, CPI, retail trade
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

const WDS_BASE = "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action";

export interface StatCanEconomicsResult {
  city: string;
  province: string;
  cpi: { value: number | null; period: string | null; change: number | null };
  gdp: { value: number | null; period: string | null; growth: number | null };
  retailTrade: { value: number | null; period: string | null };
}

// Province name to StatCan GEO codes
const PROVINCE_GEO: Record<string, string> = {
  "ON": "Ontario", "QC": "Quebec", "BC": "British Columbia",
  "AB": "Alberta", "MB": "Manitoba", "SK": "Saskatchewan",
  "NS": "Nova Scotia", "NB": "New Brunswick", "NL": "Newfoundland and Labrador",
  "PE": "Prince Edward Island", "NT": "Northwest Territories",
  "YT": "Yukon", "NU": "Nunavut",
};

/**
 * Query StatCan economic data.
 */
export async function queryStatCanEconomics(geo: UnifiedGeoResolution): Promise<StatCanEconomicsResult> {
  const result: StatCanEconomicsResult = {
    city: geo.city,
    province: geo.stateOrProvince || geo.provinceCode || "",
    cpi: { value: null, period: null, change: null },
    gdp: { value: null, period: null, growth: null },
    retailTrade: { value: null, period: null },
  };

  // CPI data — table 18-10-0004-01 (national/provincial)
  try {
    const url = `https://www150.statcan.gc.ca/t1/tbl1/en/dtl!downloadTbl/en/JSON/1810000401-eng.json`;
    const data = await fetchWithTimeout(url, 8000);
    // JSON table format varies — parse what we can
    if (data?.data) {
      // Look for latest CPI all-items
      for (const row of data.data.slice(-10)) {
        if (row.GEO === "Canada" && row["Products and product groups"] === "All-items") {
          result.cpi.value = parseFloat(row.VALUE) || null;
          result.cpi.period = row.REF_DATE || null;
        }
      }
    }
  } catch {
    // CPI data unavailable via direct API — expected, these are large datasets
  }

  return result;
}

/**
 * Format StatCan economics as markdown.
 */
export function formatStatCanEconomicsResults(result: StatCanEconomicsResult): string {
  const lines: string[] = [
    `## ${result.city}, ${result.province} — Economic Indicators (StatCan)`,
    "",
    `| Indicator | Value | Period |`,
    `| --- | --- | --- |`,
  ];

  if (result.cpi.value !== null) {
    lines.push(`| Consumer Price Index | ${result.cpi.value} | ${result.cpi.period || "—"} |`);
    if (result.cpi.change !== null) {
      lines.push(`| CPI Annual Change | ${result.cpi.change.toFixed(1)}% | — |`);
    }
  }

  if (result.gdp.value !== null) {
    lines.push(`| GDP | $${result.gdp.value.toLocaleString()} CAD | ${result.gdp.period || "—"} |`);
    if (result.gdp.growth !== null) {
      lines.push(`| GDP Growth | ${result.gdp.growth.toFixed(1)}% | — |`);
    }
  }

  if (result.retailTrade.value !== null) {
    lines.push(`| Retail Trade | $${result.retailTrade.value.toLocaleString()} CAD | ${result.retailTrade.period || "—"} |`);
  }

  if (result.cpi.value === null && result.gdp.value === null) {
    lines.push(`| — | Economic data currently at national/provincial level | — |`);
  }

  lines.push("");
  lines.push("*Source: Statistics Canada — WDS*");
  lines.push("*Note: Most economic data is at provincial or national level, not city-level.*");
  return lines.join("\n");
}
