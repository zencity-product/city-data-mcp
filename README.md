# city-data-mcp

An MCP server that gives Claude deep access to US public data — demographics, economics, crime, employment, weather, housing, transit, schools, budgets, and more across 30+ cities. Built for government intelligence workflows.

## What it does

22 tools that let Claude query, compare, and synthesize real public data from 15+ federal and city-level sources:

### Core Data Tools

| Tool | Source | What it does |
|------|--------|-------------|
| `query_city_data` | Socrata | Crime & 311 service requests (5 cities) |
| `list_available_data` | All | Discover available cities, datasets, and coverage |
| `query_demographics` | US Census ACS | Population, income, poverty, education, housing, commuting (30 cities) |
| `compare_demographics` | US Census ACS | Side-by-side comparison table for 2-6 cities |
| `query_economics` | FRED | Unemployment, housing index, personal income with trends (20 metros) |
| `query_employment` | BLS | Metro unemployment rate, employment, labor force (20 metros) |
| `query_national_crime` | FBI UCR | State-level crime stats with multi-year trends |
| `query_weather` | NWS | Current conditions and forecasts for any US city |
| `query_air_quality` | AirNow/EPA | Real-time air quality index (AQI) and pollutant levels |
| `query_housing` | HUD | Fair market rents, income limits, housing affordability |
| `query_water` | USGS | Water levels, streamflow, and conditions |
| `query_representatives` | Google Civic | Elected officials at all levels for any address |
| `query_311_trends` | Open311/SeeClickFix | Service request trends and patterns |
| `query_transit` | GTFS feeds | Public transit routes, performance, coverage |
| `query_schools` | Dept of Education | School district demographics, performance, funding |
| `query_permits` | City portals | Building permit activity and trends |
| `query_budget` | City portals | Municipal budget and expenditure data |
| `query_traffic` | City portals | Traffic safety and congestion data |

### Intelligence Tools

| Tool | What it does |
|------|-------------|
| `create_census_cohort` | Find peer cities by demographic/economic similarity (fast, Census-only) |
| `create_full_cohort` | Rich peer cohort using demographics + economics + employment |
| `create_city_briefing` | Comprehensive city briefing pulling from all available data sources |
| `map_issue_data` | Map a community issue (e.g., "affordable housing") to relevant data across sources |
| `track_city_changes` | Track how a city's metrics have changed over time |

## Quick start

### Claude Desktop (local, stdio)

1. Clone and build:
```bash
git clone https://github.com/zencity-product/city-data-mcp.git
cd city-data-mcp
npm install && npm run build
```

2. Get free API keys:
   - **Census API** (required): https://api.census.gov/data/key_signup.html
   - **FRED API** (required): https://fred.stlouisfed.org/docs/api/api_key.html
   - **BLS API** (optional, higher rate limits): https://www.bls.gov/developers/home.htm

3. Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "city-data-mcp": {
      "command": "node",
      "args": ["/path/to/city-data-mcp/dist/index.js"],
      "env": {
        "CENSUS_API_KEY": "your-census-key",
        "FRED_API_KEY": "your-fred-key"
      }
    }
  }
}
```

4. Restart Claude Desktop.

### Remote (HTTP mode)

Run as an HTTP server for remote access:

```bash
PORT=3000 CENSUS_API_KEY=xxx FRED_API_KEY=xxx node dist/index.js --http
```

MCP endpoint: `http://localhost:3000/mcp`
Health check: `http://localhost:3000/health`

### REST API

When running in HTTP mode, a REST API is also available at `/api/` for non-MCP consumers (dashboards, scripts, other apps):

```
GET /api/cities              → all supported cities
GET /api/census/:city        → demographics
GET /api/economics/:city     → FRED economic indicators
GET /api/employment/:city    → BLS employment data
GET /api/crime/:city         → FBI crime stats
GET /api/weather/:city       → NWS weather
GET /api/air-quality/:city   → EPA air quality
GET /api/housing/:city       → HUD housing data
GET /api/water/:city         → USGS water conditions
GET /api/representatives/:city → elected officials
GET /api/311/:city           → service request trends
GET /api/transit/:city       → public transit
GET /api/schools/:city       → school district data
GET /api/permits/:city       → building permits
GET /api/budget/:city        → municipal budget
GET /api/traffic/:city       → traffic safety
GET /api/briefing/:city      → comprehensive city briefing
GET /api/changes/:city       → metrics change tracking
```

## Example prompts

- "Create a full briefing on Denver"
- "Compare demographics for Denver, Austin, and Portland"
- "What are the economic indicators for Seattle?"
- "Find cities similar to Boston based on housing costs"
- "Who are the elected representatives for 123 Main St, Chicago?"
- "What's the air quality like in Los Angeles right now?"
- "Show me school district data for Houston"
- "Map the issue of 'affordable housing crisis' to data for San Francisco"
- "Track how Phoenix has changed over the last 5 years"
- "What's the transit coverage like in Portland?"
- "Show me building permit trends in Austin"

## Data sources

| Source | Coverage | Freshness | Auth |
|--------|----------|-----------|------|
| [US Census ACS](https://api.census.gov/) | 30 cities (demographics) | Annual (5-year estimates) | Free key |
| [FRED](https://fred.stlouisfed.org/) | 20 metros (economic indicators) | Monthly to annual | Free key |
| [BLS](https://www.bls.gov/developers/) | 20 metros (employment) | Monthly | Optional key |
| [FBI UCR](https://crime-data-explorer.fr.cloud.gov/) | All states (crime stats) | Annual (1-2yr lag) | Reuses Census key |
| [NWS](https://www.weather.gov/documentation/services-web-api) | All US locations (weather) | Real-time | None |
| [AirNow/EPA](https://www.airnow.gov/) | All US locations (air quality) | Real-time | None |
| [HUD](https://www.huduser.gov/portal/dataset/fmr-api.html) | All US areas (housing) | Annual | None |
| [USGS](https://waterservices.usgs.gov/) | All US monitoring stations (water) | Real-time | None |
| [Google Civic](https://developers.google.com/civic-information) | All US addresses (representatives) | Live | None |
| [Open311/SeeClickFix](https://seeclickfix.com/) | Participating cities (311) | Near real-time | None |
| [Socrata](https://dev.socrata.com/) | 5 cities (crime, 311) | Near real-time | None |
| GTFS feeds | Major cities (transit) | Varies | None |
| City open data portals | Varies (permits, budgets, traffic) | Varies | None |

## Covered cities

**Demographics (Census):** NYC, Chicago, San Francisco, Los Angeles, Seattle, Houston, Phoenix, Philadelphia, San Antonio, San Diego, Dallas, Austin, Denver, Boston, Nashville, Portland, Baltimore, Atlanta, Miami, Washington D.C., Minneapolis, Detroit, Pittsburgh, Charlotte, Columbus, Indianapolis, Memphis, Milwaukee, Jacksonville, Raleigh

**Economics (FRED) & Employment (BLS):** NYC, Chicago, San Francisco, Los Angeles, Seattle, Houston, Phoenix, Denver, Boston, Austin, Dallas, Washington D.C., Atlanta, Miami, Portland, Detroit, Minneapolis, Philadelphia, Nashville, Charlotte

**Weather, Air Quality, Housing, Water, Representatives:** All US locations (national APIs)

**311, Transit, Schools, Permits, Budgets, Traffic:** City-specific coverage (varies)

## Architecture

```
src/
├── index.ts              # Server entry (stdio + HTTP + REST transports)
├── cities.ts             # City registry lookup
├── types.ts              # Type definitions
└── sources/
    ├── census.ts         # US Census ACS (demographics)
    ├── fred.ts           # FRED (economic indicators)
    ├── bls.ts            # BLS (employment)
    ├── fbi.ts            # FBI UCR (crime statistics)
    ├── nws.ts            # National Weather Service
    ├── airnow.ts         # EPA AirNow (air quality)
    ├── hud.ts            # HUD (housing)
    ├── usgs.ts           # USGS (water)
    ├── civic.ts          # Google Civic (representatives)
    ├── socrata.ts        # Socrata (city-level crime, 311)
    ├── three11.ts        # Open311/SeeClickFix (service requests)
    ├── transit.ts        # GTFS (public transit)
    ├── schools.ts        # School district data
    ├── permits.ts        # Building permits
    ├── budget.ts         # Municipal budgets
    ├── traffic.ts        # Traffic safety & congestion
    ├── cohort.ts         # Census-based peer city cohort builder
    ├── full-cohort.ts    # Multi-source peer city cohort builder
    ├── briefing.ts       # Comprehensive city briefing generator
    ├── issue-mapper.ts   # Community issue → data mapper
    ├── change-tracker.ts # City metrics change tracking
    └── geo-resolver.ts   # Geographic coordinate resolution
```

## International expansion

Research on extending to UK and Canada data sources is tracked separately. Key findings:
- **UK:** 12/15 US categories have usable equivalents. Strongest: crime (data.police.uk), water (Environment Agency), demographics (ONS/Nomis).
- **Canada:** StatCan WDS covers 6+ categories via one API. MSC GeoMet covers weather + air + water in one API.

## License

MIT
