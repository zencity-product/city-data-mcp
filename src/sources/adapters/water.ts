/**
 * Water Adapter — Routes to US USGS, UK Environment Agency, or MSC Hydrometric
 */

import { resolveCity } from "../../geo/resolver.js";
import { queryWater as queryUSWater, formatWaterResults } from "../us/usgs.js";
import { queryUKWater, formatUKWaterResults } from "../uk/environment-agency-water.js";
import { queryCAWater, formatCAWaterResults } from "../ca/msc-water.js";
import type { Country } from "../../types.js";

export async function queryWater(city: string, country?: Country) {
  const geo = await resolveCity(city, country);
  switch (geo.country) {
    case 'US': {
      const r = await queryUSWater(city);
      return { country: 'US' as const, formatted: formatWaterResults(r), raw: r };
    }
    case 'UK': {
      const r = await queryUKWater(geo);
      return { country: 'UK' as const, formatted: formatUKWaterResults(r), raw: r };
    }
    case 'CA': {
      const r = await queryCAWater(geo);
      return { country: 'CA' as const, formatted: formatCAWaterResults(r), raw: r };
    }
  }
}
