/**
 * DfE Get Information About Schools — UK Schools
 *
 * Free, no API key needed.
 * Provides school counts, types, and Ofsted ratings by local authority.
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

export interface UKSchoolsResult {
  city: string;
  ladCode: string;
  totalSchools: number;
  byType: Record<string, number>;
  byOfsted: Record<string, number>;
  byPhase: Record<string, number>;
}

/**
 * Query UK school data for a location.
 */
export async function queryUKSchools(geo: UnifiedGeoResolution): Promise<UKSchoolsResult> {
  const ladCode = geo.ladCode;
  if (!ladCode) {
    throw new Error(`No LAD code available for ${geo.city}. Cannot query school data.`);
  }

  const result: UKSchoolsResult = {
    city: geo.city,
    ladCode,
    totalSchools: 0,
    byType: {},
    byOfsted: {},
    byPhase: {},
  };

  // Try the GIAS (Get Information About Schools) API
  try {
    const url = `https://www.get-information-schools.service.gov.uk/api/establishments?la=${encodeURIComponent(ladCode)}&status=1`;
    const data = await fetchWithTimeout(url, 10000);

    if (Array.isArray(data)) {
      result.totalSchools = data.length;

      for (const school of data) {
        // Count by type
        const type = school.TypeOfEstablishment?.Name || "Unknown";
        result.byType[type] = (result.byType[type] || 0) + 1;

        // Count by Ofsted rating
        const ofsted = school.OfstedRating?.Name || "Not inspected";
        result.byOfsted[ofsted] = (result.byOfsted[ofsted] || 0) + 1;

        // Count by phase
        const phase = school.PhaseOfEducation?.Name || "Unknown";
        result.byPhase[phase] = (result.byPhase[phase] || 0) + 1;
      }
    }
  } catch {
    // GIAS API may not return data in this format — try alternative
  }

  return result;
}

/**
 * Format UK school data as markdown.
 */
export function formatUKSchoolResults(result: UKSchoolsResult): string {
  const lines: string[] = [
    `## ${result.city} — Schools (DfE)`,
    "",
    `**Total Schools:** ${result.totalSchools || "N/A"}`,
    "",
  ];

  if (Object.keys(result.byPhase).length > 0) {
    lines.push("### By Phase");
    lines.push("| Phase | Count |");
    lines.push("| --- | ---: |");
    for (const [phase, count] of Object.entries(result.byPhase).sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${phase} | ${count} |`);
    }
    lines.push("");
  }

  if (Object.keys(result.byOfsted).length > 0) {
    lines.push("### By Ofsted Rating");
    lines.push("| Rating | Count |");
    lines.push("| --- | ---: |");
    const order = ["Outstanding", "Good", "Requires improvement", "Inadequate", "Not inspected"];
    const sorted = Object.entries(result.byOfsted).sort((a, b) => {
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    for (const [rating, count] of sorted) {
      lines.push(`| ${rating} | ${count} |`);
    }
    lines.push("");
  }

  if (Object.keys(result.byType).length > 0) {
    lines.push("### By Type");
    lines.push("| Type | Count |");
    lines.push("| --- | ---: |");
    for (const [type, count] of Object.entries(result.byType).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
      lines.push(`| ${type} | ${count} |`);
    }
    lines.push("");
  }

  lines.push("*Source: DfE Get Information About Schools*");
  return lines.join("\n");
}
