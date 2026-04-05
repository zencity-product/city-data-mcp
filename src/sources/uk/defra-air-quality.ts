/**
 * DEFRA UK-AIR — Air Quality
 *
 * Free, no API key needed.
 * UK uses DAQI (Daily Air Quality Index, 1-10) not AQI (0-500).
 *
 * API: https://uk-air.defra.gov.uk/sos-ukair/api/v1/
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

const DEFRA_BASE = "https://uk-air.defra.gov.uk/sos-ukair/api/v1";

export interface UKAirQualityResult {
  city: string;
  stations: Array<{
    name: string;
    distance: number;
    readings: Array<{
      parameter: string;
      value: number;
      unit: string;
      timestamp: string;
    }>;
  }>;
  dapiIndex: number | null; // DAQI 1-10
  daqiBand: string | null;
}

const DAQI_BANDS: Array<{ max: number; band: string }> = [
  { max: 1, band: "Low" },
  { max: 2, band: "Low" },
  { max: 3, band: "Low" },
  { max: 4, band: "Moderate" },
  { max: 5, band: "Moderate" },
  { max: 6, band: "Moderate" },
  { max: 7, band: "High" },
  { max: 8, band: "High" },
  { max: 9, band: "High" },
  { max: 10, band: "Very High" },
];

/**
 * Query DEFRA air quality for a UK location.
 */
export async function queryUKAirQuality(geo: UnifiedGeoResolution): Promise<UKAirQualityResult> {
  // Find nearby monitoring stations
  const stationsUrl = `${DEFRA_BASE}/stations?near=${geo.lat},${geo.lon},25`;
  const stationsData = await fetchWithTimeout(stationsUrl, 8000);

  if (!Array.isArray(stationsData) || stationsData.length === 0) {
    throw new Error(`No DEFRA air quality monitoring stations found near ${geo.city}.`);
  }

  // Take up to 3 nearest stations
  const nearbyStations = stationsData.slice(0, 3);
  const result: UKAirQualityResult = {
    city: geo.city,
    stations: [],
    dapiIndex: null,
    daqiBand: null,
  };

  for (const station of nearbyStations) {
    const stationId = station.id;
    const stationName = station.properties?.label || station.properties?.shortName || "Unknown Station";

    // Calculate rough distance
    const sLat = station.geometry?.coordinates?.[1] || 0;
    const sLon = station.geometry?.coordinates?.[0] || 0;
    const distance = haversineKm(geo.lat, geo.lon, sLat, sLon);

    // Get latest readings for this station
    try {
      const timeseriesUrl = `${DEFRA_BASE}/stations/${stationId}/timeseries`;
      const tsData = await fetchWithTimeout(timeseriesUrl, 5000);

      if (!Array.isArray(tsData)) continue;

      const readings: Array<{ parameter: string; value: number; unit: string; timestamp: string }> = [];

      // Get latest reading from each timeseries
      for (const ts of tsData.slice(0, 5)) {
        try {
          const readingUrl = `${DEFRA_BASE}/timeseries/${ts.id}/getData?timespan=PT24H`;
          const readingData = await fetchWithTimeout(readingUrl, 5000);
          const values = readingData?.values;
          if (Array.isArray(values) && values.length > 0) {
            const latest = values[values.length - 1];
            readings.push({
              parameter: ts.parameters?.phenomenon?.label || "Unknown",
              value: latest.value,
              unit: ts.uom || "µg/m³",
              timestamp: latest.timestamp || "",
            });
          }
        } catch {
          // Individual timeseries may fail
        }
      }

      result.stations.push({
        name: stationName,
        distance: Math.round(distance * 10) / 10,
        readings,
      });
    } catch {
      // Station data unavailable
    }
  }

  return result;
}

/**
 * Format UK air quality as markdown.
 */
export function formatUKAirQualityResults(result: UKAirQualityResult): string {
  const lines: string[] = [
    `## ${result.city} — Air Quality (DEFRA UK-AIR)`,
    "",
  ];

  if (result.dapiIndex !== null) {
    lines.push(`**DAQI:** ${result.dapiIndex}/10 (${result.daqiBand})`);
    lines.push("");
  }

  lines.push(`*Note: UK uses DAQI (1-10 scale) not US AQI (0-500). Low (1-3) = Good, Moderate (4-6), High (7-9), Very High (10).*`);
  lines.push("");

  if (result.stations.length === 0) {
    lines.push("No monitoring station data available for this location.");
  }

  for (const station of result.stations) {
    lines.push(`### ${station.name} (${station.distance} km away)`);
    if (station.readings.length > 0) {
      lines.push("| Pollutant | Value | Unit |");
      lines.push("| --- | ---: | --- |");
      for (const r of station.readings) {
        lines.push(`| ${r.parameter} | ${r.value.toFixed(1)} | ${r.unit} |`);
      }
    } else {
      lines.push("No recent readings available.");
    }
    lines.push("");
  }

  lines.push("*Source: DEFRA UK-AIR*");
  return lines.join("\n");
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
