/**
 * MSC GeoMet — Canadian Hydrometric (Water) Data
 *
 * Real-time water level and flow data from Canadian stations.
 * API: https://api.weather.gc.ca/
 * Free, no API key needed.
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

const MSC_BASE = "https://api.weather.gc.ca";

export interface CAWaterResult {
  city: string;
  province: string;
  stations: Array<{
    name: string;
    stationId: string;
    waterLevel: number | null;
    discharge: number | null;
    timestamp: string;
    unit: string;
  }>;
}

/**
 * Query MSC hydrometric data for a Canadian location.
 */
export async function queryCAWater(geo: UnifiedGeoResolution): Promise<CAWaterResult> {
  const result: CAWaterResult = {
    city: geo.city,
    province: geo.stateOrProvince || geo.provinceCode || "",
    stations: [],
  };

  try {
    const bbox = `${geo.lon - 0.5},${geo.lat - 0.5},${geo.lon + 0.5},${geo.lat + 0.5}`;
    const url = `${MSC_BASE}/collections/hydrometric-realtime/items?bbox=${bbox}&limit=5&f=json`;
    const data = await fetchWithTimeout(url, 8000);

    if (data?.features && Array.isArray(data.features)) {
      for (const feature of data.features) {
        const props = feature.properties || {};
        result.stations.push({
          name: props.STATION_NAME || props.station_name || "Unknown",
          stationId: props.STATION_NUMBER || props.station_number || "",
          waterLevel: props.LEVEL ?? props.level ?? null,
          discharge: props.DISCHARGE ?? props.discharge ?? null,
          timestamp: props.datetime || props.DATETIME || "",
          unit: "m / m³/s",
        });
      }
    }
  } catch {
    // Hydrometric data not available
  }

  return result;
}

/**
 * Format Canadian water data as markdown.
 */
export function formatCAWaterResults(result: CAWaterResult): string {
  const lines: string[] = [
    `## ${result.city}, ${result.province} — Water Conditions (MSC)`,
    "",
  ];

  if (result.stations.length === 0) {
    lines.push("No hydrometric monitoring stations found near this location.");
  } else {
    lines.push("| Station | Water Level (m) | Discharge (m³/s) | Time |");
    lines.push("| --- | ---: | ---: | --- |");
    for (const s of result.stations) {
      const time = s.timestamp ? new Date(s.timestamp).toLocaleString("en-CA") : "—";
      lines.push(`| ${s.name} | ${s.waterLevel !== null ? s.waterLevel.toFixed(2) : "—"} | ${s.discharge !== null ? s.discharge.toFixed(1) : "—"} | ${time} |`);
    }
  }

  lines.push("");
  lines.push("*Source: Meteorological Service of Canada — Hydrometric Realtime*");
  return lines.join("\n");
}
