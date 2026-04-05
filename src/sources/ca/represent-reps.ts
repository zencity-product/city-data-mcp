/**
 * Represent API — Canadian Political Representatives
 *
 * Open North's Represent API.
 * Free, no API key needed. Rate limit: 60 req/min.
 * Returns representatives at all levels: federal, provincial, municipal.
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

const REPRESENT_BASE = "https://represent.opennorth.ca";

export interface CARepresentativesResult {
  city: string;
  province: string;
  representatives: Array<{
    name: string;
    party: string;
    level: string;
    office: string;
    district: string;
    email: string | null;
    url: string | null;
  }>;
}

/**
 * Query Canadian representatives for a location.
 */
export async function queryCARepresentatives(geo: UnifiedGeoResolution): Promise<CARepresentativesResult> {
  const result: CARepresentativesResult = {
    city: geo.city,
    province: geo.stateOrProvince || geo.provinceCode || "",
    representatives: [],
  };

  try {
    const url = `${REPRESENT_BASE}/representatives/?point=${geo.lat},${geo.lon}`;
    const data = await fetchWithTimeout(url, 8000);

    if (data?.objects && Array.isArray(data.objects)) {
      for (const rep of data.objects) {
        result.representatives.push({
          name: rep.name || "Unknown",
          party: rep.party_name || "",
          level: categorizeLevel(rep.elected_office || "", rep.representative_set_name || ""),
          office: rep.elected_office || "",
          district: rep.district_name || "",
          email: rep.email || null,
          url: rep.url || rep.personal_url || null,
        });
      }

      // Sort by level: federal → provincial → municipal
      const levelOrder: Record<string, number> = { "Federal": 0, "Provincial": 1, "Municipal": 2, "Other": 3 };
      result.representatives.sort((a, b) => (levelOrder[a.level] ?? 3) - (levelOrder[b.level] ?? 3));
    }
  } catch {
    // Represent API unavailable
  }

  return result;
}

function categorizeLevel(office: string, setName: string): string {
  const lower = (office + " " + setName).toLowerCase();
  if (lower.includes("mp") || lower.includes("house of commons") || lower.includes("federal")) return "Federal";
  if (lower.includes("mla") || lower.includes("mpp") || lower.includes("mna") || lower.includes("provincial") || lower.includes("legislature")) return "Provincial";
  if (lower.includes("councillor") || lower.includes("mayor") || lower.includes("municipal") || lower.includes("city")) return "Municipal";
  return "Other";
}

/**
 * Format Canadian representatives as markdown.
 */
export function formatCARepresentativesResults(result: CARepresentativesResult): string {
  const lines: string[] = [
    `## ${result.city}, ${result.province} — Political Representatives`,
    "",
  ];

  if (result.representatives.length === 0) {
    lines.push("No representative data available for this location.");
    lines.push("");
    lines.push("*Source: Represent (Open North)*");
    return lines.join("\n");
  }

  let currentLevel = "";
  for (const rep of result.representatives) {
    if (rep.level !== currentLevel) {
      currentLevel = rep.level;
      lines.push(`### ${currentLevel}`);
      lines.push("| Name | Party | Office | District |");
      lines.push("| --- | --- | --- | --- |");
    }
    lines.push(`| ${rep.name} | ${rep.party || "—"} | ${rep.office} | ${rep.district} |`);
  }

  lines.push("");
  lines.push("*Source: Represent API (Open North)*");
  return lines.join("\n");
}
