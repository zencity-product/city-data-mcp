/**
 * UK City Briefing — Comprehensive brief from ALL UK data sources.
 *
 * Like the US briefing.ts, pulls from every available UK source in parallel.
 * Each source is fetched independently — failures are skipped gracefully.
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { queryONSDemographics, formatONSResults } from "./ons-demographics.js";
import { queryUKCrime, formatUKCrimeResults } from "./police-crime.js";
import { queryUKWeather, formatUKWeatherResults } from "./met-office-weather.js";
import { queryUKAirQuality, formatUKAirQualityResults } from "./defra-air-quality.js";
import { queryUKWater, formatUKWaterResults } from "./environment-agency-water.js";
import { queryUKEconomics, formatUKEconomicsResults } from "./ons-economics.js";
import { queryUKHousing, formatUKHousingResults } from "./ons-housing.js";
import { queryUKTransport, formatUKTransportResults } from "./dft-transport.js";
import { queryUKSchools, formatUKSchoolResults } from "./dfe-schools.js";
import { queryUKRepresentatives, formatUKRepresentativesResults } from "./theyworkforyou-reps.js";
import { queryUKBudget, formatUKBudgetResults } from "./gov-budget.js";

export interface UKCityBriefing {
  city: string;
  country: 'UK';
  generatedAt: string;
  sections: Array<{ title: string; content: string; source: string }>;
  dataSources: { available: string[]; unavailable: string[] };
}

async function safeQuery<T>(name: string, fn: () => Promise<T>): Promise<{ name: string; result: T | null; error?: string }> {
  try {
    const result = await fn();
    return { name, result };
  } catch (e) {
    return { name, result: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Build a comprehensive UK city briefing.
 */
export async function buildUKCityBriefing(geo: UnifiedGeoResolution): Promise<UKCityBriefing> {
  const [demographics, crime, weather, airQuality, water, economics, housing, transport, schools, representatives, budget] = await Promise.all([
    safeQuery("ONS Demographics", () => queryONSDemographics(geo)),
    safeQuery("UK Crime", () => queryUKCrime(geo)),
    safeQuery("Met Office Weather", () => queryUKWeather(geo)),
    safeQuery("DEFRA Air Quality", () => queryUKAirQuality(geo)),
    safeQuery("Environment Agency Water", () => queryUKWater(geo)),
    safeQuery("ONS Economics", () => queryUKEconomics(geo)),
    safeQuery("ONS Housing", () => queryUKHousing(geo)),
    safeQuery("DfT Transport", () => queryUKTransport(geo)),
    safeQuery("DfE Schools", () => queryUKSchools(geo)),
    safeQuery("TheyWorkForYou Representatives", () => queryUKRepresentatives(geo)),
    safeQuery("Local Authority Budget", () => queryUKBudget(geo)),
  ]);

  const all = [demographics, crime, weather, airQuality, water, economics, housing, transport, schools, representatives, budget];
  const available = all.filter(s => s.result !== null).map(s => s.name);
  const unavailable = all.filter(s => s.result === null).map(s => `${s.name}${s.error ? ` (${s.error})` : ""}`);

  const sections: Array<{ title: string; content: string; source: string }> = [];

  if (demographics.result) sections.push({ title: "Demographics", content: formatONSResults(demographics.result), source: "ONS" });
  if (economics.result) sections.push({ title: "Economy", content: formatUKEconomicsResults(economics.result), source: "ONS" });
  if (housing.result) sections.push({ title: "Housing", content: formatUKHousingResults(housing.result), source: "ONS/Land Registry" });
  if (crime.result) sections.push({ title: "Crime", content: formatUKCrimeResults(crime.result), source: "data.police.uk" });
  if (weather.result) sections.push({ title: "Weather", content: formatUKWeatherResults(weather.result), source: "Met Office" });
  if (airQuality.result) sections.push({ title: "Air Quality", content: formatUKAirQualityResults(airQuality.result), source: "DEFRA" });
  if (water.result) sections.push({ title: "Water", content: formatUKWaterResults(water.result), source: "Environment Agency" });
  if (transport.result) sections.push({ title: "Transport", content: formatUKTransportResults(transport.result), source: "DfT" });
  if (schools.result) sections.push({ title: "Schools", content: formatUKSchoolResults(schools.result), source: "DfE" });
  if (representatives.result) sections.push({ title: "Representatives", content: formatUKRepresentativesResults(representatives.result), source: "TheyWorkForYou" });
  if (budget.result) sections.push({ title: "Budget", content: formatUKBudgetResults(budget.result), source: "DLUHC" });

  return {
    city: geo.city,
    country: 'UK',
    generatedAt: new Date().toISOString(),
    sections,
    dataSources: { available, unavailable },
  };
}

/**
 * Format UK city briefing as markdown.
 */
export function formatUKBriefing(briefing: UKCityBriefing): string {
  const lines: string[] = [
    `# ${briefing.city}, UK — City Briefing`,
    `*Generated: ${new Date(briefing.generatedAt).toLocaleDateString("en-GB")}*`,
    "",
  ];

  for (const section of briefing.sections) {
    lines.push(section.content);
    lines.push("");
  }

  lines.push("---");
  lines.push(`**Data sources used:** ${briefing.dataSources.available.join(", ")}`);
  if (briefing.dataSources.unavailable.length > 0) {
    lines.push(`**Unavailable:** ${briefing.dataSources.unavailable.join(", ")}`);
  }

  return lines.join("\n");
}
