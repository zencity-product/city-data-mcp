/**
 * MSC GeoMet — Canadian Weather
 *
 * Meteorological Service of Canada weather data.
 * API: https://api.weather.gc.ca/
 * Free, no API key needed.
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

const MSC_BASE = "https://api.weather.gc.ca";

export interface CAWeatherResult {
  city: string;
  province: string;
  current: {
    temperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
    windDirection: string | null;
    condition: string | null;
    pressure: number | null;
  };
  forecast: Array<{
    period: string;
    temperature: number | null;
    condition: string | null;
  }>;
  warnings: string[];
}

/**
 * Query MSC weather for a Canadian location.
 */
export async function queryCAWeather(geo: UnifiedGeoResolution): Promise<CAWeatherResult> {
  const result: CAWeatherResult = {
    city: geo.city,
    province: geo.stateOrProvince || geo.provinceCode || "",
    current: {
      temperature: null,
      humidity: null,
      windSpeed: null,
      windDirection: null,
      condition: null,
      pressure: null,
    },
    forecast: [],
    warnings: [],
  };

  // Try the OGC API for city page weather
  try {
    const bbox = `${geo.lon - 0.1},${geo.lat - 0.1},${geo.lon + 0.1},${geo.lat + 0.1}`;
    const url = `${MSC_BASE}/collections/citypageweather-realtime/items?bbox=${bbox}&limit=1&f=json`;
    const data = await fetchWithTimeout(url, 8000);

    if (data?.features?.[0]?.properties) {
      const props = data.features[0].properties;
      result.current.temperature = props.air_temp ?? props.temp ?? null;
      result.current.humidity = props.rel_hum ?? null;
      result.current.windSpeed = props.avg_wnd_spd_10m_agt ?? null;
      result.current.windDirection = props.avg_wnd_dir_10m_agt ? `${props.avg_wnd_dir_10m_agt}°` : null;
      result.current.condition = props.condition ?? props.icon_code ?? null;
      result.current.pressure = props.stn_pres ?? null;
    }
  } catch {
    // City page weather not available
  }

  // Try hourly observations as fallback
  if (result.current.temperature === null) {
    try {
      const bbox = `${geo.lon - 0.5},${geo.lat - 0.5},${geo.lon + 0.5},${geo.lat + 0.5}`;
      const url = `${MSC_BASE}/collections/swob-realtime/items?bbox=${bbox}&limit=1&f=json`;
      const data = await fetchWithTimeout(url, 5000);
      if (data?.features?.[0]?.properties) {
        const props = data.features[0].properties;
        result.current.temperature = props.air_temp ?? null;
        result.current.humidity = props.rel_hum ?? null;
        result.current.windSpeed = props.avg_wnd_spd_10m_agt ?? null;
      }
    } catch {
      // SWOB data not available
    }
  }

  return result;
}

/**
 * Format Canadian weather as markdown.
 */
export function formatCAWeatherResults(result: CAWeatherResult): string {
  const c = result.current;
  const lines: string[] = [
    `## ${result.city}, ${result.province} — Weather (MSC)`,
    "",
    `### Current Conditions`,
    `| Metric | Value |`,
    `| --- | --- |`,
  ];

  if (c.condition) lines.push(`| Conditions | ${c.condition} |`);
  if (c.temperature !== null) lines.push(`| Temperature | ${c.temperature}°C |`);
  if (c.humidity !== null) lines.push(`| Humidity | ${c.humidity}% |`);
  if (c.windSpeed !== null) lines.push(`| Wind Speed | ${c.windSpeed} km/h |`);
  if (c.windDirection) lines.push(`| Wind Direction | ${c.windDirection} |`);
  if (c.pressure !== null) lines.push(`| Pressure | ${c.pressure} kPa |`);

  if (c.temperature === null) {
    lines.push("| — | No current observations available | ");
  }

  if (result.warnings.length > 0) {
    lines.push("");
    lines.push("### Active Warnings");
    for (const w of result.warnings) {
      lines.push(`- ${w}`);
    }
  }

  if (result.forecast.length > 0) {
    lines.push("");
    lines.push("### Forecast");
    lines.push("| Period | Temperature | Conditions |");
    lines.push("| --- | --- | --- |");
    for (const f of result.forecast) {
      lines.push(`| ${f.period} | ${f.temperature !== null ? f.temperature + "°C" : "—"} | ${f.condition || "—"} |`);
    }
  }

  lines.push("");
  lines.push("*Source: Meteorological Service of Canada (MSC GeoMet)*");
  return lines.join("\n");
}
