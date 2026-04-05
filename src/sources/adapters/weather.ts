/**
 * Weather Adapter — Routes to US NWS, UK Met Office, or MSC GeoMet
 */

import { resolveCity } from "../../geo/resolver.js";
import { queryWeather as queryUSWeather, formatWeatherResults } from "../us/nws.js";
import { queryUKWeather, formatUKWeatherResults } from "../uk/met-office-weather.js";
import { queryCAWeather, formatCAWeatherResults } from "../ca/msc-weather.js";
import type { Country } from "../../types.js";

export async function queryWeather(city: string, country?: Country) {
  const geo = await resolveCity(city, country);
  switch (geo.country) {
    case 'US': {
      const r = await queryUSWeather(city);
      return { country: 'US' as const, formatted: formatWeatherResults(r), raw: r };
    }
    case 'UK': {
      const r = await queryUKWeather(geo);
      return { country: 'UK' as const, formatted: formatUKWeatherResults(r), raw: r };
    }
    case 'CA': {
      const r = await queryCAWeather(geo);
      return { country: 'CA' as const, formatted: formatCAWeatherResults(r), raw: r };
    }
  }
}
