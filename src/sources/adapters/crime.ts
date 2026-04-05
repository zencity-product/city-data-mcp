/**
 * Crime Adapter — Routes to US FBI, UK Police, or StatCan UCR
 */

import { resolveCity } from "../../geo/resolver.js";
import { queryFbiCrime, formatFbiResults, resolveFbiCityAsync } from "../us/fbi.js";
import { queryUKCrime, formatUKCrimeResults } from "../uk/police-crime.js";
import { queryStatCanCrime, formatStatCanCrimeResults } from "../ca/statcan-crime.js";
import type { Country } from "../../types.js";

export async function queryCrime(city: string, country?: Country) {
  const geo = await resolveCity(city, country);
  switch (geo.country) {
    case 'US': {
      const match = await resolveFbiCityAsync(city);
      if (!match) throw new Error(`Could not resolve "${city}" for FBI crime data.`);
      const r = await queryFbiCrime(match.config.state, match.key);
      return { country: 'US' as const, formatted: formatFbiResults(r, match.config.name), raw: r };
    }
    case 'UK': {
      const r = await queryUKCrime(geo);
      return { country: 'UK' as const, formatted: formatUKCrimeResults(r), raw: r };
    }
    case 'CA': {
      const r = await queryStatCanCrime(geo);
      return { country: 'CA' as const, formatted: formatStatCanCrimeResults(r), raw: r };
    }
  }
}
