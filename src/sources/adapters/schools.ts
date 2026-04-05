/**
 * Schools Adapter — Routes to US NCES or UK DfE
 * Canada does not have a unified schools API — returns US or UK only.
 */

import { resolveCity } from "../../geo/resolver.js";
import { querySchools as queryUSSchools, formatSchoolResults } from "../us/schools.js";
import { queryUKSchools, formatUKSchoolResults } from "../uk/dfe-schools.js";
import type { Country } from "../../types.js";

export async function querySchools(city: string, country?: Country) {
  const geo = await resolveCity(city, country);
  switch (geo.country) {
    case 'US': {
      const r = await queryUSSchools(city);
      return { country: 'US' as const, formatted: formatSchoolResults(r), raw: r };
    }
    case 'UK': {
      const r = await queryUKSchools(geo);
      return { country: 'UK' as const, formatted: formatUKSchoolResults(r), raw: r };
    }
    case 'CA': {
      throw new Error("School data is not yet available for Canadian cities. Try US or UK cities.");
    }
  }
}
