/**
 * Economics Adapter — Routes to US FRED, UK ONS, or StatCan
 */

import { resolveCity } from "../../geo/resolver.js";
import { resolveFredCity, queryFred, formatFredResults } from "../us/fred.js";
import { queryUKEconomics, formatUKEconomicsResults } from "../uk/ons-economics.js";
import { queryStatCanEconomics, formatStatCanEconomicsResults } from "../ca/statcan-economics.js";
import type { Country } from "../../types.js";

export async function queryEconomics(city: string, country?: Country) {
  const geo = await resolveCity(city, country);
  switch (geo.country) {
    case 'US': {
      const match = resolveFredCity(city);
      if (!match) throw new Error(`City "${city}" not found in FRED data.`);
      const r = await queryFred(match.key);
      return { country: 'US' as const, formatted: formatFredResults(r), raw: r };
    }
    case 'UK': {
      const r = await queryUKEconomics(geo);
      return { country: 'UK' as const, formatted: formatUKEconomicsResults(r), raw: r };
    }
    case 'CA': {
      const r = await queryStatCanEconomics(geo);
      return { country: 'CA' as const, formatted: formatStatCanEconomicsResults(r), raw: r };
    }
  }
}
