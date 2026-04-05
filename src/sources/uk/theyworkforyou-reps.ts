/**
 * TheyWorkForYou API — UK Political Representatives
 *
 * Requires free API key: TWFY_API_KEY env var.
 * Register at https://www.theyworkforyou.com/api/
 *
 * Provides MP details, voting records, and recent parliamentary activity.
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

const TWFY_BASE = "https://www.theyworkforyou.com/api";

export interface UKRepresentativesResult {
  city: string;
  mp: {
    name: string;
    party: string;
    constituency: string;
    since: string;
    imageUrl: string | null;
  } | null;
  council: string | null;
}

/**
 * Query UK representatives for a location.
 */
export async function queryUKRepresentatives(geo: UnifiedGeoResolution): Promise<UKRepresentativesResult> {
  const apiKey = process.env.TWFY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TWFY_API_KEY not set. Register for a free key at https://www.theyworkforyou.com/api/ and set the TWFY_API_KEY environment variable."
    );
  }

  const result: UKRepresentativesResult = {
    city: geo.city,
    mp: null,
    council: geo.adminArea || null,
  };

  // Try by postcode first (more accurate)
  const postcode = geo.postcode;
  if (postcode) {
    try {
      const url = `${TWFY_BASE}/getMP?postcode=${encodeURIComponent(postcode)}&output=js&key=${apiKey}`;
      const data = await fetchWithTimeout(url, 5000);
      if (data && !data.error) {
        result.mp = {
          name: data.full_name || `${data.given_name || ""} ${data.family_name || ""}`.trim(),
          party: data.party || "Unknown",
          constituency: data.constituency || "",
          since: data.entered_house || "",
          imageUrl: data.image || null,
        };
      }
    } catch {
      // Postcode lookup failed
    }
  }

  // Fallback: try by constituency name if we have one
  if (!result.mp && geo.constituencyCode) {
    try {
      const url = `${TWFY_BASE}/getMP?id=${encodeURIComponent(geo.constituencyCode)}&output=js&key=${apiKey}`;
      const data = await fetchWithTimeout(url, 5000);
      if (data && !data.error) {
        result.mp = {
          name: data.full_name || `${data.given_name || ""} ${data.family_name || ""}`.trim(),
          party: data.party || "Unknown",
          constituency: data.constituency || "",
          since: data.entered_house || "",
          imageUrl: data.image || null,
        };
      }
    } catch {
      // Constituency lookup failed
    }
  }

  return result;
}

/**
 * Format UK representatives as markdown.
 */
export function formatUKRepresentativesResults(result: UKRepresentativesResult): string {
  const lines: string[] = [
    `## ${result.city} — Political Representatives`,
    "",
  ];

  if (result.mp) {
    lines.push("### Member of Parliament");
    lines.push(`| Field | Value |`);
    lines.push(`| --- | --- |`);
    lines.push(`| Name | ${result.mp.name} |`);
    lines.push(`| Party | ${result.mp.party} |`);
    lines.push(`| Constituency | ${result.mp.constituency} |`);
    if (result.mp.since) lines.push(`| In Office Since | ${result.mp.since} |`);
  } else {
    lines.push("MP information not available. This may be in Scotland (use TheyWorkForYou.com directly) or outside a parliamentary constituency.");
  }

  if (result.council) {
    lines.push("");
    lines.push(`### Local Authority`);
    lines.push(`**Council:** ${result.council}`);
  }

  lines.push("");
  lines.push("*Source: TheyWorkForYou API*");
  return lines.join("\n");
}
