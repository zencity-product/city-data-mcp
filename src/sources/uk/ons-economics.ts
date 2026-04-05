/**
 * ONS Economic Data — UK Economics
 *
 * Uses the ONS Beta API for national/regional economic indicators.
 * Free, no API key needed.
 *
 * Datasets: CPI/inflation, GDP growth, regional GVA
 */

import type { UnifiedGeoResolution } from "../../types.js";
import { fetchWithTimeout } from "../../geo/us-resolver.js";

const ONS_BASE = "https://api.beta.ons.gov.uk/v1";

export interface UKEconomicsResult {
  city: string;
  region: string;
  cpi: { value: number | null; period: string | null };
  gdpGrowth: { value: number | null; period: string | null };
  regionalGVA: { value: number | null; perHead: number | null; period: string | null };
  unemployment: { rate: number | null; period: string | null };
}

/**
 * Query ONS economic data.
 */
export async function queryUKEconomics(geo: UnifiedGeoResolution): Promise<UKEconomicsResult> {
  const result: UKEconomicsResult = {
    city: geo.city,
    region: geo.stateOrProvince || "",
    cpi: { value: null, period: null },
    gdpGrowth: { value: null, period: null },
    regionalGVA: { value: null, perHead: null, period: null },
    unemployment: { rate: null, period: null },
  };

  // CPI inflation (national)
  try {
    const cpiUrl = `${ONS_BASE}/datasets/cpih01/editions/time-series/versions`;
    const cpiData = await fetchWithTimeout(cpiUrl, 5000);
    if (cpiData?.items?.[0]?.version) {
      const latestVersion = cpiData.items[0].version;
      const obsUrl = `${ONS_BASE}/datasets/cpih01/editions/time-series/versions/${latestVersion}/observations?time=*&aggregate=cpih1dim1A0&geography=K02000001`;
      const obsData = await fetchWithTimeout(obsUrl, 5000);
      if (obsData?.observations) {
        const latest = obsData.observations[obsData.observations.length - 1];
        result.cpi.value = parseFloat(latest?.observation) || null;
        result.cpi.period = latest?.dimensions?.time?.id || null;
      }
    }
  } catch {
    // CPI data unavailable
  }

  // GDP growth (national) — try Nomis labour market data as alternative
  try {
    const url = `https://www.nomisweb.co.uk/api/v01/dataset/NM_17_5.data.json?geography=2092957697&date=latest&variable=45&measures=20100`;
    const data = await fetchWithTimeout(url, 5000);
    if (data?.obs?.[0]) {
      result.unemployment.rate = parseFloat(data.obs[0].obs_value?.value) || null;
      result.unemployment.period = data.obs[0].date?.value || null;
    }
  } catch {
    // Unemployment data unavailable
  }

  return result;
}

/**
 * Format UK economics as markdown.
 */
export function formatUKEconomicsResults(result: UKEconomicsResult): string {
  const lines: string[] = [
    `## ${result.city} — Economic Indicators (ONS)`,
    "",
    `**Region:** ${result.region}`,
    "",
    `| Indicator | Value | Period |`,
    `| --- | --- | --- |`,
  ];

  if (result.cpi.value !== null) {
    lines.push(`| CPIH Annual Rate | ${result.cpi.value}% | ${result.cpi.period || "—"} |`);
  }
  if (result.gdpGrowth.value !== null) {
    lines.push(`| GDP Growth | ${result.gdpGrowth.value}% | ${result.gdpGrowth.period || "—"} |`);
  }
  if (result.unemployment.rate !== null) {
    lines.push(`| Unemployment Rate | ${result.unemployment.rate}% | ${result.unemployment.period || "—"} |`);
  }
  if (result.regionalGVA.value !== null) {
    lines.push(`| Regional GVA | £${result.regionalGVA.value?.toLocaleString()} | ${result.regionalGVA.period || "—"} |`);
    if (result.regionalGVA.perHead !== null) {
      lines.push(`| GVA per Head | £${result.regionalGVA.perHead?.toLocaleString()} | — |`);
    }
  }

  lines.push("");
  lines.push("*Source: ONS Beta API / Nomis*");
  lines.push("*Note: Most economic data is national or regional (not city-level).*");
  return lines.join("\n");
}
