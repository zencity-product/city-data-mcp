/**
 * MSC GeoMet — Canadian Air Quality (AQHI)
 *
 * Air Quality Health Index (AQHI) observations.
 * API: https://api.weather.gc.ca/
 * Free, no API key needed.
 *
 * Note: Canada uses AQHI (1-10+) not US AQI (0-500).
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

const MSC_BASE = "https://api.weather.gc.ca";

export interface CAAirQualityResult {
  city: string;
  province: string;
  aqhi: number | null;
  aqhiCategory: string | null;
  readings: Array<{
    station: string;
    aqhi: number;
    timestamp: string;
  }>;
}

function getAQHICategory(aqhi: number): string {
  if (aqhi <= 3) return "Low Risk";
  if (aqhi <= 6) return "Moderate Risk";
  if (aqhi <= 10) return "High Risk";
  return "Very High Risk";
}

/**
 * Query AQHI for a Canadian location.
 */
export async function queryCAAirQuality(geo: UnifiedGeoResolution): Promise<CAAirQualityResult> {
  const result: CAAirQualityResult = {
    city: geo.city,
    province: geo.stateOrProvince || geo.provinceCode || "",
    aqhi: null,
    aqhiCategory: null,
    readings: [],
  };

  try {
    const bbox = `${geo.lon - 0.5},${geo.lat - 0.5},${geo.lon + 0.5},${geo.lat + 0.5}`;
    const url = `${MSC_BASE}/collections/aqhi-observations-realtime/items?bbox=${bbox}&limit=5&f=json`;
    const data = await fetchWithTimeout(url, 8000);

    if (data?.features && Array.isArray(data.features)) {
      for (const feature of data.features) {
        const props = feature.properties || {};
        const aqhi = props.aqhi_current ?? props.aqhi ?? null;
        if (aqhi !== null) {
          const station = props.location_name_en || props.station_name || "Unknown";
          result.readings.push({
            station,
            aqhi: parseFloat(aqhi),
            timestamp: props.observation_datetime || "",
          });
        }
      }

      // Use the first (nearest) reading as the city value
      if (result.readings.length > 0) {
        result.aqhi = result.readings[0].aqhi;
        result.aqhiCategory = getAQHICategory(result.aqhi);
      }
    }
  } catch {
    // AQHI data not available
  }

  return result;
}

/**
 * Format Canadian air quality as markdown.
 */
export function formatCAAirQualityResults(result: CAAirQualityResult): string {
  const lines: string[] = [
    `## ${result.city}, ${result.province} — Air Quality (AQHI)`,
    "",
  ];

  if (result.aqhi !== null) {
    lines.push(`**AQHI:** ${result.aqhi}/10 (${result.aqhiCategory})`);
    lines.push("");
  }

  lines.push("*Note: Canada uses AQHI (1-10+ scale) not US AQI (0-500). Low Risk (1-3), Moderate Risk (4-6), High Risk (7-10), Very High Risk (10+).*");
  lines.push("");

  if (result.readings.length > 0) {
    lines.push("| Station | AQHI | Time |");
    lines.push("| --- | ---: | --- |");
    for (const r of result.readings) {
      const time = r.timestamp ? new Date(r.timestamp).toLocaleString("en-CA") : "—";
      lines.push(`| ${r.station} | ${r.aqhi} | ${time} |`);
    }
  } else {
    lines.push("No AQHI monitoring data available for this location.");
  }

  lines.push("");
  lines.push("*Source: Meteorological Service of Canada — AQHI*");
  return lines.join("\n");
}
