/**
 * Representatives Adapter — Routes to US Google Civic, UK TWFY, or Canada Represent
 */

import { resolveCity } from "../../geo/resolver.js";
import { queryCivic, formatCivicResults } from "../us/civic.js";
import { queryUKRepresentatives, formatUKRepresentativesResults } from "../uk/theyworkforyou-reps.js";
import { queryCARepresentatives, formatCARepresentativesResults } from "../ca/represent-reps.js";
import type { Country } from "../../types.js";

export async function queryRepresentatives(city: string, country?: Country) {
  const geo = await resolveCity(city, country);
  switch (geo.country) {
    case 'US': {
      const r = await queryCivic(city);
      return { country: 'US' as const, formatted: formatCivicResults(r), raw: r };
    }
    case 'UK': {
      const r = await queryUKRepresentatives(geo);
      return { country: 'UK' as const, formatted: formatUKRepresentativesResults(r), raw: r };
    }
    case 'CA': {
      const r = await queryCARepresentatives(geo);
      return { country: 'CA' as const, formatted: formatCARepresentativesResults(r), raw: r };
    }
  }
}
