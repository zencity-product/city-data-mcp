/**
 * ONS Housing + Land Registry — UK Housing Data
 *
 * - ONS house price indices by local authority
 * - Land Registry Price Paid data
 * Free, no API key needed.
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

const ONS_BASE = "https://api.beta.ons.gov.uk/v1";

export interface UKHousingResult {
  city: string;
  ladCode: string;
  medianPrice: number | null;
  averagePrice: number | null;
  priceChange12m: number | null;
  period: string | null;
  medianRent: number | null;
  rentPeriod: string | null;
}

/**
 * Query UK housing data.
 */
export async function queryUKHousing(geo: UnifiedGeoResolution): Promise<UKHousingResult> {
  const result: UKHousingResult = {
    city: geo.city,
    ladCode: geo.ladCode || "",
    medianPrice: null,
    averagePrice: null,
    priceChange12m: null,
    period: null,
    medianRent: null,
    rentPeriod: null,
  };

  // Try ONS house price data
  try {
    const url = `${ONS_BASE}/datasets/house-prices-local-authority/editions`;
    const data = await fetchWithTimeout(url, 5000);
    if (data?.items?.[0]) {
      const edition = data.items[0].edition;
      const vUrl = `${ONS_BASE}/datasets/house-prices-local-authority/editions/${edition}/versions`;
      const vData = await fetchWithTimeout(vUrl, 5000);
      if (vData?.items?.[0]) {
        // This gives us the dataset metadata — actual observations need geography filtering
        result.period = edition;
      }
    }
  } catch {
    // ONS dataset unavailable
  }

  // Try Land Registry bulk data summary (public statistics)
  // The Land Registry publishes average prices by local authority
  try {
    const ladCode = geo.ladCode || "";
    // Use the UK House Price Index open data
    const url = `https://landregistry.data.gov.uk/data/ukhpi/region/${encodeURIComponent(geo.city.toLowerCase())}.json?_pageSize=1&_sort=-ukhpi:refPeriod`;
    const data = await fetchWithTimeout(url, 5000);
    if (data?.result?.items?.[0]) {
      const item = data.result.items[0];
      result.averagePrice = item["ukhpi:averagePrice"] || null;
      result.priceChange12m = item["ukhpi:percentageAnnualChange"] || null;
      result.period = item["ukhpi:refPeriod"] || null;
    }
  } catch {
    // Land Registry data unavailable
  }

  return result;
}

/**
 * Format UK housing data as markdown.
 */
export function formatUKHousingResults(result: UKHousingResult): string {
  const fmt = (n: number | null, prefix = ""): string => {
    if (n === null) return "N/A";
    return `${prefix}${n.toLocaleString()}`;
  };

  const lines: string[] = [
    `## ${result.city} — Housing (ONS / Land Registry)`,
    "",
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Average House Price | ${fmt(result.averagePrice, "£")} |`,
    `| Median House Price | ${fmt(result.medianPrice, "£")} |`,
    `| Annual Price Change | ${result.priceChange12m !== null ? `${result.priceChange12m.toFixed(1)}%` : "N/A"} |`,
    `| Median Monthly Rent | ${fmt(result.medianRent, "£")} |`,
  ];

  if (result.period) {
    lines.push(`| Data Period | ${result.period} |`);
  }

  lines.push("");
  lines.push("*Source: ONS / HM Land Registry UK House Price Index*");
  return lines.join("\n");
}
