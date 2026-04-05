/**
 * Air Quality Adapter — Routes to US EPA AirNow, UK DEFRA, or MSC AQHI
 */

import { resolveCity } from "../../geo/resolver.js";
import { queryAirQuality as queryUSAirQuality, formatAirQualityResults } from "../us/airnow.js";
import { queryUKAirQuality, formatUKAirQualityResults } from "../uk/defra-air-quality.js";
import { queryCAAirQuality, formatCAAirQualityResults } from "../ca/msc-air-quality.js";
import type { Country } from "../../types.js";

export async function queryAirQuality(city: string, country?: Country) {
  const geo = await resolveCity(city, country);
  switch (geo.country) {
    case 'US': {
      const r = await queryUSAirQuality(city);
      return { country: 'US' as const, formatted: formatAirQualityResults(r), raw: r };
    }
    case 'UK': {
      const r = await queryUKAirQuality(geo);
      return { country: 'UK' as const, formatted: formatUKAirQualityResults(r), raw: r };
    }
    case 'CA': {
      const r = await queryCAAirQuality(geo);
      return { country: 'CA' as const, formatted: formatCAAirQualityResults(r), raw: r };
    }
  }
}
