/**
 * Canada City Briefing — Comprehensive brief from ALL Canadian data sources.
 *
 * Pulls from every available Canadian source in parallel.
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { queryStatCanDemographics, formatStatCanResults } from "./statcan-demographics.js";
import { queryStatCanEconomics, formatStatCanEconomicsResults } from "./statcan-economics.js";
import { queryStatCanEmployment, formatStatCanEmploymentResults } from "./statcan-employment.js";
import { queryStatCanCrime, formatStatCanCrimeResults } from "./statcan-crime.js";
import { queryCAWeather, formatCAWeatherResults } from "./msc-weather.js";
import { queryCAAirQuality, formatCAAirQualityResults } from "./msc-air-quality.js";
import { queryCAWater, formatCAWaterResults } from "./msc-water.js";
import { queryStatCanHousing, formatStatCanHousingResults } from "./statcan-housing.js";
import { queryCARepresentatives, formatCARepresentativesResults } from "./represent-reps.js";

export interface CACityBriefing {
  city: string;
  country: 'CA';
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
 * Build a comprehensive Canadian city briefing.
 */
export async function buildCACityBriefing(geo: UnifiedGeoResolution): Promise<CACityBriefing> {
  const [demographics, economics, employment, crime, weather, airQuality, water, housing, representatives] = await Promise.all([
    safeQuery("StatCan Demographics", () => queryStatCanDemographics(geo)),
    safeQuery("StatCan Economics", () => queryStatCanEconomics(geo)),
    safeQuery("StatCan Employment", () => queryStatCanEmployment(geo)),
    safeQuery("StatCan Crime", () => queryStatCanCrime(geo)),
    safeQuery("MSC Weather", () => queryCAWeather(geo)),
    safeQuery("MSC Air Quality", () => queryCAAirQuality(geo)),
    safeQuery("MSC Water", () => queryCAWater(geo)),
    safeQuery("StatCan Housing", () => queryStatCanHousing(geo)),
    safeQuery("Represent Representatives", () => queryCARepresentatives(geo)),
  ]);

  const all = [demographics, economics, employment, crime, weather, airQuality, water, housing, representatives];
  const available = all.filter(s => s.result !== null).map(s => s.name);
  const unavailable = all.filter(s => s.result === null).map(s => `${s.name}${s.error ? ` (${s.error})` : ""}`);

  const sections: Array<{ title: string; content: string; source: string }> = [];

  if (demographics.result) sections.push({ title: "Demographics", content: formatStatCanResults(demographics.result), source: "StatCan" });
  if (economics.result) sections.push({ title: "Economy", content: formatStatCanEconomicsResults(economics.result), source: "StatCan" });
  if (employment.result) sections.push({ title: "Employment", content: formatStatCanEmploymentResults(employment.result), source: "StatCan" });
  if (housing.result) sections.push({ title: "Housing", content: formatStatCanHousingResults(housing.result), source: "StatCan/CREA" });
  if (crime.result) sections.push({ title: "Crime", content: formatStatCanCrimeResults(crime.result), source: "StatCan" });
  if (weather.result) sections.push({ title: "Weather", content: formatCAWeatherResults(weather.result), source: "MSC" });
  if (airQuality.result) sections.push({ title: "Air Quality", content: formatCAAirQualityResults(airQuality.result), source: "MSC" });
  if (water.result) sections.push({ title: "Water", content: formatCAWaterResults(water.result), source: "MSC" });
  if (representatives.result) sections.push({ title: "Representatives", content: formatCARepresentativesResults(representatives.result), source: "Represent" });

  return {
    city: geo.city,
    country: 'CA',
    generatedAt: new Date().toISOString(),
    sections,
    dataSources: { available, unavailable },
  };
}

/**
 * Format Canadian city briefing as markdown.
 */
export function formatCABriefing(briefing: CACityBriefing): string {
  const lines: string[] = [
    `# ${briefing.city}, Canada — City Briefing`,
    `*Generated: ${new Date(briefing.generatedAt).toLocaleDateString("en-CA")}*`,
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
