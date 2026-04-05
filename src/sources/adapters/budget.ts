/**
 * Budget Adapter — Routes to US city budget or UK local authority budget
 * Canada does not have a unified budget API yet.
 */

import { resolveCity } from "../../geo/resolver.js";
import { queryBudget as queryUSBudget, formatBudgetResults } from "../us/budget.js";
import { queryUKBudget, formatUKBudgetResults } from "../uk/gov-budget.js";
import type { Country } from "../../types.js";

export async function queryBudget(city: string, country?: Country) {
  const geo = await resolveCity(city, country);
  switch (geo.country) {
    case 'US': {
      const r = await queryUSBudget(city);
      return { country: 'US' as const, formatted: formatBudgetResults(r), raw: r };
    }
    case 'UK': {
      const r = await queryUKBudget(geo);
      return { country: 'UK' as const, formatted: formatUKBudgetResults(r), raw: r };
    }
    case 'CA': {
      throw new Error("Budget data is not yet available for Canadian cities. Try US or UK cities.");
    }
  }
}
