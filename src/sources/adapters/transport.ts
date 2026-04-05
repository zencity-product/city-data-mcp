/**
 * Transport Adapter — Routes to US NTD Transit or UK DfT
 * Canada does not have a unified transit API yet.
 */

import { resolveCity } from "../../geo/resolver.js";
import { queryTransit, formatTransitResults } from "../us/transit.js";
import { queryUKTransport, formatUKTransportResults } from "../uk/dft-transport.js";
import type { Country } from "../../types.js";

export async function queryTransport(city: string, country?: Country) {
  const geo = await resolveCity(city, country);
  switch (geo.country) {
    case 'US': {
      const r = await queryTransit(city);
      return { country: 'US' as const, formatted: formatTransitResults(r), raw: r };
    }
    case 'UK': {
      const r = await queryUKTransport(geo);
      return { country: 'UK' as const, formatted: formatUKTransportResults(r), raw: r };
    }
    case 'CA': {
      throw new Error("Transport data is not yet available for Canadian cities. Try US or UK cities.");
    }
  }
}
