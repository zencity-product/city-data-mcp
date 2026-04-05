/**
 * UK Police Crime API — data.police.uk
 *
 * Free, no API key needed. Rate limit: 15 requests/sec.
 * Provides street-level crime data for England, Wales, and Northern Ireland.
 *
 * Endpoints:
 * - /crimes-street/all-crime — street-level crime by location
 * - /crimes-street-dates — available date range
 * - /crime-categories — category definitions
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

const POLICE_BASE = "https://data.police.uk/api";

export interface UKCrimeResult {
  city: string;
  date: string;
  totalCrimes: number;
  categories: Record<string, number>;
  topCategories: Array<{ category: string; count: number; percentage: number }>;
}

/**
 * Query street-level crime data for a UK location.
 */
export async function queryUKCrime(geo: UnifiedGeoResolution, dateStr?: string): Promise<UKCrimeResult> {
  // Get latest available date if not specified
  let date = dateStr;
  if (!date) {
    try {
      const datesData = await fetchWithTimeout(`${POLICE_BASE}/crimes-street-dates`, 5000);
      if (Array.isArray(datesData) && datesData.length > 0) {
        date = datesData[0].date;
      }
    } catch {
      // Use a reasonable recent date
      const now = new Date();
      now.setMonth(now.getMonth() - 3); // Data usually lags 3 months
      date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
  }

  const url = `${POLICE_BASE}/crimes-street/all-crime?lat=${geo.lat}&lng=${geo.lon}&date=${date}`;
  const data = await fetchWithTimeout(url, 10000);

  if (!Array.isArray(data)) {
    throw new Error(`No crime data available for ${geo.city}. The Police API may not cover this area.`);
  }

  // Count by category
  const categories: Record<string, number> = {};
  for (const crime of data) {
    const cat = crime.category || "other";
    categories[cat] = (categories[cat] || 0) + 1;
  }

  // Sort categories by count
  const sorted = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category: formatCategoryName(category),
      count,
      percentage: data.length > 0 ? (count / data.length) * 100 : 0,
    }));

  return {
    city: geo.city,
    date: date || "unknown",
    totalCrimes: data.length,
    categories,
    topCategories: sorted.slice(0, 10),
  };
}

/**
 * Format UK crime data as markdown.
 */
export function formatUKCrimeResults(result: UKCrimeResult): string {
  const lines: string[] = [
    `## ${result.city} — Crime Data (UK Police)`,
    "",
    `**Period:** ${result.date}`,
    `**Total reported crimes (street-level):** ${result.totalCrimes.toLocaleString()}`,
    "",
    `### Crime Breakdown`,
    "",
    `| Category | Count | % |`,
    `| --- | ---: | ---: |`,
  ];

  for (const cat of result.topCategories) {
    lines.push(`| ${cat.category} | ${cat.count.toLocaleString()} | ${cat.percentage.toFixed(1)}% |`);
  }

  lines.push("");
  lines.push(`*Source: data.police.uk — street-level crime within ~1 mile radius*`);
  lines.push(`*Note: Data covers England, Wales, and Northern Ireland. Scotland uses a different system.*`);

  return lines.join("\n");
}

function formatCategoryName(slug: string): string {
  return slug
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
