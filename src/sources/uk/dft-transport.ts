/**
 * DfT Transport Statistics — UK Transport
 *
 * Department for Transport data on road traffic, bus usage, rail.
 * Uses lookup tables for major cities since the API is limited.
 */

import type { UnifiedGeoResolution } from "../../types.js";

export interface UKTransportResult {
  city: string;
  region: string;
  roadTraffic: {
    billionVehicleMiles: number | null;
    year: number | null;
  };
  busPassengers: {
    millionJourneys: number | null;
    year: number | null;
  };
  railStationUsage: {
    millionEntries: number | null;
    year: number | null;
  };
}

// Lookup table for major cities — sourced from DfT published statistics
const CITY_TRANSPORT: Record<string, Partial<UKTransportResult>> = {
  "london": {
    roadTraffic: { billionVehicleMiles: 20.1, year: 2023 },
    busPassengers: { millionJourneys: 1937, year: 2023 },
    railStationUsage: { millionEntries: 1200, year: 2023 },
  },
  "birmingham": {
    roadTraffic: { billionVehicleMiles: 4.2, year: 2023 },
    busPassengers: { millionJourneys: 160, year: 2023 },
    railStationUsage: { millionEntries: 46, year: 2023 },
  },
  "manchester": {
    roadTraffic: { billionVehicleMiles: 3.8, year: 2023 },
    busPassengers: { millionJourneys: 195, year: 2023 },
    railStationUsage: { millionEntries: 32, year: 2023 },
  },
  "leeds": {
    roadTraffic: { billionVehicleMiles: 3.5, year: 2023 },
    busPassengers: { millionJourneys: 105, year: 2023 },
    railStationUsage: { millionEntries: 35, year: 2023 },
  },
  "glasgow": {
    roadTraffic: { billionVehicleMiles: 2.8, year: 2023 },
    busPassengers: { millionJourneys: 130, year: 2023 },
    railStationUsage: { millionEntries: 30, year: 2023 },
  },
  "edinburgh": {
    roadTraffic: { billionVehicleMiles: 2.1, year: 2023 },
    busPassengers: { millionJourneys: 120, year: 2023 },
    railStationUsage: { millionEntries: 24, year: 2023 },
  },
  "liverpool": {
    roadTraffic: { billionVehicleMiles: 2.5, year: 2023 },
    busPassengers: { millionJourneys: 108, year: 2023 },
    railStationUsage: { millionEntries: 22, year: 2023 },
  },
  "bristol": {
    roadTraffic: { billionVehicleMiles: 2.0, year: 2023 },
    busPassengers: { millionJourneys: 55, year: 2023 },
    railStationUsage: { millionEntries: 13, year: 2023 },
  },
};

/**
 * Query UK transport data for a location.
 */
export async function queryUKTransport(geo: UnifiedGeoResolution): Promise<UKTransportResult> {
  const normalized = geo.city.toLowerCase();
  const lookup = CITY_TRANSPORT[normalized];

  return {
    city: geo.city,
    region: geo.stateOrProvince || "",
    roadTraffic: lookup?.roadTraffic || { billionVehicleMiles: null, year: null },
    busPassengers: lookup?.busPassengers || { millionJourneys: null, year: null },
    railStationUsage: lookup?.railStationUsage || { millionEntries: null, year: null },
  };
}

/**
 * Format UK transport data as markdown.
 */
export function formatUKTransportResults(result: UKTransportResult): string {
  const lines: string[] = [
    `## ${result.city} — Transport (DfT)`,
    "",
    `**Region:** ${result.region}`,
    "",
    `| Metric | Value | Year |`,
    `| --- | --- | --- |`,
  ];

  const rt = result.roadTraffic;
  if (rt.billionVehicleMiles !== null) {
    lines.push(`| Road Traffic | ${rt.billionVehicleMiles} billion vehicle-miles | ${rt.year || "—"} |`);
  }

  const bp = result.busPassengers;
  if (bp.millionJourneys !== null) {
    lines.push(`| Bus Passengers | ${bp.millionJourneys}M journeys | ${bp.year || "—"} |`);
  }

  const rs = result.railStationUsage;
  if (rs.millionEntries !== null) {
    lines.push(`| Rail Station Entries | ${rs.millionEntries}M | ${rs.year || "—"} |`);
  }

  if (!rt.billionVehicleMiles && !bp.millionJourneys && !rs.millionEntries) {
    lines.push("| — | No transport data available for this city | — |");
  }

  lines.push("");
  lines.push("*Source: Department for Transport statistics*");
  lines.push("*Note: Data from published DfT statistics. Available for major cities only.*");
  return lines.join("\n");
}
