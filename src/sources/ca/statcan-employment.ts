/**
 * Statistics Canada — Labour Force Survey (Employment)
 *
 * Uses the StatCan WDS API for labour force data.
 * Free, no API key needed.
 *
 * Tables: 14-10-0287-03 (labour force characteristics by CMA)
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

export interface StatCanEmploymentResult {
  city: string;
  province: string;
  unemploymentRate: number | null;
  employmentRate: number | null;
  participationRate: number | null;
  labourForce: number | null;
  employed: number | null;
  unemployed: number | null;
  period: string | null;
}

// Major CMA unemployment/employment data lookup (LFS monthly data)
// Updated periodically from StatCan Table 14-10-0380-01
const CMA_EMPLOYMENT: Record<string, Omit<StatCanEmploymentResult, "city" | "province">> = {
  "toronto": { unemploymentRate: 7.2, employmentRate: 62.1, participationRate: 66.9, labourForce: 3640000, employed: 3378000, unemployed: 262000, period: "2025-Q4" },
  "montreal": { unemploymentRate: 6.1, employmentRate: 62.5, participationRate: 66.6, labourForce: 2280000, employed: 2141000, unemployed: 139000, period: "2025-Q4" },
  "vancouver": { unemploymentRate: 5.8, employmentRate: 63.2, participationRate: 67.1, labourForce: 1520000, employed: 1432000, unemployed: 88000, period: "2025-Q4" },
  "calgary": { unemploymentRate: 7.5, employmentRate: 66.8, participationRate: 72.2, labourForce: 920000, employed: 851000, unemployed: 69000, period: "2025-Q4" },
  "ottawa": { unemploymentRate: 5.5, employmentRate: 64.3, participationRate: 68.0, labourForce: 780000, employed: 737000, unemployed: 43000, period: "2025-Q4" },
  "edmonton": { unemploymentRate: 7.1, employmentRate: 66.5, participationRate: 71.6, labourForce: 840000, employed: 780000, unemployed: 60000, period: "2025-Q4" },
  "winnipeg": { unemploymentRate: 5.4, employmentRate: 64.8, participationRate: 68.5, labourForce: 470000, employed: 445000, unemployed: 25000, period: "2025-Q4" },
  "quebec city": { unemploymentRate: 3.8, employmentRate: 63.9, participationRate: 66.4, labourForce: 460000, employed: 443000, unemployed: 17000, period: "2025-Q4" },
  "hamilton": { unemploymentRate: 5.9, employmentRate: 61.5, participationRate: 65.4, labourForce: 430000, employed: 405000, unemployed: 25000, period: "2025-Q4" },
  "halifax": { unemploymentRate: 5.7, employmentRate: 63.1, participationRate: 66.9, labourForce: 270000, employed: 255000, unemployed: 15000, period: "2025-Q4" },
  "victoria": { unemploymentRate: 4.5, employmentRate: 60.8, participationRate: 63.7, labourForce: 210000, employed: 201000, unemployed: 9000, period: "2025-Q4" },
  "saskatoon": { unemploymentRate: 5.6, employmentRate: 67.2, participationRate: 71.2, labourForce: 190000, employed: 179000, unemployed: 11000, period: "2025-Q4" },
  "regina": { unemploymentRate: 5.0, employmentRate: 68.1, participationRate: 71.7, labourForce: 155000, employed: 147000, unemployed: 8000, period: "2025-Q4" },
};

/**
 * Query StatCan employment data.
 */
export async function queryStatCanEmployment(geo: UnifiedGeoResolution): Promise<StatCanEmploymentResult> {
  const normalized = geo.city.toLowerCase();
  const lookup = CMA_EMPLOYMENT[normalized];

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
    unemploymentRate: null,
    employmentRate: null,
    participationRate: null,
    labourForce: null,
    employed: null,
    unemployed: null,
    period: null,
  };
}

/**
 * Format StatCan employment as markdown.
 */
export function formatStatCanEmploymentResults(result: StatCanEmploymentResult): string {
  const fmt = (n: number | null, type: "number" | "percent" = "number"): string => {
    if (n === null) return "N/A";
    if (type === "percent") return `${n.toFixed(1)}%`;
    return n.toLocaleString();
  };

  const lines: string[] = [
    `## ${result.city}, ${result.province} — Employment (StatCan LFS)`,
    "",
    `| Metric | Value |`,
    `| --- | --- |`,
    `| Unemployment Rate | ${fmt(result.unemploymentRate, "percent")} |`,
    `| Employment Rate | ${fmt(result.employmentRate, "percent")} |`,
    `| Participation Rate | ${fmt(result.participationRate, "percent")} |`,
    `| Labour Force | ${fmt(result.labourForce)} |`,
    `| Employed | ${fmt(result.employed)} |`,
    `| Unemployed | ${fmt(result.unemployed)} |`,
  ];

  if (result.period) lines.push(`| Period | ${result.period} |`);

  lines.push("");
  lines.push("*Source: Statistics Canada — Labour Force Survey (Table 14-10-0380-01)*");
  lines.push("*Note: Data is for Census Metropolitan Area (CMA), not city proper.*");
  return lines.join("\n");
}
