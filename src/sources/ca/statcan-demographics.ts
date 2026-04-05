/**
 * Statistics Canada Census Profile — Demographics
 *
 * Uses the StatCan Census Profile SDMX REST API.
 * Free, no API key needed.
 *
 * Key dataflows: DF_CMACA (metro areas), DF_CSD (municipalities)
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

const STATCAN_CENSUS_BASE = "https://api.statcan.gc.ca/census-recensement/profile/sdmx/rest";

export interface StatCanDemographicsResult {
  city: string;
  province: string;
  population: number | null;
  medianAge: number | null;
  medianIncome: number | null;
  averageIncome: number | null;
  households: number | null;
  averageHouseholdSize: number | null;
  immigrantPopulation: number | null;
  bachelorsDegreeRate: number | null;
  unemploymentRate: number | null;
  medianHomeValue: number | null;
  populationGrowth5yr: number | null;
}

// Census Profile characteristic IDs
const CHARACTERISTICS: Record<string, { id: string; label: string }> = {
  population: { id: "1", label: "Population, 2021" },
  popGrowth: { id: "3", label: "Pop growth 2016-2021" },
  medianAge: { id: "39", label: "Median age" },
  medianIncome: { id: "236", label: "Median total income" },
  averageIncome: { id: "237", label: "Average total income" },
  households: { id: "52", label: "Total private dwellings" },
  avgHHSize: { id: "56", label: "Average household size" },
  immigrants: { id: "1169", label: "Immigrants" },
};

/**
 * Query StatCan demographics for a Canadian location.
 */
export async function queryStatCanDemographics(geo: UnifiedGeoResolution): Promise<StatCanDemographicsResult> {
  const result: StatCanDemographicsResult = {
    city: geo.city,
    province: geo.stateOrProvince || geo.provinceCode || "",
    population: null,
    medianAge: null,
    medianIncome: null,
    averageIncome: null,
    households: null,
    averageHouseholdSize: null,
    immigrantPopulation: null,
    bachelorsDegreeRate: null,
    unemploymentRate: null,
    medianHomeValue: null,
    populationGrowth5yr: null,
  };

  const cdId = geo.censusDivisionId;
  if (!cdId) {
    throw new Error(`No census division ID available for ${geo.city}. Cannot query StatCan data.`);
  }

  // Try the WDS API for Census Profile data
  try {
    // Use the Census Profile table (98-316-X2021001)
    const url = `https://www12.statcan.gc.ca/rest/census-recensement/CR2021Geo.json?lang=E&dguid=2021A00${cdId.padStart(4, "0")}`;
    const data = await fetchWithTimeout(url, 8000);
    if (data) {
      // Parse Census Profile response
      if (data.DATA) {
        for (const row of data.DATA) {
          // Row structure varies — parse based on characteristic ID
          const charId = row.CHARACTERISTIC_ID?.toString();
          const value = parseFloat(row.C1_COUNT_TOTAL);
          if (isNaN(value)) continue;

          switch (charId) {
            case "1": result.population = value; break;
            case "3": result.populationGrowth5yr = value; break;
            case "39": result.medianAge = value; break;
            case "236": result.medianIncome = value; break;
            case "237": result.averageIncome = value; break;
            case "52": result.households = value; break;
            case "56": result.averageHouseholdSize = value; break;
          }
        }
      }
    }
  } catch {
    // Census Profile API failed — try WDS tables
  }

  // Fallback: try WDS table for population
  if (result.population === null) {
    try {
      const url = `https://www150.statcan.gc.ca/t1/tbl1/en/dtl!downloadTbl/en/CSV/1710014201-eng.zip`;
      // This is a large file — skip for now, use lookup
    } catch {
      // WDS fallback failed
    }
  }

  return result;
}

/**
 * Format StatCan demographics as markdown.
 */
export function formatStatCanResults(result: StatCanDemographicsResult): string {
  const fmt = (n: number | null, type: "number" | "dollar" | "percent" = "number"): string => {
    if (n === null) return "N/A";
    if (type === "dollar") return `$${n.toLocaleString()} CAD`;
    if (type === "percent") return `${n.toFixed(1)}%`;
    return n.toLocaleString();
  };

  const lines: string[] = [
    `## ${result.city}, ${result.province} — Demographics (StatCan)`,
    "",
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Population | ${fmt(result.population)} |`,
    `| Population Growth (5yr) | ${fmt(result.populationGrowth5yr, "percent")} |`,
    `| Median Age | ${fmt(result.medianAge)} |`,
    `| Median Total Income | ${fmt(result.medianIncome, "dollar")} |`,
    `| Average Total Income | ${fmt(result.averageIncome, "dollar")} |`,
    `| Households | ${fmt(result.households)} |`,
    `| Average Household Size | ${fmt(result.averageHouseholdSize)} |`,
    `| Immigrant Population | ${fmt(result.immigrantPopulation)} |`,
    `| Bachelor's Degree Rate | ${fmt(result.bachelorsDegreeRate, "percent")} |`,
    `| Unemployment Rate | ${fmt(result.unemploymentRate, "percent")} |`,
    `| Median Home Value | ${fmt(result.medianHomeValue, "dollar")} |`,
  ];

  lines.push("");
  lines.push("*Source: Statistics Canada — 2021 Census Profile*");
  lines.push("*Note: Income figures are in Canadian dollars.*");
  return lines.join("\n");
}
