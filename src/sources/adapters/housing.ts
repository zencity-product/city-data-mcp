/**
 * Housing Adapter — Routes to US HUD, UK ONS/Land Registry, or StatCan
 */

import { resolveCity } from "../../geo/resolver.js";
import { queryHud, formatHudResults } from "../us/hud.js";
import { queryUKHousing, formatUKHousingResults } from "../uk/ons-housing.js";
import { queryStatCanHousing, formatStatCanHousingResults } from "../ca/statcan-housing.js";
import type { Country } from "../../types.js";

export async function queryHousing(city: string, country?: Country) {
  const geo = await resolveCity(city, country);
  switch (geo.country) {
    case 'US': {
      const r = await queryHud(city);
      return { country: 'US' as const, formatted: formatHudResults(r), raw: r };
    }
    case 'UK': {
      const r = await queryUKHousing(geo);
      return { country: 'UK' as const, formatted: formatUKHousingResults(r), raw: r };
    }
    case 'CA': {
      const r = await queryStatCanHousing(geo);
      return { country: 'CA' as const, formatted: formatStatCanHousingResults(r), raw: r };
    }
  }
}
