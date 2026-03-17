/**
 * City Government Budget Data
 *
 * Provides budget breakdowns for major US cities using curated data
 * from published city budgets (FY2024/2025). Includes total budget,
 * per-capita spending, and category-level breakdowns with visual bars.
 *
 * Data sources: Official adopted budgets from city finance departments.
 * Budget figures are approximate and reflect adopted/proposed budgets
 * (not actual expenditures). Includes all funds (general fund + enterprise
 * funds + special funds) unless noted otherwise.
 */

interface CityBudgetData {
  name: string;
  population: number;
  fiscalYear: string;
  totalBudget: number;
  categories: Array<{ name: string; amount: number; percent: number }>;
}

export interface BudgetResult {
  city: string;
  fiscalYear: string;
  totalBudget: number;
  perCapita: number;
  population: number;
  categories: Array<{
    name: string;
    amount: number;
    percent: number;
    perCapita: number;
  }>;
}

// Hardcoded budget summaries from published city budgets (FY2024/2025)
const CITY_BUDGETS: Record<string, CityBudgetData> = {
  "new york": {
    name: "New York City",
    population: 8336817,
    fiscalYear: "FY2025",
    totalBudget: 111800000000,
    categories: [
      { name: "Education", amount: 38000000000, percent: 34.0 },
      { name: "Social Services", amount: 12500000000, percent: 11.2 },
      { name: "Health & Mental Hygiene", amount: 9200000000, percent: 8.2 },
      { name: "Police (NYPD)", amount: 5800000000, percent: 5.2 },
      { name: "Fire (FDNY)", amount: 2500000000, percent: 2.2 },
      { name: "Sanitation", amount: 2400000000, percent: 2.1 },
      { name: "Debt Service", amount: 8200000000, percent: 7.3 },
      { name: "Pensions", amount: 9800000000, percent: 8.8 },
    ],
  },
  "chicago": {
    name: "Chicago",
    population: 2665039,
    fiscalYear: "FY2025",
    totalBudget: 16770000000,
    categories: [
      { name: "Police", amount: 1940000000, percent: 11.6 },
      { name: "Fire", amount: 720000000, percent: 4.3 },
      { name: "Streets & Sanitation", amount: 440000000, percent: 2.6 },
      { name: "Water Management", amount: 380000000, percent: 2.3 },
      { name: "Aviation (O'Hare/Midway)", amount: 2400000000, percent: 14.3 },
      { name: "Transit (CTA)", amount: 1800000000, percent: 10.7 },
      { name: "Debt Service", amount: 1500000000, percent: 8.9 },
    ],
  },
  "los angeles": {
    name: "Los Angeles",
    population: 3898747,
    fiscalYear: "FY2025",
    totalBudget: 13100000000,
    categories: [
      { name: "Police (LAPD)", amount: 3200000000, percent: 24.4 },
      { name: "Fire (LAFD)", amount: 950000000, percent: 7.3 },
      { name: "Public Works", amount: 1100000000, percent: 8.4 },
      { name: "Housing", amount: 600000000, percent: 4.6 },
      { name: "Transportation", amount: 500000000, percent: 3.8 },
      { name: "Sanitation", amount: 400000000, percent: 3.1 },
    ],
  },
  "houston": {
    name: "Houston",
    population: 2304580,
    fiscalYear: "FY2025",
    totalBudget: 6300000000,
    categories: [
      { name: "Police", amount: 1100000000, percent: 17.5 },
      { name: "Fire", amount: 640000000, percent: 10.2 },
      { name: "Public Works", amount: 480000000, percent: 7.6 },
      { name: "Aviation", amount: 950000000, percent: 15.1 },
      { name: "Health", amount: 200000000, percent: 3.2 },
    ],
  },
  "phoenix": {
    name: "Phoenix",
    population: 1608139,
    fiscalYear: "FY2025",
    totalBudget: 5300000000,
    categories: [
      { name: "Police", amount: 840000000, percent: 15.8 },
      { name: "Fire", amount: 430000000, percent: 8.1 },
      { name: "Aviation", amount: 820000000, percent: 15.5 },
      { name: "Water Services", amount: 810000000, percent: 15.3 },
      { name: "Streets & Transportation", amount: 350000000, percent: 6.6 },
      { name: "Parks & Recreation", amount: 200000000, percent: 3.8 },
    ],
  },
  "philadelphia": {
    name: "Philadelphia",
    population: 1603797,
    fiscalYear: "FY2025",
    totalBudget: 6200000000,
    categories: [
      { name: "Police", amount: 810000000, percent: 13.1 },
      { name: "Fire", amount: 340000000, percent: 5.5 },
      { name: "Prisons", amount: 340000000, percent: 5.5 },
      { name: "Streets", amount: 250000000, percent: 4.0 },
      { name: "Health", amount: 280000000, percent: 4.5 },
      { name: "Debt Service", amount: 650000000, percent: 10.5 },
    ],
  },
  "san francisco": {
    name: "San Francisco",
    population: 808437,
    fiscalYear: "FY2025",
    totalBudget: 14600000000,
    categories: [
      { name: "Public Health", amount: 3200000000, percent: 21.9 },
      { name: "Human Services", amount: 1400000000, percent: 9.6 },
      { name: "Police", amount: 750000000, percent: 5.1 },
      { name: "Fire", amount: 500000000, percent: 3.4 },
      { name: "Public Works", amount: 600000000, percent: 4.1 },
      { name: "Transit (SFMTA)", amount: 1500000000, percent: 10.3 },
      { name: "Homelessness", amount: 670000000, percent: 4.6 },
    ],
  },
  "seattle": {
    name: "Seattle",
    population: 749256,
    fiscalYear: "FY2025",
    totalBudget: 7900000000,
    categories: [
      { name: "Utilities (Light, Water, Drainage)", amount: 3200000000, percent: 40.5 },
      { name: "Police", amount: 400000000, percent: 5.1 },
      { name: "Fire", amount: 310000000, percent: 3.9 },
      { name: "Transportation", amount: 550000000, percent: 7.0 },
      { name: "Parks", amount: 280000000, percent: 3.5 },
      { name: "Human Services", amount: 220000000, percent: 2.8 },
    ],
  },
  "denver": {
    name: "Denver",
    population: 713252,
    fiscalYear: "FY2025",
    totalBudget: 4200000000,
    categories: [
      { name: "Safety (Police + Fire + Sheriff)", amount: 780000000, percent: 18.6 },
      { name: "Public Works", amount: 320000000, percent: 7.6 },
      { name: "Aviation (DIA)", amount: 1100000000, percent: 26.2 },
      { name: "Parks & Recreation", amount: 170000000, percent: 4.0 },
      { name: "Human Services", amount: 190000000, percent: 4.5 },
    ],
  },
  "boston": {
    name: "Boston",
    population: 675647,
    fiscalYear: "FY2025",
    totalBudget: 4380000000,
    categories: [
      { name: "Education (BPS)", amount: 1500000000, percent: 34.2 },
      { name: "Police", amount: 410000000, percent: 9.4 },
      { name: "Fire", amount: 290000000, percent: 6.6 },
      { name: "Public Works", amount: 190000000, percent: 4.3 },
      { name: "Debt Service", amount: 200000000, percent: 4.6 },
    ],
  },
  "atlanta": {
    name: "Atlanta",
    population: 499127,
    fiscalYear: "FY2025",
    totalBudget: 2600000000,
    categories: [
      { name: "Police", amount: 260000000, percent: 10.0 },
      { name: "Aviation (Hartsfield-Jackson)", amount: 820000000, percent: 31.5 },
      { name: "Water & Wastewater", amount: 680000000, percent: 26.2 },
      { name: "Fire", amount: 110000000, percent: 4.2 },
      { name: "Parks & Recreation", amount: 60000000, percent: 2.3 },
    ],
  },
  "nashville": {
    name: "Nashville",
    population: 683622,
    fiscalYear: "FY2025",
    totalBudget: 3100000000,
    categories: [
      { name: "Education (MNPS)", amount: 1100000000, percent: 35.5 },
      { name: "Police", amount: 280000000, percent: 9.0 },
      { name: "Fire", amount: 150000000, percent: 4.8 },
      { name: "Public Works", amount: 200000000, percent: 6.5 },
      { name: "Health", amount: 80000000, percent: 2.6 },
    ],
  },
  "miami": {
    name: "Miami",
    population: 442241,
    fiscalYear: "FY2025",
    totalBudget: 1400000000,
    categories: [
      { name: "Police", amount: 290000000, percent: 20.7 },
      { name: "Fire", amount: 180000000, percent: 12.9 },
      { name: "Solid Waste", amount: 80000000, percent: 5.7 },
      { name: "Parks & Recreation", amount: 60000000, percent: 4.3 },
      { name: "Capital Improvements", amount: 200000000, percent: 14.3 },
    ],
  },
  "portland": {
    name: "Portland",
    population: 635067,
    fiscalYear: "FY2025",
    totalBudget: 6700000000,
    categories: [
      { name: "Utilities (Water, Sewer, Stormwater)", amount: 2400000000, percent: 35.8 },
      { name: "Police", amount: 270000000, percent: 4.0 },
      { name: "Fire", amount: 190000000, percent: 2.8 },
      { name: "Transportation (PBOT)", amount: 600000000, percent: 9.0 },
      { name: "Parks", amount: 280000000, percent: 4.2 },
      { name: "Housing", amount: 350000000, percent: 5.2 },
    ],
  },
  "minneapolis": {
    name: "Minneapolis",
    population: 429954,
    fiscalYear: "FY2025",
    totalBudget: 1700000000,
    categories: [
      { name: "Police", amount: 210000000, percent: 12.4 },
      { name: "Fire", amount: 80000000, percent: 4.7 },
      { name: "Public Works", amount: 250000000, percent: 14.7 },
      { name: "Community Planning", amount: 50000000, percent: 2.9 },
      { name: "Parks & Recreation", amount: 100000000, percent: 5.9 },
    ],
  },
  "washington": {
    name: "Washington, D.C.",
    population: 678972,
    fiscalYear: "FY2025",
    totalBudget: 20800000000,
    categories: [
      { name: "Education (DCPS + Charter)", amount: 4500000000, percent: 21.6 },
      { name: "Human Services", amount: 3200000000, percent: 15.4 },
      { name: "Public Safety & Justice", amount: 2100000000, percent: 10.1 },
      { name: "Health Care", amount: 3800000000, percent: 18.3 },
      { name: "Transportation", amount: 700000000, percent: 3.4 },
      { name: "Debt Service", amount: 600000000, percent: 2.9 },
    ],
  },
};

// Aliases for common city name variations
const BUDGET_ALIASES: Record<string, string> = {
  "nyc": "new york",
  "new york city": "new york",
  "manhattan": "new york",
  "sf": "san francisco",
  "san fran": "san francisco",
  "la": "los angeles",
  "l.a.": "los angeles",
  "dc": "washington",
  "d.c.": "washington",
  "washington dc": "washington",
  "washington d.c.": "washington",
  "philly": "philadelphia",
  "atl": "atlanta",
  "pdx": "portland",
  "mpls": "minneapolis",
  "msp": "minneapolis",
  "sea": "seattle",
};

/**
 * Look up a city's key in CITY_BUDGETS, handling aliases and case normalization.
 */
function resolveCity(input: string): string | null {
  const normalized = input.toLowerCase().trim();
  const aliased = BUDGET_ALIASES[normalized] || normalized;
  if (CITY_BUDGETS[aliased]) return aliased;
  return null;
}

/**
 * Query budget data for a city.
 * Returns structured budget result with per-capita calculations.
 */
export function queryBudget(city: string): BudgetResult {
  const key = resolveCity(city);
  if (!key) {
    const available = Object.values(CITY_BUDGETS)
      .map((c) => c.name)
      .sort()
      .join(", ");
    throw new Error(
      `Budget data not available for "${city}". Available cities: ${available}`
    );
  }

  const data = CITY_BUDGETS[key];
  const perCapita = Math.round(data.totalBudget / data.population);

  return {
    city: data.name,
    fiscalYear: data.fiscalYear,
    totalBudget: data.totalBudget,
    perCapita,
    population: data.population,
    categories: data.categories.map((cat) => ({
      name: cat.name,
      amount: cat.amount,
      percent: cat.percent,
      perCapita: Math.round(cat.amount / data.population),
    })),
  };
}

/**
 * List all cities with available budget data.
 */
export function listBudgetCities(): Array<{ key: string; name: string; fiscalYear: string; totalBudget: number }> {
  return Object.entries(CITY_BUDGETS)
    .map(([key, data]) => ({
      key,
      name: data.name,
      fiscalYear: data.fiscalYear,
      totalBudget: data.totalBudget,
    }))
    .sort((a, b) => b.totalBudget - a.totalBudget);
}

/**
 * Format a dollar amount into a human-readable string.
 * Examples: $1.2B, $340M, $5,200
 */
function formatDollars(amount: number): string {
  if (amount >= 1_000_000_000) {
    const billions = amount / 1_000_000_000;
    return `$${billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(0)}M`;
  }
  return `$${amount.toLocaleString()}`;
}

/**
 * Render a visual bar using Unicode block characters.
 * maxPercent controls how wide a 100%-equivalent bar would be.
 */
function renderBar(percent: number, maxWidth: number = 20): string {
  const filled = Math.round((percent / 100) * maxWidth);
  const empty = maxWidth - filled;
  return "\u2588".repeat(filled) + "\u2591".repeat(empty);
}

/**
 * Format budget results into readable text with visual bars.
 */
export function formatBudgetResults(result: BudgetResult): string {
  const lines: string[] = [];

  lines.push(
    `**${result.city}** — Government Budget (${result.fiscalYear})`
  );
  lines.push("");
  lines.push(
    `  Total Budget: ${formatDollars(result.totalBudget)}  |  Per Capita: $${result.perCapita.toLocaleString()}  |  Population: ${result.population.toLocaleString()}`
  );
  lines.push("");
  lines.push("**Spending by Category**");
  lines.push("");

  // Find the longest category name for alignment
  const maxNameLen = Math.max(...result.categories.map((c) => c.name.length));

  for (const cat of result.categories) {
    const paddedName = cat.name.padEnd(maxNameLen);
    const bar = renderBar(cat.percent);
    const pctStr = `${cat.percent.toFixed(1)}%`.padStart(6);
    const amtStr = formatDollars(cat.amount).padStart(7);
    const pcStr = `$${cat.perCapita.toLocaleString()}/person`;

    lines.push(`  ${paddedName}  ${bar} ${pctStr}  ${amtStr}  (${pcStr})`);
  }

  // Sum accounted-for percent
  const accountedPercent = result.categories.reduce(
    (sum, c) => sum + c.percent,
    0
  );
  if (accountedPercent < 95) {
    const otherPercent = 100 - accountedPercent;
    const otherAmount = result.totalBudget - result.categories.reduce((s, c) => s + c.amount, 0);
    const otherPc = Math.round(otherAmount / result.population);
    const paddedOther = "Other / Unclassified".padEnd(maxNameLen);
    const bar = renderBar(otherPercent);
    lines.push(
      `  ${paddedOther}  ${bar} ${otherPercent.toFixed(1).padStart(5)}%  ${formatDollars(otherAmount).padStart(7)}  ($${otherPc.toLocaleString()}/person)`
    );
  }

  lines.push("");
  lines.push(
    "_Data from published city budgets (adopted/proposed). Figures are approximate and include all funds._"
  );

  return lines.join("\n");
}
