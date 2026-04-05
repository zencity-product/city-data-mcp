/**
 * ONS / Nomis API — UK Demographics
 *
 * Uses the Nomis API (nomisweb.co.uk) for Census 2021 data.
 * Free, no key required for most tables.
 *
 * Key tables:
 * - NM_2021_1: Census 2021 population, age, ethnicity
 * - NM_2013_1: Dwelling estimates
 * - NM_57_1: Household estimates
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

const NOMIS_BASE = "https://www.nomisweb.co.uk/api/v01";

export interface ONSDemographicsResult {
  city: string;
  ladCode: string;
  population: number | null;
  medianAge: number | null;
  households: number | null;
  populationDensity: number | null;
  malePopulation: number | null;
  femalePopulation: number | null;
  workingAgePopulation: number | null;
  over65Population: number | null;
  under18Population: number | null;
}

/**
 * Query ONS demographics for a UK location.
 */
export async function queryONSDemographics(geo: UnifiedGeoResolution): Promise<ONSDemographicsResult> {
  const ladCode = geo.ladCode;
  if (!ladCode) {
    throw new Error(`No LAD code available for ${geo.city}. Cannot query ONS data.`);
  }

  const result: ONSDemographicsResult = {
    city: geo.city,
    ladCode,
    population: null,
    medianAge: null,
    households: null,
    populationDensity: null,
    malePopulation: null,
    femalePopulation: null,
    workingAgePopulation: null,
    over65Population: null,
    under18Population: null,
  };

  // Census 2021 population data via Nomis
  // NM_2021_1 is the Census 2021 main table
  try {
    const popUrl = `${NOMIS_BASE}/dataset/NM_2021_1.data.json?geography=${ladCode}&cell=0...4&measures=20100`;
    const popData = await fetchWithTimeout(popUrl, 8000);
    if (popData?.obs) {
      for (const obs of popData.obs) {
        const cellCode = obs.cell?.value;
        const val = parseFloat(obs.obs_value?.value);
        if (isNaN(val)) continue;
        // Cell codes vary by table — parse total population
        if (cellCode === "0") result.population = val;
      }
    }
  } catch {
    // Nomis table structure may vary — try alternative approach
  }

  // Try a simpler population query using mid-year estimates
  if (!result.population) {
    try {
      const url = `${NOMIS_BASE}/dataset/NM_31_1.data.json?geography=${ladCode}&date=latest&sex=0&age=0&measures=20100`;
      const data = await fetchWithTimeout(url, 8000);
      if (data?.obs?.[0]) {
        result.population = parseFloat(data.obs[0].obs_value?.value) || null;
      }
    } catch {
      // Population estimate failed
    }
  }

  // Household estimates
  try {
    const hhUrl = `${NOMIS_BASE}/dataset/NM_57_1.data.json?geography=${ladCode}&date=latest&measures=20100`;
    const hhData = await fetchWithTimeout(hhUrl, 5000);
    if (hhData?.obs?.[0]) {
      result.households = parseFloat(hhData.obs[0].obs_value?.value) || null;
    }
  } catch {
    // Household data not available
  }

  return result;
}

/**
 * Format ONS demographics as markdown.
 */
export function formatONSResults(result: ONSDemographicsResult): string {
  const fmt = (n: number | null, type: "number" | "percent" = "number"): string => {
    if (n === null) return "N/A";
    if (type === "percent") return `${(n * 100).toFixed(1)}%`;
    return n.toLocaleString();
  };

  const lines: string[] = [
    `## ${result.city} — Demographics (ONS)`,
    "",
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Population | ${fmt(result.population)} |`,
    `| Median Age | ${fmt(result.medianAge)} |`,
    `| Households | ${fmt(result.households)} |`,
    `| Population Density | ${fmt(result.populationDensity)} per km² |`,
  ];

  if (result.workingAgePopulation !== null && result.population) {
    lines.push(`| Working Age (16-64) | ${fmt(result.workingAgePopulation)} (${((result.workingAgePopulation / result.population) * 100).toFixed(1)}%) |`);
  }
  if (result.over65Population !== null && result.population) {
    lines.push(`| Over 65 | ${fmt(result.over65Population)} (${((result.over65Population / result.population) * 100).toFixed(1)}%) |`);
  }

  lines.push("");
  lines.push(`*Source: ONS / Nomis — LAD code: ${result.ladCode}*`);

  return lines.join("\n");
}
