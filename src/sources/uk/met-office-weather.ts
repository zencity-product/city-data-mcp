/**
 * Met Office DataHub — UK Weather
 *
 * Requires free API key: METOFFICE_API_KEY env var.
 * Register at https://datahub.metoffice.gov.uk/
 *
 * Provides site-specific hourly and 3-hourly forecasts.
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

const METOFFICE_BASE = "https://data.hub.api.metoffice.gov.uk/sitespecific/v0";

export interface UKWeatherResult {
  city: string;
  current: {
    temperature: number | null;
    feelsLike: number | null;
    humidity: number | null;
    windSpeed: number | null;
    windDirection: string | null;
    precipitationProb: number | null;
    uvIndex: number | null;
    visibility: string | null;
    weatherType: string | null;
  };
  forecast: Array<{
    time: string;
    temperature: number | null;
    precipitationProb: number | null;
    weatherType: string | null;
  }>;
}

const WEATHER_TYPES: Record<number, string> = {
  0: "Clear night", 1: "Sunny day", 2: "Partly cloudy (night)", 3: "Partly cloudy (day)",
  5: "Mist", 6: "Fog", 7: "Cloudy", 8: "Overcast",
  9: "Light rain shower (night)", 10: "Light rain shower (day)",
  11: "Drizzle", 12: "Light rain", 13: "Heavy rain shower (night)",
  14: "Heavy rain shower (day)", 15: "Heavy rain",
  16: "Sleet shower (night)", 17: "Sleet shower (day)", 18: "Sleet",
  19: "Hail shower (night)", 20: "Hail shower (day)", 21: "Hail",
  22: "Light snow shower (night)", 23: "Light snow shower (day)", 24: "Light snow",
  25: "Heavy snow shower (night)", 26: "Heavy snow shower (day)", 27: "Heavy snow",
  28: "Thunder shower (night)", 29: "Thunder shower (day)", 30: "Thunder",
};

/**
 * Query Met Office weather for a UK location.
 */
export async function queryUKWeather(geo: UnifiedGeoResolution): Promise<UKWeatherResult> {
  const apiKey = process.env.METOFFICE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "METOFFICE_API_KEY not set. Register for a free key at https://datahub.metoffice.gov.uk/ and set the METOFFICE_API_KEY environment variable."
    );
  }

  const url = `${METOFFICE_BASE}/point/hourly?latitude=${geo.lat}&longitude=${geo.lon}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "apikey": apiKey,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Met Office API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const features = data?.features?.[0]?.properties?.timeSeries || [];

    // Current = first entry
    const current = features[0] || {};
    const forecast = features.slice(1, 25).map((entry: any) => ({
      time: entry.time || "",
      temperature: entry.screenTemperature ?? null,
      precipitationProb: entry.probOfPrecipitation ?? null,
      weatherType: WEATHER_TYPES[entry.significantWeatherCode] || null,
    }));

    return {
      city: geo.city,
      current: {
        temperature: current.screenTemperature ?? null,
        feelsLike: current.feelsLikeTemperature ?? null,
        humidity: current.screenRelativeHumidity ?? null,
        windSpeed: current.windSpeed10m ?? null,
        windDirection: current.windDirectionFrom10m ? `${current.windDirectionFrom10m}°` : null,
        precipitationProb: current.probOfPrecipitation ?? null,
        uvIndex: current.uvIndex ?? null,
        visibility: current.visibility ? `${(current.visibility / 1000).toFixed(1)} km` : null,
        weatherType: WEATHER_TYPES[current.significantWeatherCode] || null,
      },
      forecast,
    };
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}

/**
 * Format UK weather as markdown.
 */
export function formatUKWeatherResults(result: UKWeatherResult): string {
  const c = result.current;
  const lines: string[] = [
    `## ${result.city} — Weather (Met Office)`,
    "",
    `### Current Conditions`,
    `| Metric | Value |`,
    `| --- | --- |`,
  ];

  if (c.weatherType) lines.push(`| Conditions | ${c.weatherType} |`);
  if (c.temperature !== null) lines.push(`| Temperature | ${c.temperature}°C |`);
  if (c.feelsLike !== null) lines.push(`| Feels Like | ${c.feelsLike}°C |`);
  if (c.humidity !== null) lines.push(`| Humidity | ${c.humidity}% |`);
  if (c.windSpeed !== null) lines.push(`| Wind Speed | ${c.windSpeed} m/s |`);
  if (c.precipitationProb !== null) lines.push(`| Precipitation Probability | ${c.precipitationProb}% |`);
  if (c.uvIndex !== null) lines.push(`| UV Index | ${c.uvIndex} |`);
  if (c.visibility) lines.push(`| Visibility | ${c.visibility} |`);

  if (result.forecast.length > 0) {
    lines.push("");
    lines.push("### 24-Hour Forecast");
    lines.push("| Time | Temp | Precip | Conditions |");
    lines.push("| --- | --- | --- | --- |");
    // Show every 3 hours
    for (let i = 0; i < result.forecast.length; i += 3) {
      const f = result.forecast[i];
      const time = f.time ? new Date(f.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";
      lines.push(`| ${time} | ${f.temperature !== null ? f.temperature + "°C" : "—"} | ${f.precipitationProb !== null ? f.precipitationProb + "%" : "—"} | ${f.weatherType || "—"} |`);
    }
  }

  lines.push("");
  lines.push("*Source: Met Office DataHub*");
  return lines.join("\n");
}
