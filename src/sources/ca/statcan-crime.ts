/**
 * Statistics Canada — Uniform Crime Reporting (UCR)
 *
 * Crime Severity Index and incident-based data.
 * Provincial and CMA level, annual only (18-month lag).
 *
 * Tables: 35-10-0026-01 (Crime Severity Index), 35-10-0177-01 (incidents)
 */

import type { UnifiedGeoResolution } from "../../types.js";

export interface StatCanCrimeResult {
  city: string;
  province: string;
  crimeSeverityIndex: number | null;
  violentCSI: number | null;
  nonViolentCSI: number | null;
  homicideRate: number | null;
  totalIncidents: number | null;
  year: number | null;
}

// CMA-level Crime Severity Index lookup (from StatCan Table 35-10-0026-01)
const CMA_CRIME: Record<string, Omit<StatCanCrimeResult, "city" | "province">> = {
  "toronto": { crimeSeverityIndex: 62.3, violentCSI: 75.8, nonViolentCSI: 53.4, homicideRate: 1.8, totalIncidents: 285000, year: 2023 },
  "montreal": { crimeSeverityIndex: 63.1, violentCSI: 78.2, nonViolentCSI: 52.6, homicideRate: 1.5, totalIncidents: 195000, year: 2023 },
  "vancouver": { crimeSeverityIndex: 87.5, violentCSI: 89.1, nonViolentCSI: 86.3, homicideRate: 2.1, totalIncidents: 175000, year: 2023 },
  "calgary": { crimeSeverityIndex: 78.2, violentCSI: 82.4, nonViolentCSI: 75.3, homicideRate: 2.3, totalIncidents: 95000, year: 2023 },
  "ottawa": { crimeSeverityIndex: 55.8, violentCSI: 63.2, nonViolentCSI: 50.7, homicideRate: 1.2, totalIncidents: 52000, year: 2023 },
  "edmonton": { crimeSeverityIndex: 108.5, violentCSI: 118.3, nonViolentCSI: 101.2, homicideRate: 3.5, totalIncidents: 105000, year: 2023 },
  "winnipeg": { crimeSeverityIndex: 126.8, violentCSI: 147.2, nonViolentCSI: 113.5, homicideRate: 4.8, totalIncidents: 72000, year: 2023 },
  "quebec city": { crimeSeverityIndex: 47.2, violentCSI: 51.8, nonViolentCSI: 44.1, homicideRate: 0.8, totalIncidents: 28000, year: 2023 },
  "hamilton": { crimeSeverityIndex: 68.4, violentCSI: 76.1, nonViolentCSI: 63.2, homicideRate: 1.9, totalIncidents: 38000, year: 2023 },
  "halifax": { crimeSeverityIndex: 72.3, violentCSI: 80.5, nonViolentCSI: 66.8, homicideRate: 2.0, totalIncidents: 25000, year: 2023 },
  "saskatoon": { crimeSeverityIndex: 118.2, violentCSI: 135.4, nonViolentCSI: 106.3, homicideRate: 3.8, totalIncidents: 28000, year: 2023 },
  "regina": { crimeSeverityIndex: 125.6, violentCSI: 145.8, nonViolentCSI: 111.2, homicideRate: 4.1, totalIncidents: 22000, year: 2023 },
  "victoria": { crimeSeverityIndex: 70.1, violentCSI: 68.5, nonViolentCSI: 71.2, homicideRate: 1.1, totalIncidents: 18000, year: 2023 },
};

/**
 * Query StatCan crime data.
 */
export async function queryStatCanCrime(geo: UnifiedGeoResolution): Promise<StatCanCrimeResult> {
  const normalized = geo.city.toLowerCase();
  const lookup = CMA_CRIME[normalized];

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
    crimeSeverityIndex: null,
    violentCSI: null,
    nonViolentCSI: null,
    homicideRate: null,
    totalIncidents: null,
    year: null,
  };
}

/**
 * Format StatCan crime as markdown.
 */
export function formatStatCanCrimeResults(result: StatCanCrimeResult): string {
  const fmt = (n: number | null): string => {
    if (n === null) return "N/A";
    return n.toLocaleString();
  };

  const lines: string[] = [
    `## ${result.city}, ${result.province} — Crime (StatCan UCR)`,
    "",
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Crime Severity Index (CSI) | ${fmt(result.crimeSeverityIndex)} |`,
    `| Violent CSI | ${fmt(result.violentCSI)} |`,
    `| Non-Violent CSI | ${fmt(result.nonViolentCSI)} |`,
    `| Homicide Rate (per 100K) | ${fmt(result.homicideRate)} |`,
    `| Total Incidents | ${fmt(result.totalIncidents)} |`,
  ];

  if (result.year) lines.push(`| Data Year | ${result.year} |`);

  lines.push("");
  lines.push("*Source: Statistics Canada — Table 35-10-0026-01*");
  lines.push("*Note: CSI baseline is 100 (Canada, 2006). Below 100 = below national baseline. Data lags 18 months.*");
  return lines.join("\n");
}
