/**
 * Employment Adapter — Routes to US BLS, UK ONS, or StatCan LFS
 */

import { resolveCity } from "../../geo/resolver.js";
import { resolveBlsCity, queryBls, formatBlsResults } from "../us/bls.js";
import { queryUKEconomics, formatUKEconomicsResults } from "../uk/ons-economics.js";
import { queryStatCanEmployment, formatStatCanEmploymentResults } from "../ca/statcan-employment.js";
import type { Country } from "../../types.js";

export async function queryEmployment(city: string, country?: Country) {
  const geo = await resolveCity(city, country);
  switch (geo.country) {
    case 'US': {
      const match = resolveBlsCity(city);
      if (!match) throw new Error(`City "${city}" not found in BLS data.`);
      const r = await queryBls(match.key);
      return { country: 'US' as const, formatted: formatBlsResults(r), raw: r };
    }
    case 'UK': {
      // UK employment data comes from ONS economics (includes unemployment)
      const r = await queryUKEconomics(geo);
      return { country: 'UK' as const, formatted: formatUKEconomicsResults(r), raw: r };
    }
    case 'CA': {
      const r = await queryStatCanEmployment(geo);
      return { country: 'CA' as const, formatted: formatStatCanEmploymentResults(r), raw: r };
    }
  }
}
