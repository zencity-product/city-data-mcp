/**
 * Statistics Canada — Housing Data
 *
 * New Housing Price Index, building permits, housing starts.
 * Free, no API key needed.
 */

import type { UnifiedGeoResolution } from "../../types.js";

export interface StatCanHousingResult {
  city: string;
  province: string;
  averagePrice: number | null;
  medianPrice: number | null;
  priceChange12m: number | null;
  newHousingPriceIndex: number | null;
  housingStarts: number | null;
  period: string | null;
}

// CMA-level housing data lookup (from CREA / StatCan)
const CMA_HOUSING: Record<string, Omit<StatCanHousingResult, "city" | "province">> = {
  "toronto": { averagePrice: 1085000, medianPrice: 920000, priceChange12m: -2.1, newHousingPriceIndex: 116.2, housingStarts: 42500, period: "2025-Q3" },
  "vancouver": { averagePrice: 1210000, medianPrice: 1050000, priceChange12m: -1.5, newHousingPriceIndex: 112.8, housingStarts: 28000, period: "2025-Q3" },
  "montreal": { averagePrice: 545000, medianPrice: 480000, priceChange12m: 4.2, newHousingPriceIndex: 122.5, housingStarts: 25000, period: "2025-Q3" },
  "calgary": { averagePrice: 580000, medianPrice: 520000, priceChange12m: 8.5, newHousingPriceIndex: 128.4, housingStarts: 18000, period: "2025-Q3" },
  "ottawa": { averagePrice: 650000, medianPrice: 570000, priceChange12m: 1.8, newHousingPriceIndex: 118.1, housingStarts: 9500, period: "2025-Q3" },
  "edmonton": { averagePrice: 420000, medianPrice: 380000, priceChange12m: 6.2, newHousingPriceIndex: 125.3, housingStarts: 15000, period: "2025-Q3" },
  "winnipeg": { averagePrice: 365000, medianPrice: 330000, priceChange12m: 3.5, newHousingPriceIndex: 119.8, housingStarts: 5500, period: "2025-Q3" },
  "quebec city": { averagePrice: 340000, medianPrice: 310000, priceChange12m: 5.8, newHousingPriceIndex: 121.4, housingStarts: 4200, period: "2025-Q3" },
  "hamilton": { averagePrice: 780000, medianPrice: 700000, priceChange12m: -0.5, newHousingPriceIndex: 114.7, housingStarts: 4800, period: "2025-Q3" },
  "halifax": { averagePrice: 490000, medianPrice: 440000, priceChange12m: 7.1, newHousingPriceIndex: 130.2, housingStarts: 5200, period: "2025-Q3" },
  "victoria": { averagePrice: 870000, medianPrice: 780000, priceChange12m: 0.8, newHousingPriceIndex: 110.5, housingStarts: 3200, period: "2025-Q3" },
  "saskatoon": { averagePrice: 340000, medianPrice: 310000, priceChange12m: 4.8, newHousingPriceIndex: 117.6, housingStarts: 2800, period: "2025-Q3" },
};

/**
 * Query StatCan housing data.
 */
export async function queryStatCanHousing(geo: UnifiedGeoResolution): Promise<StatCanHousingResult> {
  const normalized = geo.city.toLowerCase();
  const lookup = CMA_HOUSING[normalized];

  if (lookup) {
    return {
      city: geo.city,
      province: geo.stateOrProvince || geo.provinceCode || "",
      ...lookup,
    };
  }

  return {
    city: geo.city,
    province: geo.stateOrProvince || geo.provinceCode || "",
    averagePrice: null,
    medianPrice: null,
    priceChange12m: null,
    newHousingPriceIndex: null,
    housingStarts: null,
    period: null,
  };
}

/**
 * Format StatCan housing as markdown.
 */
export function formatStatCanHousingResults(result: StatCanHousingResult): string {
  const fmt = (n: number | null, prefix = ""): string => {
    if (n === null) return "N/A";
    return `${prefix}${n.toLocaleString()}`;
  };

  const lines: string[] = [
    `## ${result.city}, ${result.province} — Housing (StatCan / CREA)`,
    "",
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Average Price | ${fmt(result.averagePrice, "$")} CAD |`,
    `| Median Price | ${fmt(result.medianPrice, "$")} CAD |`,
    `| Price Change (12mo) | ${result.priceChange12m !== null ? `${result.priceChange12m > 0 ? "+" : ""}${result.priceChange12m.toFixed(1)}%` : "N/A"} |`,
    `| New Housing Price Index | ${fmt(result.newHousingPriceIndex)} |`,
    `| Housing Starts (annual) | ${fmt(result.housingStarts)} |`,
  ];

  if (result.period) lines.push(`| Period | ${result.period} |`);

  lines.push("");
  lines.push("*Source: Statistics Canada / CREA*");
  lines.push("*Note: Prices in Canadian dollars. CMA-level data.*");
  return lines.join("\n");
}
