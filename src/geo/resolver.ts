/**
 * Unified City Geo-Resolver
 *
 * Routes to the appropriate country-specific resolver based on:
 * 1. Explicit country parameter
 * 2. Ambiguous city detection (requires explicit country)
 * 3. Sequential try: US → UK → CA
 */

import type { Country, UnifiedGeoResolution } from "../types.js";
import { resolveUSCity, fetchWithTimeout } from "./us-resolver.js";
import { resolveUKCity } from "./uk-resolver.js";
import { resolveCACity } from "./ca-resolver.js";

export { fetchWithTimeout } from "./us-resolver.js";

// Cities that exist in multiple countries and require disambiguation
const AMBIGUOUS_CITIES: Record<string, Country[]> = {
  "london": ["UK", "CA"],        // London, England vs London, Ontario
  "birmingham": ["UK", "US"],    // Birmingham, England vs Birmingham, AL
  "richmond": ["US", "UK", "CA"],// Richmond VA vs Richmond UK vs Richmond BC
  "hamilton": ["CA", "US", "UK"],// Hamilton ON vs Hamilton OH vs Hamilton UK
  "cambridge": ["UK", "US"],     // Cambridge UK vs Cambridge MA
  "windsor": ["UK", "CA"],       // Windsor UK vs Windsor ON
  "plymouth": ["UK", "US"],      // Plymouth UK vs Plymouth MA
  "kingston": ["CA", "UK"],      // Kingston ON vs Kingston UK
  "victoria": ["CA", "UK"],      // Victoria BC vs Victoria, London
  "newcastle": ["UK", "US"],     // Newcastle UK vs Newcastle, various US
  "aberdeen": ["UK", "US"],      // Aberdeen UK vs Aberdeen SD
  "bath": ["UK", "US"],          // Bath UK vs Bath ME
  "canterbury": ["UK", "US"],    // Canterbury UK vs Canterbury CT
  "exeter": ["UK", "US"],        // Exeter UK vs Exeter NH
  "norwich": ["UK", "US"],       // Norwich UK vs Norwich CT
  "york": ["UK", "US"],          // York UK vs York PA
  "bolton": ["UK", "US"],        // Bolton UK vs Bolton various US
  "surrey": ["UK", "CA"],        // Surrey UK vs Surrey BC
  "barrie": ["CA", "UK"],        // Barrie ON vs Barrie UK
  "fredericton": ["CA"],         // Not ambiguous, but for completeness
};

/**
 * Resolve any city to its geographic identifiers.
 *
 * @param input - City name or postcode/postal code
 * @param country - Optional country code to force resolution
 * @returns UnifiedGeoResolution with country-specific fields
 */
export async function resolveCity(input: string, country?: Country): Promise<UnifiedGeoResolution> {
  const normalized = input.toLowerCase().trim();

  // If country is specified, go directly to that resolver
  if (country) {
    switch (country) {
      case 'US': return resolveUSCity(input);
      case 'UK': return resolveUKCity(input);
      case 'CA': return resolveCACity(input);
    }
  }

  // Check for ambiguous cities
  const ambiguous = AMBIGUOUS_CITIES[normalized];
  if (ambiguous) {
    throw new Error(
      `"${input}" exists in multiple countries (${ambiguous.join(", ")}). ` +
      `Please specify a country parameter: ${ambiguous.map(c => `country: "${c}"`).join(" or ")}. ` +
      `Or be more specific (e.g., "London, UK" or "London, Ontario").`
    );
  }

  // Check if input contains a country hint
  const countryHint = detectCountryHint(input);
  if (countryHint) {
    // For US state abbreviations (e.g., "Bakersfield, CA"), pass through as-is — the US resolver handles "City, STATE"
    if (countryHint === 'US' && /,\s*[A-Z]{2}\s*$/i.test(input)) {
      return resolveUSCity(input);
    }
    // For explicit country names, strip the country suffix before resolving
    return resolveCity(input.replace(/,\s*(uk|united kingdom|england|scotland|wales|canada|us|usa|united states)$/i, "").trim(), countryHint);
  }

  // Try US first (most common use case), then UK, then CA
  try {
    return await resolveUSCity(input);
  } catch {
    // US failed, try UK
  }

  try {
    return await resolveUKCity(input);
  } catch {
    // UK failed, try CA
  }

  try {
    return await resolveCACity(input);
  } catch {
    // All failed
  }

  throw new Error(
    `Could not resolve "${input}" to a location in any supported country (US, UK, CA). ` +
    `Try a more specific name or add a country parameter.`
  );
}

// Valid US state/territory abbreviations — used to distinguish "CA" (California) from "CA" (Canada)
const US_STATE_ABBREVS = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN",
  "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT",
  "VT","VA","WA","WV","WI","WY","AS","GU","MP","PR","VI",
]);

function detectCountryHint(input: string): Country | null {
  const lower = input.toLowerCase();

  // Check US state abbreviations FIRST — "City, CA" is California, not Canada
  const stateMatch = input.match(/,\s*([A-Z]{2})\s*$/);
  if (stateMatch && US_STATE_ABBREVS.has(stateMatch[1].toUpperCase())) {
    return 'US';
  }

  if (/,\s*(uk|united kingdom|england|scotland|wales|northern ireland)\s*$/i.test(lower)) return 'UK';
  if (/,\s*(canada)\s*$/i.test(lower)) return 'CA';
  if (/,\s*(us|usa|united states)\s*$/i.test(lower)) return 'US';
  return null;
}
