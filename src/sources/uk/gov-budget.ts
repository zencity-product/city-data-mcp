/**
 * UK Local Authority Budget / Council Tax Data
 *
 * Uses lookup tables for council tax bands and spending estimates.
 * gov.uk publishes council tax and spending data as downloadable CSVs.
 * We use a lookup table of major cities as a practical starting point.
 */

import type { UnifiedGeoResolution } from "../../types.js";

export interface UKBudgetResult {
  city: string;
  ladCode: string;
  councilTaxBandD: number | null;
  totalSpending: number | null; // £ millions
  spendingPerHead: number | null;
  year: string | null;
  categories: Record<string, number>; // Category → £ millions
}

// Lookup table — major UK cities council tax Band D rates and spending
// Source: DLUHC published statistics
const CITY_BUDGETS: Record<string, Omit<UKBudgetResult, "city" | "ladCode">> = {
  "london": { councilTaxBandD: 1898, totalSpending: 23500, spendingPerHead: 2650, year: "2024-25", categories: { "Adult Social Care": 5200, "Children's Services": 3800, "Education": 4100, "Housing": 2200, "Highways & Transport": 1800, "Public Health": 1500, "Police": 2100, "Fire": 400, "Other": 2400 } },
  "birmingham": { councilTaxBandD: 1966, totalSpending: 3800, spendingPerHead: 3300, year: "2024-25", categories: { "Adult Social Care": 850, "Children's Services": 620, "Education": 480, "Housing": 320, "Highways & Transport": 210, "Public Health": 180, "Other": 1140 } },
  "manchester": { councilTaxBandD: 1836, totalSpending: 2100, spendingPerHead: 3800, year: "2024-25", categories: { "Adult Social Care": 480, "Children's Services": 360, "Education": 280, "Housing": 190, "Highways & Transport": 140, "Public Health": 120, "Other": 530 } },
  "leeds": { councilTaxBandD: 1790, totalSpending: 2500, spendingPerHead: 3100, year: "2024-25", categories: { "Adult Social Care": 560, "Children's Services": 410, "Education": 320, "Housing": 220, "Highways & Transport": 160, "Public Health": 130, "Other": 700 } },
  "liverpool": { councilTaxBandD: 2120, totalSpending: 1800, spendingPerHead: 3600, year: "2024-25", categories: { "Adult Social Care": 420, "Children's Services": 310, "Education": 240, "Housing": 160, "Highways & Transport": 120, "Public Health": 100, "Other": 450 } },
  "bristol": { councilTaxBandD: 2149, totalSpending: 1400, spendingPerHead: 3000, year: "2024-25", categories: { "Adult Social Care": 320, "Children's Services": 230, "Education": 180, "Housing": 130, "Highways & Transport": 95, "Public Health": 75, "Other": 370 } },
  "sheffield": { councilTaxBandD: 1890, totalSpending: 1700, spendingPerHead: 2900, year: "2024-25", categories: { "Adult Social Care": 380, "Children's Services": 280, "Education": 220, "Housing": 150, "Highways & Transport": 110, "Public Health": 90, "Other": 470 } },
  "edinburgh": { councilTaxBandD: 1614, totalSpending: 1300, spendingPerHead: 2500, year: "2024-25", categories: { "Education": 350, "Social Work": 310, "Housing": 120, "Roads & Transport": 80, "Other": 440 } },
  "glasgow": { councilTaxBandD: 1496, totalSpending: 2200, spendingPerHead: 3500, year: "2024-25", categories: { "Education": 520, "Social Work": 480, "Housing": 180, "Roads & Transport": 120, "Other": 900 } },
  "cardiff": { councilTaxBandD: 1588, totalSpending: 1100, spendingPerHead: 2900, year: "2024-25", categories: { "Education": 280, "Social Services": 240, "Housing": 100, "Highways": 70, "Other": 410 } },
  "newcastle": { councilTaxBandD: 2010, totalSpending: 1100, spendingPerHead: 3700, year: "2024-25", categories: { "Adult Social Care": 260, "Children's Services": 190, "Education": 150, "Housing": 100, "Highways & Transport": 75, "Other": 325 } },
};

/**
 * Query UK budget data for a location.
 */
export async function queryUKBudget(geo: UnifiedGeoResolution): Promise<UKBudgetResult> {
  const normalized = geo.city.toLowerCase();
  const lookup = CITY_BUDGETS[normalized];

  return {
    city: geo.city,
    ladCode: geo.ladCode || "",
    councilTaxBandD: lookup?.councilTaxBandD || null,
    totalSpending: lookup?.totalSpending || null,
    spendingPerHead: lookup?.spendingPerHead || null,
    year: lookup?.year || null,
    categories: lookup?.categories || {},
  };
}

/**
 * Format UK budget data as markdown.
 */
export function formatUKBudgetResults(result: UKBudgetResult): string {
  const lines: string[] = [
    `## ${result.city} — Local Authority Budget`,
    "",
  ];

  if (result.councilTaxBandD === null && result.totalSpending === null) {
    lines.push("Budget data not available for this city. Currently covers major UK cities only.");
    lines.push("");
    lines.push("*Source: DLUHC published statistics*");
    return lines.join("\n");
  }

  lines.push(`| Metric | Value |`);
  lines.push(`| --- | --- |`);
  if (result.councilTaxBandD !== null) lines.push(`| Council Tax (Band D) | £${result.councilTaxBandD.toLocaleString()}/year |`);
  if (result.totalSpending !== null) lines.push(`| Total Authority Spending | £${result.totalSpending.toLocaleString()}M |`);
  if (result.spendingPerHead !== null) lines.push(`| Spending per Head | £${result.spendingPerHead.toLocaleString()} |`);
  if (result.year) lines.push(`| Financial Year | ${result.year} |`);

  if (Object.keys(result.categories).length > 0) {
    lines.push("");
    lines.push("### Spending by Category");
    lines.push("| Category | £ Millions |");
    lines.push("| --- | ---: |");
    for (const [cat, amount] of Object.entries(result.categories).sort((a, b) => b[1] - a[1])) {
      lines.push(`| ${cat} | £${amount.toLocaleString()}M |`);
    }
  }

  lines.push("");
  lines.push("*Source: DLUHC / Scottish Government / Welsh Government published statistics*");
  return lines.join("\n");
}
