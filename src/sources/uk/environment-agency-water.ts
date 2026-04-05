/**
 * Environment Agency — Flood Monitoring / Water Data
 *
 * Free, no API key needed.
 * API: https://environment.data.gov.uk/flood-monitoring/
 *
 * Provides real-time water levels, flow rates, and flood warnings for England.
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

const EA_BASE = "https://environment.data.gov.uk/flood-monitoring";

export interface UKWaterResult {
  city: string;
  stations: Array<{
    name: string;
    river: string;
    distance: number;
    readings: Array<{
      parameter: string;
      value: number;
      unit: string;
      timestamp: string;
    }>;
  }>;
  floodWarnings: Array<{
    severity: string;
    message: string;
    area: string;
  }>;
}

/**
 * Query Environment Agency water data for a UK location.
 */
export async function queryUKWater(geo: UnifiedGeoResolution): Promise<UKWaterResult> {
  const result: UKWaterResult = {
    city: geo.city,
    stations: [],
    floodWarnings: [],
  };

  // Find nearby monitoring stations
  const stationsUrl = `${EA_BASE}/id/stations?lat=${geo.lat}&long=${geo.lon}&dist=15&_limit=5`;
  const stationsData = await fetchWithTimeout(stationsUrl, 8000);

  if (stationsData?.items && Array.isArray(stationsData.items)) {
    for (const station of stationsData.items.slice(0, 5)) {
      const stationRef = station.stationReference || "";
      const stationName = station.label || "Unknown";
      const river = station.riverName || "Unknown";

      // Calculate distance
      const sLat = station.lat || 0;
      const sLon = station.long || 0;
      const distance = haversineKm(geo.lat, geo.lon, sLat, sLon);

      // Get latest readings
      try {
        const readingsUrl = `${EA_BASE}/id/stations/${stationRef}/readings?_sorted&_limit=5`;
        const readingsData = await fetchWithTimeout(readingsUrl, 5000);

        const readings: Array<{ parameter: string; value: number; unit: string; timestamp: string }> = [];
        if (readingsData?.items && Array.isArray(readingsData.items)) {
          for (const reading of readingsData.items.slice(0, 3)) {
            readings.push({
              parameter: reading.measure?.parameter || "level",
              value: reading.value || 0,
              unit: reading.measure?.unitName || "m",
              timestamp: reading.dateTime || "",
            });
          }
        }

        result.stations.push({
          name: stationName,
          river,
          distance: Math.round(distance * 10) / 10,
          readings,
        });
      } catch {
        // Station readings unavailable
      }
    }
  }

  // Check flood warnings
  try {
    const warningsUrl = `${EA_BASE}/id/floods?lat=${geo.lat}&long=${geo.lon}&dist=20`;
    const warningsData = await fetchWithTimeout(warningsUrl, 5000);
    if (warningsData?.items && Array.isArray(warningsData.items)) {
      for (const warning of warningsData.items.slice(0, 5)) {
        result.floodWarnings.push({
          severity: warning.severityLevel?.toString() || "Unknown",
          message: warning.message || "",
          area: warning.description || warning.eaAreaName || "",
        });
      }
    }
  } catch {
    // Flood warnings unavailable
  }

  return result;
}

/**
 * Format UK water data as markdown.
 */
export function formatUKWaterResults(result: UKWaterResult): string {
  const lines: string[] = [
    `## ${result.city} — Water Conditions (Environment Agency)`,
    "",
  ];

  // Flood warnings first
  if (result.floodWarnings.length > 0) {
    lines.push("### Active Flood Warnings");
    for (const w of result.floodWarnings) {
      lines.push(`- **Severity ${w.severity}** — ${w.area}: ${w.message}`);
    }
    lines.push("");
  }

  if (result.stations.length === 0) {
    lines.push("No monitoring stations found nearby. This may be outside England or far from monitored waterways.");
  }

  for (const station of result.stations) {
    lines.push(`### ${station.name} — ${station.river} (${station.distance} km)`);
    if (station.readings.length > 0) {
      lines.push("| Parameter | Value | Unit | Time |");
      lines.push("| --- | ---: | --- | --- |");
      for (const r of station.readings) {
        const time = r.timestamp ? new Date(r.timestamp).toLocaleString("en-GB") : "—";
        lines.push(`| ${r.parameter} | ${r.value.toFixed(2)} | ${r.unit} | ${time} |`);
      }
    } else {
      lines.push("No recent readings.");
    }
    lines.push("");
  }

  lines.push("*Source: Environment Agency Flood Monitoring*");
  lines.push("*Note: Covers England only. For Scotland, see SEPA; for Wales, see NRW.*");
  return lines.join("\n");
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
