/**
 * Type definitions for city-data-mcp
 *
 * These types describe the shape of data flowing through the server:
 * - CityRegistry: the config file mapping cities to their data sources
 * - QueryResult: what we return to Claude after fetching data
 */

// A single dataset config (e.g., NYC crime data)
export interface DatasetConfig {
  id: string; // Socrata dataset ID (e.g., "5uac-w243")
  name: string; // Human-readable name
  dateField: string; // Column name for dates in this dataset
  descriptionField: string; // Column name for the main description/category
  locationFields: string[]; // Column names for location info
}

// A city's full config
export interface CityConfig {
  name: string; // Full name (e.g., "New York City")
  state: string;
  population: number;
  domain: string; // Socrata domain (e.g., "data.cityofnewyork.us")
  aliases: string[]; // Alternative names for fuzzy matching
  datasets: Record<string, DatasetConfig>; // Available datasets by category
}

// The full registry (loaded from data/city-registry.json)
export type CityRegistry = Record<string, CityConfig>;

// What the Socrata API returns (array of key-value objects)
export type SocrataRow = Record<string, string | number | null>;

// Categories of data we support
export const CATEGORIES = ["crime", "311", "housing", "permits"] as const;
export type Category = (typeof CATEGORIES)[number];

// ── Multi-Country Types ──────────────────────────────────────────────────────

export type Country = 'US' | 'UK' | 'CA';

/**
 * Unified geo resolution that works for US, UK, and Canada.
 * Common fields are always present; country-specific fields are optional.
 */
export interface UnifiedGeoResolution {
  /** Original input */
  input: string;
  /** Normalized city name */
  city: string;
  /** Country code */
  country: Country;
  /** Latitude */
  lat: number;
  /** Longitude */
  lon: number;
  /** Admin area name (county in US, local authority in UK, census division in CA) */
  adminArea: string;
  /** Admin area code */
  adminAreaCode: string;
  /** State, province, or region name */
  stateOrProvince: string;
  /** Whether this came from cache */
  cached: boolean;

  // ── US-specific ──
  /** 2-digit state FIPS */
  stateFips?: string;
  /** 3-digit county FIPS */
  countyFips?: string;
  /** Full 5-digit county FIPS (state + county) */
  fullCountyFips?: string;
  /** State abbreviation (e.g., "CO") */
  stateAbbrev?: string;
  /** ZIP code (5-digit) */
  zip?: string | null;

  // ── UK-specific ──
  /** Local Authority District code (e.g., "E09000001") */
  ladCode?: string;
  /** Region code (e.g., "E12000007" for London) */
  regionCode?: string;
  /** Postcode (e.g., "SW1A 1AA") */
  postcode?: string;
  /** Parliamentary constituency code */
  constituencyCode?: string;

  // ── CA-specific ──
  /** Statistics Canada census division ID */
  censusDivisionId?: string;
  /** Province code (e.g., "ON", "BC") */
  provinceCode?: string;
  /** Postal code (e.g., "M5H 2N2") */
  postalCode?: string;
}

// Formatted result returned to Claude
export interface QueryResult {
  city: string;
  category: string;
  datasetName: string;
  totalResults: number;
  rows: SocrataRow[];
  summary: string;
}
