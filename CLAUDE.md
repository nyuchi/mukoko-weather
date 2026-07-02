# CLAUDE.md — Project Context for Claude Code

## Project Overview

mukoko weather is an AI-powered global weather intelligence platform. It provides real-time weather data, 7-day forecasts, frost alerts, and AI-generated contextual advice for farming, mining, travel, and daily life. The app is fully global — any valid coordinates worldwide are accepted. Current seed data covers 265 total locations (98 Zimbabwe + 167 global) — with new locations added dynamically by the community via geolocation and search from anywhere in the world.

**Live URL:** <https://weather.mukoko.com>

## Company Structure

- **Nyuchi Africa (PVT) Ltd** — parent company
- **Nyuchi Web Services** — technology/development arm (builds the product)
- **Mukoko Africa** — division of Nyuchi Africa
- **mukoko weather** — a Mukoko Africa product

Contact: <support@mukoko.com>, <hi@mukoko.com>, <legal@nyuchi.com>
Social: Twitter @mukokoafrica, Instagram @mukoko.africa

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router, TypeScript 5.9.3)
- **UI components:** shadcn/ui (new-york style, Lucide icons)
- **Charts:** Chart.js 4 + react-chartjs-2 (Canvas 2D rendering via `src/components/ui/chart.tsx`)
- **Maps:** MapLibre GL JS + MapTiler Cloud (vector tiles direct from CDN via `NEXT_PUBLIC_MAPTILER_API_KEY` — no server proxy; GPU-rendered; theme-aware streets-v2 / streets-v2-dark styles); Tomorrow.io raster weather overlays still proxied via `/api/py/map-tiles`
- **Aviation:** NOAA Aviation Weather Center for METAR/TAF data; `@react-pdf/renderer` for pre-flight briefing PDFs; 70+ ICAO airports mapped (`src/lib/icao-codes.ts`, name + verified WGS 84 coords), seeded into the DB-backed `weather.airports` collection (2dsphere-indexed) via `POST /api/db-init` → `syncAirports`. Nearest-station lookup uses MongoDB `$geoNear` through `GET /api/py/airports/nearest`; the TS client `fetchNearestAirports(lat, lon, count)` prefers the DB result and falls back to the static `getNearestIcaos(lat, lon, count)` haversine scan when the DB/API is unavailable, so the location aviation station picker keeps working offline. `getNearestIcao(lat, lon)` remains the primary-station haversine fallback
- **Drag-and-drop:** `@dnd-kit/core` + `@dnd-kit/sortable` for user-reorderable sections on the location page
- **Branding:** Mukoko brand kit doctrine v4.1.0 — 7 minerals (cobalt, tanzanite, malachite, gold, terracotta, sodalite, copper); Noto Serif (display/wordmark), Noto Sans (UI), JetBrains Mono (code/labels)
- **Styling:** Tailwind CSS 4 with CSS custom properties (Brand System v6)
- **Markdown:** react-markdown 10 (AI summary rendering)
- **State:** Zustand 5.0.11 (with `persist` middleware — theme, location, activities, hasOnboarded saved to localStorage; device sync to Python backend)
- **AI:** Anthropic Claude SDK 0.76.0 (server-side via Python FastAPI, Haiku 3.5 model `claude-haiku-4-5-20251001`)
- **Backend API:** Python FastAPI (Vercel serverless functions under `api/py/`; all data, AI, and CRUD operations migrated from TypeScript)
- **Weather data:** Tomorrow.io API (primary, free tier) + Open-Meteo API (fallback)
- **Database:** MongoDB Atlas 7.1.0 (weather cache, AI summaries, historical data, locations; Atlas Search for fuzzy queries, Vector Search infrastructure for semantic search)
- **i18n:** Custom lightweight system (`src/lib/i18n.ts`) — English complete, Shona/Ndebele structurally ready
- **Analytics:** Google Analytics 4 (GA4, measurement ID `G-4KB2ZS573N`) + Vercel Web Analytics (`@vercel/analytics` ^1.6.1)
- **3D Animations:** Three.js (weather-aware particle loading scenes via `src/lib/weather-scenes/`)
- **Testing:** Vitest 4.0.18 (TypeScript, `@vitest/coverage-v8` for coverage) + pytest 8.3 (Python)
- **CI/CD:** GitHub Actions (single `ci` job: lint → typecheck → TypeScript tests → Python tests, all steps visible in one check on push/PR; CodeQL security scanning for JS/TS, Python, and Actions; Claude AI review on PRs; post-deploy DB init). All workflows use `concurrency` groups with `cancel-in-progress: true` to prevent zombie runs from rapid pushes
- **Deployment:** Vercel (with `@vercel/functions` for MongoDB connection pooling)
- **Edge layer (optional):** Cloudflare Workers with Hono (`worker/` directory)

## Key Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run lint          # ESLint
npm test              # Run Vitest tests (single run)
npm run test:watch    # Run Vitest in watch mode
npm run test:coverage # Run Vitest with v8 coverage reporting
npm run test:python   # Run Python backend tests (pytest)
npm run test:all      # Run both TypeScript and Python tests
npx tsc --noEmit      # Type check (no output)
python -m pytest tests/py/ -v  # Run Python backend tests (pytest, direct)
```

## Project Structure

```
mukoko-weather/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout, metadata, JSON-LD schemas
│   │   ├── page.tsx                  # Home — smart redirect (saved location / geolocation / harare)
│   │   ├── HomeRedirect.tsx          # Client: smart redirect with Zustand rehydration guard + geolocation
│   │   ├── HomeRedirect.test.ts      # HomeRedirect tests (structure, rehydration, redirect logic)
│   │   ├── globals.css               # Brand System v6 CSS custom properties
│   │   ├── loading.tsx               # Root loading skeleton
│   │   ├── error.tsx                 # Global error boundary (client component)
│   │   ├── icon.svg                  # SVG favicon
│   │   ├── apple-icon.png            # Apple touch icon
│   │   ├── robots.ts                 # Dynamic robots.txt
│   │   ├── sitemap.ts                # Dynamic XML sitemap (all locations + pages)
│   │   ├── seo.test.ts               # SEO tests
│   │   ├── [location]/               # Dynamic weather pages (265+ locations)
│   │   │   ├── page.tsx              # Thin server wrapper (SEO, data fetch, JSON-LD)
│   │   │   ├── WeatherDashboard.tsx  # Client component — all weather UI with per-section error boundaries
│   │   │   ├── WeatherDashboard.test.ts
│   │   │   ├── loading.tsx           # Branded skeleton matching page layout
│   │   │   ├── error.tsx             # Location-specific error boundary (sessionStorage retry tracking)
│   │   │   ├── not-found.tsx         # 404 for invalid locations
│   │   │   ├── FrostAlertBanner.tsx  # Frost warning/advisory banner
│   │   │   ├── FrostAlertBanner.test.ts
│   │   │   ├── WeatherUnavailableBanner.tsx  # Weather data unavailability alert
│   │   │   ├── atmosphere/              # Atmospheric details sub-route
│   │   │   │   ├── page.tsx             # Server wrapper (SEO, data fetch)
│   │   │   │   ├── AtmosphereDashboard.tsx  # Client: 24h atmospheric charts
│   │   │   │   └── loading.tsx          # Branded skeleton
│   │   │   ├── forecast/               # Forecast details sub-route
│   │   │   │   ├── page.tsx             # Server wrapper (SEO, data fetch)
│   │   │   │   ├── ForecastDashboard.tsx # Client: hourly + daily + sun times
│   │   │   │   └── loading.tsx          # Branded skeleton
│   │   │   └── map/                     # Full-viewport weather map sub-route
│   │   │       ├── page.tsx             # Server wrapper (SEO, no weather fetch)
│   │   │       ├── MapDashboard.tsx     # Client: full-viewport Leaflet map + layer switcher
│   │   │       └── loading.tsx          # Full-viewport skeleton
│   │   ├── explore/                  # Browse-only location/tag/country exploration
│   │   │   ├── page.tsx              # Explore page (ISR 1h, category + country browse)
│   │   │   ├── loading.tsx           # Explore loading skeleton
│   │   │   ├── explore.test.ts       # Explore page tests
│   │   │   ├── [tag]/               # Browse locations by tag
│   │   │   │   ├── page.tsx          # Tag-filtered location list
│   │   │   │   └── loading.tsx
│   │   │   └── country/             # Browse locations by country/province
│   │   │       ├── page.tsx          # Country index page
│   │   │       ├── loading.tsx
│   │   │       ├── error.tsx
│   │   │       ├── [code]/           # Country detail (locations in country)
│   │   │       │   ├── page.tsx
│   │   │       │   ├── loading.tsx
│   │   │       │   ├── error.tsx
│   │   │       │   ├── not-found.tsx
│   │   │       │   └── [province]/   # Province detail (locations in province)
│   │   │       │       ├── page.tsx
│   │   │       │       ├── loading.tsx
│   │   │       │       ├── error.tsx
│   │   │       │       └── not-found.tsx
│   │   ├── shamwari/                 # Shamwari AI chat (full-viewport, Claude app style)
│   │   │   ├── page.tsx              # Server wrapper (metadata)
│   │   │   ├── ShamwariPageClient.tsx # Client: full-viewport chatbot layout
│   │   │   ├── loading.tsx           # ChatSkeleton loading state
│   │   │   └── shamwari.test.ts      # Page structure + layout tests
│   │   ├── status/                   # System health dashboard
│   │   │   ├── page.tsx              # Status page (metadata, layout)
│   │   │   └── StatusDashboard.tsx   # Client: live health checks for all services
│   │   ├── about/page.tsx            # About page
│   │   ├── help/
│   │   │   ├── page.tsx              # Help/FAQ page (server, metadata, JSON-LD)
│   │   │   └── FAQ.tsx               # Client: Accordion-based FAQ section
│   │   ├── history/                  # Historical weather data dashboard
│   │   │   ├── page.tsx              # History page (metadata, layout)
│   │   │   ├── HistoryDashboard.tsx  # Client-side dashboard (search, charts, table)
│   │   │   ├── HistoryDashboard.test.ts
│   │   │   └── error.tsx             # History page error boundary
│   │   ├── privacy/page.tsx          # Privacy policy
│   │   ├── terms/page.tsx            # Terms of service
│   │   ├── embed/page.tsx            # Widget embedding docs
│   │   └── api/                      # Remaining TypeScript API routes (most migrated to Python)
│   │       ├── og/                   # Dynamic OG image generation (Edge runtime, Satori)
│   │       │   ├── route.tsx         # GET — generates 1200×630 OG images with brand templates
│   │       │   └── og-route.test.ts  # OG route tests (templates, rate limiting, metadata wiring)
│   │       └── db-init/
│   │           ├── route.ts          # POST — one-time DB setup (indexes + seed data)
│   │           └── db-init-route.test.ts
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives (Radix UI + CVA)
│   │   │   ├── button.tsx            # Button (6 variants, 5 sizes, asChild support)
│   │   │   ├── badge.tsx             # Badge (4 variants)
│   │   │   ├── card.tsx              # Card, CardHeader, CardContent, etc.
│   │   │   ├── chart.tsx             # CanvasChart, resolveColor (wraps Chart.js Canvas)
│   │   │   ├── dialog.tsx            # Dialog (Radix, portal, overlay, animations)
│   │   │   ├── input.tsx             # Input (styled with CSS custom properties)
│   │   │   ├── skeleton.tsx         # Skeleton, CardSkeleton, ChartSkeleton, BadgeSkeleton, MetricCardSkeleton, ChatSkeleton
│   │   │   ├── alert.tsx             # Alert, AlertTitle, AlertDescription (6 severity variants)
│   │   │   ├── accordion.tsx        # Accordion (Radix, animated open/close)
│   │   │   ├── section-header.tsx   # SectionHeader (title + optional action link/button)
│   │   │   ├── info-row.tsx         # InfoRow (label + value pair for data lists)
│   │   │   ├── toggle-group.tsx     # ToggleGroup (Radix, single/multiple, 3 variants incl. unstyled)
│   │   │   ├── scroll-area.tsx      # ScrollArea (Radix, custom scrollbar, horizontal/vertical)
│   │   │   ├── status-indicator.tsx # StatusDot + StatusBadge (severity-colored status indicators)
│   │   │   ├── cta-card.tsx         # CTACard (call-to-action card with title, description, action)
│   │   │   ├── chart-fallbacks.test.ts # CSS fallback table key parity tests
│   │   │   ├── primitives.test.ts   # Tests for UI primitive variants and exports
│   │   │   └── tabs.tsx              # Tabs (Radix, border-bottom active indicator)
│   │   ├── brand/                    # Branding components
│   │   │   ├── MukokoLogo.tsx        # Logo with text fallback
│   │   │   ├── MineralsStripe.tsx    # 5-mineral decorative stripe
│   │   │   ├── ThemeProvider.tsx     # Syncs Zustand theme to document, listens for OS changes
│   │   │   └── ThemeToggle.tsx       # Light/dark/system mode toggle (3-state cycle)
│   │   ├── analytics/
│   │   │   └── GoogleAnalytics.tsx   # Google Analytics 4 (gtag.js) via next/script
│   │   ├── explore/                  # Shamwari chatbot + AI explore search
│   │   │   ├── ExploreChatbot.tsx    # AI chatbot UI (message bubbles, typing indicator, contextual suggested prompts)
│   │   │   ├── ExploreChatbot.test.ts
│   │   │   ├── ExploreSearch.tsx     # AI-powered natural-language location search
│   │   │   └── ExploreSearch.test.ts
│   │   ├── layout/
│   │   │   ├── Header.tsx            # Sticky header + 5-item mobile bottom nav (Weather/Explore/Shamwari/History/My Weather)
│   │   │   ├── HeaderSkeleton.tsx    # Header loading skeleton
│   │   │   └── Footer.tsx            # Footer with site stats, copyright, links, Ubuntu philosophy
│   │   ├── weather/
│   │   │   ├── CurrentConditions.tsx  # Large temp display, feels-like, daily high/low
│   │   │   ├── HourlyForecast.tsx     # 24-hour hourly forecast
│   │   │   ├── HourlyChart.tsx        # Canvas chart: temperature + rain over 24h
│   │   │   ├── DailyForecast.tsx      # 7-day forecast cards
│   │   │   ├── DailyChart.tsx         # Canvas chart: high/low temps over 7 days
│   │   │   ├── AtmosphericSummary.tsx  # Compact metric cards with gauges (humidity, wind, pressure, UV, cloud, feels-like, precipitation)
│   │   │   ├── AtmosphericDetails.tsx # Imports chart components for 24h atmospheric views
│   │   │   ├── LazyAtmosphericDetails.tsx # Lazy-load wrapper (React.lazy + Suspense)
│   │   │   ├── MetricCard.tsx           # MetricCard + ArcGauge (radial gauge with value display)
│   │   │   ├── ActivityCard.tsx        # ActivityCard (suitability card for a single activity)
│   │   │   ├── StatCard.tsx            # Reusable stat card (label + value)
│   │   │   ├── SectionSkeleton.tsx    # Generic section loading skeleton
│   │   │   ├── LazySection.tsx        # TikTok-style sequential lazy-load with bidirectional visibility
│   │   │   ├── LazySection.test.ts
│   │   │   ├── ChartErrorBoundary.tsx # Error boundary for chart/section crash isolation
│   │   │   ├── ChartErrorBoundary.test.ts
│   │   │   ├── CurrentConditions.test.ts
│   │   │   ├── charts/                # Reusable chart components (import TimeSeriesChart)
│   │   │   │   ├── TimeSeriesChart.tsx     # Base reusable Canvas chart (configurable series, axes, tooltips)
│   │   │   │   ├── TemperatureTrendChart.tsx  # High/low + feels-like temperature
│   │   │   │   ├── PrecipitationChart.tsx  # Rain bars + probability line (dual axis)
│   │   │   │   ├── UVCloudChart.tsx        # UV bars + cloud line (dual axis)
│   │   │   │   ├── WindSpeedChart.tsx      # Wind area + gusts dashed line
│   │   │   │   ├── PressureChart.tsx       # Barometric pressure (auto-scaled)
│   │   │   │   ├── HumidityCloudChart.tsx  # Humidity area + cloud dashed line
│   │   │   │   ├── HumidityChart.tsx       # Standalone humidity area
│   │   │   │   ├── UVIndexChart.tsx        # UV index bars
│   │   │   │   ├── DaylightChart.tsx       # Daylight hours area
│   │   │   │   ├── DewPointChart.tsx       # Dew point temperature
│   │   │   │   ├── GDDChart.tsx            # Growing degree days (farming)
│   │   │   │   ├── HeatStressChart.tsx     # Heat stress index
│   │   │   │   ├── ThunderstormChart.tsx   # Thunderstorm probability
│   │   │   │   └── VisibilityChart.tsx     # Visibility distance
│   │   │   ├── WelcomeBanner.tsx      # Inline welcome banner for first-time visitors (replaces auto-modal)
│   │   │   ├── WelcomeBanner.test.ts
│   │   │   ├── MyWeatherModal.tsx     # Centralized preferences modal (location, activities, settings)
│   │   │   ├── SavedLocationsModal.tsx # Saved locations manager (browse, add, remove, geolocation)
│   │   │   ├── SavedLocationsModal.test.ts
│   │   │   ├── SupportBanner.tsx           # Buy Me a Coffee inline support card (BMC brand yellow)
│   │   │   ├── SupportBanner.test.ts       # SupportBanner tests (structure, accessibility, isolation)
│   │   │   ├── WeatherLoadingScene.tsx # Branded Three.js weather loading animation (weather-aware scenes, respects prefers-reduced-motion)
│   │   │   ├── WeatherLoadingScene.test.ts # KNOWN_ROUTES guard, reduced-motion, Three.js integration, accessibility
│   │   │   ├── charts.test.ts         # Tests for chart data preparation
│   │   │   ├── ActivityInsights.test.ts  # Severity helpers, moon phases, precip types
│   │   │   ├── ActivityCard.test.ts     # Suitability integration (levels, priority, fallbacks)
│   │   │   ├── AtmosphericSummary.test.ts # Gauge functions (UV, humidity, cloud, wind, pressure, feels-like, precipitation)
│   │   │   ├── MetricCard.test.ts       # ArcGauge math, SVG geometry, ARIA contract
│   │   │   ├── DailyForecast.test.ts     # Temperature percent, gradient helpers
│   │   │   ├── SunTimes.tsx           # Sunrise/sunset display
│   │   │   ├── SeasonBadge.tsx        # Zimbabwe season indicator
│   │   │   ├── LocationSelector.tsx   # Search/filter dropdown, geolocation
│   │   │   ├── AISummary.tsx          # Shamwari AI markdown summary (onSummaryLoaded callback)
│   │   │   ├── AISummaryChat.tsx     # Inline follow-up chat (max 5 messages, then → Shamwari)
│   │   │   ├── AISummaryChat.test.ts
│   │   │   ├── HistoryAnalysis.tsx   # AI-powered historical weather analysis (button-triggered)
│   │   │   ├── HistoryAnalysis.test.ts
│   │   │   ├── ActivityInsights.tsx   # Category-specific weather insight cards
│   │   │   ├── reports/               # Waze-style community weather reporting
│   │   │   │   ├── WeatherReportModal.tsx   # 3-step wizard: select type → AI clarify → confirm
│   │   │   │   ├── WeatherReportModal.test.ts
│   │   │   │   ├── RecentReports.tsx        # Recent community reports with upvoting
│   │   │   │   └── RecentReports.test.ts
│   │   │   └── map/                   # Interactive weather map (Leaflet + Tomorrow.io tiles)
│   │   │       ├── MapPreview.tsx         # Compact map card on location page (links to /[location]/map)
│   │   │       ├── MapLayerSwitcher.tsx   # Layer toggle buttons (radiogroup)
│   │   │       ├── MapSkeleton.tsx        # Map loading skeleton
│   │   │       ├── LeafletMapPreview.tsx  # Leaflet preview (dynamic, ssr:false)
│   │   │       ├── LeafletMapFull.tsx     # Leaflet full interactive map (dynamic, ssr:false)
│   │   │       ├── leaflet-css.ts         # Leaflet CSS import
│   │   │       └── leaflet-icon-fix.ts    # Marker icon URL fix for bundlers
│   │   └── embed/
│   │       ├── MukokoWeatherEmbed.tsx          # Embeddable widget (current / today / 5day / 7day; IP-based default via /api/embed/current)
│   │       ├── MukokoWeatherEmbed.module.css   # Self-contained widget CSS (no Tailwind)
│   │       ├── MukokoWeatherEmbed.test.ts
│   │       └── index.ts
│   ├── lib/
│   │   ├── store.ts               # Zustand app state (theme, location, activities, hasOnboarded, ShamwariContext, reportModal, device sync)
│   │   ├── store.test.ts          # Theme resolution, ShamwariContext TTL tests, device sync init
│   │   ├── device-sync.ts         # Device sync — bridges Zustand localStorage with Python device profile API
│   │   ├── device-sync.test.ts
│   │   ├── suggested-prompts.ts   # Database-driven suggested prompt generation (fetches from /api/py/ai/prompts)
│   │   ├── suggested-prompts.test.ts
│   │   ├── locations.ts           # WeatherLocation type, 98 ZW seed locations, search, filtering
│   │   ├── locations.test.ts
│   │   ├── locations-global.ts    # Global city seed data (capitals + major cities across 54 AU member states + ASEAN countries)
│   │   ├── countries.ts           # Country/province types, seed data (54 AU + ASEAN), flag emoji, province slug generation
│   │   ├── countries.test.ts
│   │   ├── activities.ts          # Activity definitions for personalized weather insights
│   │   ├── activities.test.ts
│   │   ├── suitability.ts         # Database-driven suitability evaluation engine (evaluateRule)
│   │   ├── suitability.test.ts
│   │   ├── suitability-cache.ts   # Client-side cache for suitability rules + category styles (10-min TTL)
│   │   ├── suitability-cache.test.ts # Suitability cache tests
│   │   ├── tomorrow.ts            # Tomorrow.io API client + WMO normalization
│   │   ├── tomorrow.test.ts
│   │   ├── weather.ts             # Open-Meteo client, frost detection, weather utils, synthesizeOpenMeteoInsights
│   │   ├── weather.test.ts
│   │   ├── weather-labels.ts      # Contextual label helpers (humidityLabel, pressureLabel, cloudLabel, feelsLikeContext)
│   │   ├── weather-labels.test.ts
│   │   ├── mongo.ts               # MongoDB Atlas connection pooling
│   │   ├── db.ts                  # Database CRUD (weather_cache, ai_summaries, weather_history, rate_limits, activities, suitability_rules, tags, regions, seasons, ai_prompts, ai_suggested_rules, weather_reports, history_analysis). Location lookups delegate to places.ts (Phase 0F).
│   │   ├── places.ts              # Canonical location resolver — reads from places.placesGeo (admin geography) + places.places (POIs). Replaces all reads from the dropped weather.locations.
│   │   ├── db.test.ts
│   │   ├── observability.ts       # Structured error logging + GA4 error reporting
│   │   ├── observability.test.ts
│   │   ├── analytics.ts           # Centralized event tracking (GA4 + Vercel Analytics)
│   │   ├── analytics.test.ts
│   │   ├── feature-flags.ts       # Client-side feature flag system (type-safe, localStorage overrides)
│   │   ├── feature-flags.test.ts
│   │   ├── geolocation.ts         # Browser Geolocation API wrapper (supports auto-creation)
│   │   ├── geolocation.test.ts
│   │   ├── weather-icons.tsx      # SVG weather/UI icons (MapPin, Clock, Search, Sun, Moon, etc.) + ActivityIcon
│   │   ├── weather-icons.test.ts
│   │   ├── i18n.ts                # Lightweight i18n (en complete, sn/nd ready)
│   │   ├── i18n.test.ts
│   │   ├── map-layers.ts          # Map layer config (Tomorrow.io tile layers, mineral color styles)
│   │   ├── map-layers.test.ts
│   │   ├── error-retry.ts         # Error retry logic with sessionStorage tracking (max 3 retries)
│   │   ├── error-retry.test.ts
│   │   ├── use-debounce.ts         # Shared useDebounce hook (generic, reusable across components)
│   │   ├── use-debounce.test.ts
│   │   ├── utils.ts               # Tailwind class merging helper (cn) + getScrollBehavior (reduced-motion-aware scrolling)
│   │   ├── utils.test.ts
│   │   ├── accessibility.test.ts  # Accessibility helpers tests
│   │   ├── seed-suitability-rules.ts # Seed suitability rules for db-init (condition-based evaluation)
│   │   ├── seed-categories.ts     # Seed activity categories with mineral color styles for db-init
│   │   ├── seed-tags.ts           # Seed tag metadata for db-init (powers explore page cards)
│   │   ├── seed-regions.ts        # Region reference data (bounding boxes) for db-init — no restrictions enforced
│   │   ├── seed-seasons.ts        # Seed country-specific season definitions for db-init
│   │   ├── seed-ai-prompts.ts     # Seed AI prompts + suggested prompt rules for db-init
│   │   ├── seed-ai-prompts.test.ts # Prompt/rule uniqueness, guardrails presence
│   │   └── weather-scenes/        # Weather-aware Three.js particle animations for loading screens
│   │       ├── index.ts             # Module exports (createWeatherScene, resolveScene, cache helpers)
│   │       ├── types.ts             # WeatherSceneType, WeatherSceneConfig, CachedWeatherHint, SceneBuilder
│   │       ├── cache.ts             # Client-side weather hint cache (2h TTL per location, localStorage)
│   │       ├── cache.test.ts        # Cache tests (set/get, TTL expiry, cleanup)
│   │       ├── create-scene.ts      # Three.js scene factory — creates renderer, camera, lights, particle systems
│   │       ├── create-scene.test.ts # Scene factory tests (exports, dispose, scene types, fallback, cleanup)
│   │       ├── resolve-scene.ts     # Weather code → scene type mapping (WMO codes to visual conditions)
│   │       ├── resolve-scene.test.ts # Resolution tests (code mapping, day/night, edge cases)
│   │       └── scenes/              # 8 scene builder modules (clear, partly-cloudy, cloudy, rain, thunderstorm, fog, snow, windy)
├── api/
│   └── py/                        # Python FastAPI backend (Vercel serverless functions)
│       ├── index.py               # FastAPI app, router mounting, CORS, error handlers
│       ├── _db.py                 # MongoDB connection, collection accessors, rate limiting
│       ├── _weather.py            # Weather data endpoints (Tomorrow.io/Open-Meteo proxy)
│       ├── _ai.py                 # AI summary endpoint (Claude, tiered TTL cache)
│       ├── _ai_followup.py        # Inline follow-up chat endpoint (pre-seeded history)
│       ├── _ai_prompts.py         # AI prompt library CRUD (GET/PUT prompts + suggested rules)
│       ├── _chat.py               # Shamwari Explorer chatbot (Claude + tool use)
│       ├── _locations.py          # Location CRUD, search, geo lookup
│       ├── _history.py            # Historical weather data endpoint
│       ├── _history_analyze.py    # AI history analysis (server-side aggregation + Claude)
│       ├── _explore_search.py     # AI-powered explore search (Claude + tool use)
│       ├── _reports.py            # Community weather reports (submit, list, upvote, clarify)
│       ├── _suitability.py        # Suitability rules endpoint
│       ├── _data.py               # DB init, seed data, activities, tags, regions
│       ├── _devices.py            # Device sync (preferences across devices)
│       ├── _circuit_breaker.py    # Netflix Hystrix-inspired circuit breaker (per-provider resilience)
│       ├── _embeddings.py         # Vector embedding endpoints
│       ├── _status.py             # System health checks
│       └── _tiles.py              # Map tile proxy for Tomorrow.io
├── worker/                        # Cloudflare Workers edge API (optional)
│   ├── src/
│   │   ├── index.ts               # Hono app, route mounting, CORS
│   │   ├── routes/                # weather, ai, geo, locations, embed
│   │   ├── data/locations.ts      # Static locations data
│   │   └── types.ts
│   ├── wrangler.toml              # KV bindings, env vars, environments
│   ├── tsconfig.json
│   └── package.json               # Hono 4, Anthropic SDK, Wrangler 4
├── public/
│   ├── manifest.json              # PWA manifest (installable, shortcuts)
│   └── icons/                     # PWA icons (192px, 512px)
├── .github/
│   ├── ISSUE_TEMPLATE/            # Bug report and feature request templates
│   └── workflows/
│       ├── ci.yml                 # Single job: lint → typecheck → TypeScript tests → Python tests (concurrency-grouped)
│       ├── claude-code-review.yml # Claude AI code review on PRs (token-guarded, concurrency-grouped)
│       ├── claude.yml             # Claude Code for @claude mentions in issues/PRs
│       ├── codeql.yml             # CodeQL security scanning (JS/TS, Python, Actions; concurrency-grouped)
│       └── db-init.yml            # Post-deploy DB seed data sync (Vercel deployment webhook)
├── tests/
│   └── py/                        # Python backend tests (pytest, 19 files, 587 tests)
│       ├── conftest.py            # Shared fixtures, sys.path/module mocking
│       └── test_*.py              # 19 test files covering all Python endpoints + circuit breaker
├── vercel.json                    # Rewrites /api/py/* to Python serverless functions
├── requirements.txt               # Python dependencies (FastAPI, pymongo, anthropic, httpx, pytest)
├── pytest.ini                     # pytest configuration (testpaths=tests/py, asyncio mode)
├── next.config.ts                 # CORS headers for /api/* and /embed/*
├── tsconfig.json                  # Strict, path alias @/* → ./src/*
├── vitest.config.ts               # Node env, glob src/**/*.test.ts, v8 coverage config
├── eslint.config.mjs              # Next.js core-web-vitals + TypeScript
├── postcss.config.mjs             # Tailwind CSS 4 plugin
├── components.json                # shadcn/ui configuration (new-york style)
├── ARCHITECTURE.md                # Key architectural patterns (search, resilience, lazy loading, DB schema)
├── CONTRIBUTING.md
├── README.md
├── RELEASES.md                    # Release notes for major PRs
├── SECURITY.md
├── TEST_COVERAGE_ANALYSIS.md      # Comprehensive test audit and coverage gap analysis
└── LICENSE
```

## Architecture

> For detailed architectural diagrams (search patterns, resilience flows, database schema), see [ARCHITECTURE.md](ARCHITECTURE.md).

### Layered Component Architecture (MANDATORY)

Every component and section in the app follows a strict layered architecture. This is not optional — all new components MUST implement every layer.

**Layer structure (bottom to top):**

```
Layer 1: Shared base components (TimeSeriesChart, CanvasChart, StatCard)
    ↓ imported by
Layer 2: Domain-specific components (HourlyChart, PressureChart, AISummary, etc.)
    ↓ imported by
Layer 3: Dashboard/page orchestrators (WeatherDashboard, HistoryDashboard, etc.)
    ↓ wrapped with
Layer 4: Isolation wrappers (LazySection + ChartErrorBoundary per section)
    ↓ rendered by
Layer 5: Server page wrappers (page.tsx — SEO, data fetching, error boundaries)
```

**Tiered component requirements:**

Not every component needs every layer. Requirements scale with component weight:

| Tier           | Examples                                |   Error Boundary   | LazySection |        Skeleton        | Accessibility | Global Styles | Tests |
| -------------- | --------------------------------------- | :----------------: | :---------: | :--------------------: | :-----------: | :-----------: | :---: |
| **Primitives** | Button, Badge, Card, Input, Skeleton    |        N/A         |     No      | Loading/disabled state |      Yes      |      Yes      |  Yes  |
| **Composites** | StatCard, FrostAlertBanner, SeasonBadge |  Parent boundary   |     No      |      Loading prop      |      Yes      |      Yes      |  Yes  |
| **Sections**   | Charts, AISummary, HourlyForecast       | ChartErrorBoundary | LazySection |     ChartSkeleton      |      Yes      |      Yes      |  Yes  |
| **Pages**      | WeatherDashboard, HistoryDashboard      |   page error.tsx   |     No      |      loading.tsx       |      Yes      |      Yes      |  Yes  |

**Every component MUST have (at minimum):**

1. **Accessibility** — `aria-labelledby` with heading IDs, `aria-hidden` on decorative elements, `role` on skeletons, 56px minimum touch targets, ARIA landmarks on layout components (`role="banner"`, `role="navigation"`, `role="contentinfo"`), `aria-current="page"` on active nav links
2. **Global styles only** — Tailwind classes backed by CSS custom properties from `globals.css`; NEVER hardcoded hex/rgba/inline styles
3. **Tests** — co-located `.test.ts` files for all logic, data preparation, utilities

**Section-level components MUST additionally have:** 4. **Error boundary** — `ChartErrorBoundary` wrapping each section; a section crash never takes down the page 5. **Lazy loading** — `LazySection` with skeleton fallback; only ONE section mounts at a time (sequential queue) 6. **Skeleton placeholder** — aspect-matched loading placeholder shown before the section enters viewport 7. **Memory management** — bidirectional lazy loading (unmount when far off-screen), Canvas rendering (single DOM element per chart) 8. **API resilience** — external API calls protected by circuit breakers (`api/py/_circuit_breaker.py`) to prevent cascade failures

**Chart component pattern:**

```
TimeSeriesChart (shared Canvas base — series configs, axes, tooltips)
    ↓ imported by
PressureChart / WindSpeedChart / HumidityChart / etc. (each defines its series config)
    ↓ imported by
AtmosphericDetails / HistoryDashboard / etc. (orchestrates layout, passes data)
    ↓ wrapped with
LazySection(fallback=<ChartSkeleton />) + ChartErrorBoundary
```

**Rules:**

- Components import from the layer below, never sideways or upward
- Each chart component is a standalone file in `src/components/weather/charts/`
- Dashboards NEVER hardcode chart rendering logic — import chart components
- All colors and styles come from CSS custom properties in `globals.css`
- New components must follow this pattern — no exceptions

### Python Backend (FastAPI)

All data handling, AI operations, database CRUD, and rule evaluation run in Python FastAPI, deployed as Vercel serverless functions. Next.js serves as the presentation layer only. Routes are proxied via `vercel.json` rewrites (`/api/py/*` → `api/py/index.py`).

**Multi-database architecture (Phase 0B):** Mukoko-weather now consumes six databases on the shared Nyuchi Platform cluster — `weather`, `places`, `identity`, `shamwari`, `device`, `integrations`. See `docs/mongodb-schema-map.md` for the full map.

- DB accessors live in `api/py/_db.py`: `weather_db()`, `places_db()`, `identity_db()`, `shamwari_db()`, `device_db()`, `integrations_db()`. The legacy `get_db()` is aliased to `weather_db()` for backward compat.
- Collection accessors (existing): `weather_cache_collection()`, `ai_summaries_collection()`, `locations_collection()`, etc. — all routed through the appropriate platform DB. `device_profiles_collection()` now lives in the platform `device` DB.
- Platform collection accessors (new, camelCase, schema-validated): `stations_collection()`, `observations_collection()`, `alerts_collection()`, `community_reports_collection()`, `places_collection()`, `places_geo_collection()`, `persons_collection()`, `credentials_collection()`, `activity_log_collection()`, `conversations_collection()`, `messages_collection()`, `guardrails_collection()`, `devices_collection()`, `provider_configurations_collection()`, etc.
- **Auto-stamped writes:** `stamp_platform_fields(doc, country_code="ZW", province_slug=None)` adds the required `_id` (UUID), `_schemaVersion: "v3.1"`, `bundu` sub-doc, `createdAt`, and `updatedAt`. Strict validators (`validationAction: "error"`) reject writes that lack these fields, so call this on every insert into a platform collection.
- TypeScript mirror: `src/lib/mongo.ts` exports `weatherDb()`, `placesDb()`, `identityDb()`, `shamwariDb()`, `deviceDb()`, `integrationsDb()`. `src/lib/db.ts` exports `stampPlatformFields()` plus the matching collection accessors (`stationsCollection`, `placesCollection`, `personsCollection`, etc.).

**CORS:** Restricted to `https://weather.mukoko.com` and `http://localhost:3000` (not wildcard).

**Rate limiting:** MongoDB-backed IP rate limiter (`check_rate_limit` in `_db.py`). Per-endpoint limits:

- `/api/py/chat` — 20 req/hour
- `/api/py/ai/followup` — 30 req/hour
- `/api/py/explore/search` — 15 req/hour
- `/api/py/history/analyze` — 10 req/hour
- `/api/py/locations/add` — 5 req/hour
- `/api/py/reports` (submit) — 5 req/hour
- `/api/py/reports/clarify` — 10 req/hour

**Resilience:** Module-level Anthropic client singletons with key-rotation detection (hash-based invalidation). Graceful degradation — AI endpoints return basic summaries when Anthropic is unavailable. Weather endpoints fall back through Tomorrow.io → Open-Meteo → seasonal estimates.

**Input validation:** All endpoints validate slugs via `SLUG_RE` (`^[a-z0-9-]{1,80}$`), cap message lengths at 2000 chars (returns HTTP 400 on oversized), and limit history/activity arrays. Tags validated against `KNOWN_TAGS` allowlist.

### Circuit Breaker System (Python)

`api/py/_circuit_breaker.py` — Netflix Hystrix-inspired circuit breaker for external API resilience. Python port of the original TypeScript implementation.

**State machine:** CLOSED → OPEN → HALF_OPEN → CLOSED (on success) or OPEN (on failure)

**Per-provider singleton breakers:**

- `tomorrow_breaker` — Tomorrow.io API (3 failures / 2min cooldown / 5min window / 5s timeout)
- `open_meteo_breaker` — Open-Meteo API (5 failures / 5min cooldown / 5min window / 8s timeout)
- `anthropic_breaker` — Anthropic Claude API (3 failures / 5min cooldown / 10min window / 15s timeout)

**Key classes:**

- `CircuitBreaker` — state machine with `execute()` (async), `record_success()`, `record_failure()`, `reset()`, `is_allowed` (property)
- `CircuitOpenError` — raised when circuit is open, includes provider name
- `CircuitBreakerConfig` — per-provider configuration (failure_threshold, cooldown_s, window_s, timeout_s)

**In-memory state:** `dict[str, _CircuitState]` persists across Vercel warm function starts (~5-15 minutes).

**Integration pattern:** All Python endpoints that call external APIs use the circuit breaker:

- `_weather.py` — `tomorrow_breaker` + `open_meteo_breaker` (record-based: `is_allowed` / `record_success()` / `record_failure()`)
- `_chat.py` — `anthropic_breaker` (guard before tool-use loop, falls back to error response)
- `_ai.py` — `anthropic_breaker` (guard before Claude call, falls back to basic weather summary)
- `_ai_followup.py` — `anthropic_breaker` (guard before Claude call, returns error with weather data note)
- `_explore_search.py` — `anthropic_breaker` (guard before AI search, falls back to text search)
- `_history_analyze.py` — `anthropic_breaker` (guard before analysis, returns stats-only response)
- `_reports.py` — `anthropic_breaker` (guard before clarify call, falls back to hardcoded questions)

### Routing

**Philosophy:** The main location page (`/[location]`) is a compact overview — current conditions, AI summary, activity insights, and metric cards. Detail-heavy sections (charts, atmospheric trends, hourly/daily forecasts) live on dedicated sub-route pages. This reduces initial page load weight and prevents mobile OOM crashes from mounting all components simultaneously.

- `/` — smart redirect via `HomeRedirect`: always attempts geolocation first (3s timeout), falls back to first saved location → selected location → `/explore`
- `/[location]` — dynamic weather pages — overview: current conditions, AI summary, activity insights, atmospheric metric cards
- `/[location]/atmosphere` — 24-hour atmospheric detail charts (humidity, wind, pressure, UV) for a location
- `/[location]/forecast` — hourly (24h) + daily (7-day) forecast charts + sunrise/sunset for a location
- `/[location]/map` — full-viewport interactive weather map with layer switcher (precipitation, cloud, temperature, wind)
- `/shamwari` — Shamwari AI chat (full-viewport, Claude app style, input above mobile nav)
- `/explore` — browse locations by category and country (ISR 1h)
- `/explore/[tag]` — browse locations filtered by tag (city, farming, mining, tourism, etc.)
- `/explore/country` — browse locations by country index
- `/explore/country/[code]` — browse locations in a specific country (ISO alpha-2 code)
- `/explore/country/[code]/[province]` — browse locations in a specific province
- `/status` — system health dashboard (live checks: MongoDB, Tomorrow.io, Open-Meteo, Anthropic, cache)
- `/about` — about page (company info, contact details)
- `/privacy` — privacy policy
- `/terms` — terms of service
- `/help` — user help/FAQ
- `/history` — historical weather data dashboard (search, multi-day charts, data table)
- `/embed` — widget embedding docs
- `/api/og` — GET, dynamic OG image generation (Edge runtime, Satori, TypeScript). Query: `title`, `subtitle`, optional `location`, `province`, `season`, `temp`, `condition`, `template` (home/location/explore/history/season/shamwari). In-memory rate-limited (30 req/min/IP), 1-day CDN cache
- `/api/db-init` — POST, one-time DB setup + seed data (TypeScript). Requires `x-init-secret` header in production
- `/api/ai/[...path]` — ANY (Phase 1D), auth-gated proxy for all `/api/py/ai/*` endpoints. Validates the AuthKit session via `withAuth()` (401 if anonymous), then forwards to `/api/py/ai/${path}` with `X-Mukoko-User-Id` + `X-Mukoko-User-Email` headers (cookies stripped). The UI calls `/api/ai/*` exclusively — Python AI routes still exist and can be called directly by internal/server-side consumers, but the browser never touches them.
- `/api/py/weather` — GET, proxies Tomorrow.io/Open-Meteo (MongoDB cached 15-min TTL + historical recording). Also attaches Windy-style ADDITIONAL data from Open-Meteo (free, keyless): `minutely` (next-hour precip nowcast, 4×15-min steps, always attempted) and, via the optional `?models=` comma list (`gfs_seamless,ecmwf_ifs04,icon_seamless,meteofrance_seamless`), a multi-model comparison — `models` (per-model hourly temp/precip series), `models_available`, `models_time`. The extras fetch is circuit-breaker gated (`open_meteo_breaker`) and best-effort — never blocks the base forecast
- `/api/py/ai` — POST, AI weather summaries (MongoDB cached with tiered TTL: 30/60/120 min)
- `/api/py/chat` — POST, Shamwari Explorer chatbot (Claude + tool use: search_locations, get_weather, get_activity_advice, list_locations_by_tag). Rate-limited 20 req/hour/IP
- `/api/py/ai/followup` — POST, inline follow-up chat for AI summaries. Pre-seeded with the AI summary as conversation context. Max 5 exchanges then redirects to Shamwari. Rate-limited 30 req/hour/IP
- `/api/py/ai/prompts` — GET, database-driven AI prompt library. Returns system prompts and suggested prompt rules
- `/api/py/ai/suggested-rules` — GET, dynamic suggested prompt rules for contextual prompts
- `/api/py/search` — GET, location search (text search, tag filter, geospatial nearest, pagination)
- `/api/py/geo` — GET, nearest location lookup (query: `lat`, `lon`, optional `autoCreate=true` for auto-creating community locations)
- `/api/py/locations` — GET, list/filter locations from MongoDB (by slug, tag, or all; includes stats mode)
- `/api/py/locations/add` — POST, add locations via search (`{ query }`) or coordinates (`{ lat, lon }`). Rate-limited to 5 creations/hour/IP
- `/api/py/activities` — GET, activities (by id, category, search query, labels, or categories mode)
- `/api/py/suitability` — GET, suitability rules from MongoDB (all rules or by key; key validated against `^(activity|category):[a-z0-9-]+$`)
- `/api/py/tags` — GET, tag metadata (all or featured only)
- `/api/py/regions` — GET, region reference data (bounding boxes, no restrictions enforced)
- `/api/py/status` — GET, system health checks (MongoDB ping, Tomorrow.io, Open-Meteo, Anthropic, cache)
- `/api/py/history` — GET, historical weather data (query: `location`, `days`)
- `/api/py/history/analyze` — POST, AI-powered historical weather analysis. Server-side aggregation (~800 tokens) + Claude analysis. Cached 1h in `history_analysis` collection. Rate-limited 10 req/hour/IP
- `/api/py/explore/search` — POST, AI-powered location search using Claude with `search_locations` + `get_weather` tools. Falls back to text search if AI unavailable. Rate-limited 15 req/hour/IP
- `/api/py/map-tiles` — GET, tile proxy for Tomorrow.io weather overlay layers (query: `z`, `x`, `y`, `layer`, optional `timestamp`; keeps API key server-side)
- `/api/py/map-tiles/base` — GET, tile proxy for Mapbox base map tiles (query: `z`, `x`, `y`, optional `style` default `streets-v12`; keeps access token server-side). Styles: `streets-v12`, `dark-v11`, `light-v11`, `outdoors-v12`, `satellite-streets-v12`. 1h CDN cache
- `/api/py/reports` — POST (submit) / GET (list), community weather reports. Submit rate-limited 5 req/hour/IP, auto-captures weather snapshot for cross-validation
- `/api/py/reports/upvote` — POST, upvote a community report (IP-based dedup)
- `/api/py/reports/clarify` — POST, AI-generated follow-up questions for weather report clarification. Rate-limited 10 req/hour/IP
- `/api/py/devices` — POST (create) / GET (fetch) / PATCH (update), device profile sync for cross-device preferences
- `/api/py/embeddings/status` — GET, vector search infrastructure status (stub)
- `/api/py/airquality` — GET, EPA-standard Air Quality Index (0-500) + 7-pollutant breakdown (PM2.5, PM10, O3, NO2, SO2, CO, NH3) for `lat`/`lon`. Sourced from Open-Meteo Air Quality (free, no key) via `open_meteo_breaker`. Cached 1 h in `weather.air_quality_cache` with deterministic `_id` (`{lat:.4f}_{lon:.4f}`) so duplicate requests upsert one row, never two
- `/api/py/airports/nearest` — GET, N nearest ICAO airports to `lat`/`lon` (query: `lat`, `lon`, optional `count` default 5 / max 20, optional `maxDistanceKm` default 500) via MongoDB `$geoNear` on the seeded `weather.airports` collection. Each result carries `icao` + `name` + `distanceKm`, sorted closest-first. Returns an empty list on any DB error so the TS client falls back to the static haversine scan
- `/api/py/health` — GET, basic health check (MongoDB + Anthropic availability)

### Error Handling

**Architecture:** Errors are isolated per-section, not per-page. The page shell (header, breadcrumbs, footer) always renders. Individual sections that crash show a compact fallback ("Unable to display X") without affecting other sections.

**Three layers of error isolation:**

1. **Server-side safety net** — `page.tsx` wraps `getWeatherForLocation` in try/catch. Even if the 4-stage fallback chain fails unexpectedly, the page still renders with `createFallbackWeather` seasonal estimates.

2. **Per-section error boundaries** — Every weather section in `WeatherDashboard.tsx` is wrapped in `ChartErrorBoundary`. If any one component crashes (e.g., chart render failure on low-memory mobile), only that section shows the fallback. Other sections keep working.

3. **Page-level error boundaries** (last resort) — Only triggered if the entire page fails to render:
   - `src/app/error.tsx` — global fallback ("Something went wrong")
   - `src/app/[location]/error.tsx` — weather page fallback ("Weather Unavailable")
   - `src/app/history/error.tsx` — history page fallback ("History Unavailable")
   - Retry count is tracked in `sessionStorage` to prevent infinite reload loops (max 3 retries)

4. **Inline degradation** — `WeatherUnavailableBanner` shown when all weather providers fail but the page still renders with seasonal estimates

**Principle:** A component failure should never crash the app. Only the failing section shows an error. The rest of the page remains fully functional.

### Observability

`src/lib/observability.ts` provides structured error logging and client-side error reporting.

**Server-side (structured logging):**

- `logError(ctx)` — JSON-structured error to stdout (parseable by Vercel Log Drains, Datadog, etc.)
- `logWarn(ctx)` — structured warning with same format
- Context fields: `source` (ErrorSource), `severity` (ErrorSeverity), `location`, `message`, `error`, `meta`
- Error sources: `weather-api`, `ai-api`, `history-api`, `mongodb`, `tomorrow-io`, `open-meteo`, `anthropic`, `client-render`, `client-fetch`, `unhandled`
- Severity levels: `low`, `medium`, `high`, `critical`

**Client-side (GA4 error reporting):**

- `reportErrorToAnalytics(description, fatal)` — sends GA4 `exception` events via `gtag()`
- `reportProviderFailure(provider, errorType, location?)` — tracks weather provider failures as GA4 events
- Used in `ChartErrorBoundary` (`componentDidCatch`), all three `error.tsx` pages, and API routes

**Webhook alerting (optional):**

- `sendAlert(ctx)` — sends HTTP POST to `ALERT_WEBHOOK_URL` for high/critical severity errors
- Supports Slack incoming webhooks, Discord webhooks, PagerDuty, and compatible services
- Three-tier alerting: (1) structured JSON logs to stdout, (2) GA4 exception events, (3) webhook alerts for critical/high severity

**Usage across API routes (Python backend):**

- `/api/py/weather` — logs errors on unexpected failures, fallback warnings
- `/api/py/ai` — logs on AI service unavailability
- `/api/py/chat` — logs chatbot errors, tool execution failures
- `/api/py/history` — logs on history fetch failures

### Location Data

**Type:** `WeatherLocation` in `src/lib/locations.ts`. Fields: `slug`, `name`, `province`, `lat`, `lon`, `elevation`, `tags`, optional `country` (ISO 3166-1 alpha-2), optional `source` (`"seed"` | `"community"` | `"geolocation"`), optional `provinceSlug`, optional `nominatimAddress` (`NominatimAddress` — structured address from Nominatim reverse geocoding). Maps to `schema.org/Place` — see Data Standards section below.

**Seed locations:** 265 total seed locations — 98 Zimbabwe locations in `src/lib/locations.ts` (`SEED_LOCATIONS_ZW`) plus 167 global cities in `src/lib/locations-global.ts` (imported as `GLOBAL_LOCATIONS`, merged into `LOCATIONS`). Tags include: `city`, `farming`, `mining`, `tourism`, `education`, `border`, `travel`, `national-park`. **Slug format note:** Global seed locations and all new community locations use `"{city}-{country}"` format (e.g., `"nairobi-ke"`, `"bangkok-th"`). The 98 legacy ZW seed locations use short slugs without the country suffix (e.g., `"harare"`, `"bulawayo"`). A future migration will normalize ZW slugs to `"{city}-zw"` format — until then, both formats coexist and `_generate_slug` in `api/py/_locations.py` appends the suffix for all new locations including ZW.

**Location validation rules (global-first):**

- **All locations**: require `slug`, `name`, `province`, `lat`, `lon`, `elevation`, `tags`, and `country` (ISO 3166-1 alpha-2). New locations use `{city}-{country_lowercase}` slug format (e.g., `nairobi-ke`, `bangkok-th`); legacy ZW seed locations use short slugs (e.g., `harare`). Coordinates validated within global bounds (-90/90 lat, -180/180 lon).
- **Source field:** `"seed"` for curated data, `"community"` for user-submitted, `"geolocation"` for auto-detected.

**Community locations:** Dynamically created via geolocation auto-detection or `/api/locations/add`. Stored in MongoDB alongside seed locations. Reverse-geocoded via Nominatim at zoom=18 (building/POI level) for both GPS auto-creation and explicit coordinate submissions, so GPS resolves to the user's exact place (road, shop, address, suburb) like top weather apps — never snapping to a distant city. `GET /api/py/geo?autoCreate=true` does **no** distance-based nearest-snap; it always reverse-geocodes and creates the fine-grained entry, guarded only by the tight 1km same-name dedup below. The find-only path (`autoCreate=false`, e.g. IP-geo) returns the nearest existing entry.

**Structured address storage:** Community/geolocation locations store a `nominatimAddress` object with formal address fields from Nominatim: `road`, `suburb`, `cityDistrict`, `city`, `state`, `stateDistrict`, `county`, `postcode`, `country`, `countryCode`, `displayName`. This enables three-layer breadcrumbs (Country / Province / Location) and contextual display in cards and info panels. TypeScript type: `NominatimAddress` in `src/lib/locations.ts`.

**Location naming:** `_extract_location_name()` in `api/py/_locations.py` prefers the most specific name: POI name (school, hotel, landmark) → suburb/neighbourhood → road name → city/town/village. This produces names like "Singapore American School", "Strathaven", "525 Canberra Drive" instead of generic city names.

**Province normalization:** `_normalize_admin1()` validates the admin1 field. For city-states (`_CITY_STATES` set: SG, MC, VA, GI, SM, AD, LI, MT, BN, DJ, BH, QA, KW), state/province is meaningless (postal codes), so district-level fields are used instead (e.g., "Woodlands" for Singapore). For normal countries, numeric and ≤2-char values are rejected with a fallback chain through state_district, city_district, region, county.

**Breadcrumbs:** Always three layers — `Home / Country / Province / Location`. Country is always shown (including Zimbabwe). Province is skipped only when identical to location name (e.g., Harare metro). Examples: `Home / Zimbabwe / Mashonaland East / Marondera`, `Home / Singapore / Woodlands / Singapore American School`.

**Global coverage:** The app is fully global — any valid WGS 84 coordinates are accepted. No geographic region restrictions are enforced. Region reference data is retained in `seed-regions.ts` for analytics and map centering but does not block location creation.

**Geocoding:** Handled server-side in Python (`api/py/_locations.py`) — Nominatim for reverse geocoding (coords → name, zoom=14 default for GPS auto-creation, zoom=18 for explicit add), Open-Meteo for forward geocoding (name → candidates), Open-Meteo for elevation lookup. Slug generation creates URL-safe slugs (appends country code for non-ZW locations).

**Rate limiting:** MongoDB-backed IP rate limiter in Python (`api/py/_db.py` `check_rate_limit`). 5 location creations/hour/IP. Uses atomic `findOneAndUpdate` with TTL index.

**Deduplication:** New locations within 1km of an existing location OR with the same name+country are rejected. The tight 1km radius reflects that location names are now specific (POIs, addresses, suburbs) — two different places 2km apart are legitimately different locations.

**Countries & Provinces:** `src/lib/countries.ts` — `Country` type (code, name, region, supported), `Province` type (slug, name, countryCode), 64 seed countries (54 AU + ASEAN), 80+ province definitions, `getFlagEmoji(code)`, `generateProvinceSlug(name, code)`.

Key functions: `getLocationBySlug(slug)`, `searchLocationsFromDb(query, options)` (Atlas Search with fuzzy matching + $text fallback), `getLocationsByTag(tag)`, `findNearestLocation(lat, lon)`, `createLocation(location)`, `findDuplicateLocation(lat, lon, radiusKm)`, `getLocationsForContext(limit)` (bounded DB query for AI context, seed locations prioritized), `vectorSearchLocations(embedding, options)` (foundation for semantic search — requires embedding pipeline), `getTagCountsAndStats()` ($facet aggregation for tag counts + location stats in one query).

### Activities

`src/lib/activities.ts` defines 50+ activities across 6 broadened categories covering industries and lifestyles worldwide. Activities extend the LocationTag system with user-activity categories. **Labels and descriptions use Southern-African (Zimbabwe-first) framing** — e.g. **Braai** (not Barbecue), **Soccer (Football)**, **Cattle Herding**, **Communal Gardening (Nhimbe)**, **Harvest (Kukohwa)**, **Fishing (Kariba)**, **Festivals (Mbira & Cultural)**. **Activity `id`s are stable** (referenced by suitability rules and persisted in Zustand `selectedActivities`); only human `label`/`description` text was localized. New African activities added: `tobacco-farming`, `cotton-farming`, `planting`, `harvest`, `netball`, `potjie`, `market-day`, `church-gathering` — each inherits its `category:<category>` suitability rule.

**Categories (broadened labels, same IDs for backward compat):**

| Category ID | Display Label           | Covers                                                                                                                                                            |
| ----------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `farming`   | Agriculture & Forestry  | Maize/mielie & crops, cattle herding, tobacco, cotton, horticulture, nhimbe gardening, planting, harvest, forestry, beekeeping (mukoko), fish farming, irrigation |
| `mining`    | Industry & Construction | Mining (gold/platinum/chrome), construction, manufacturing, energy, warehousing                                                                                   |
| `travel`    | Transport & Logistics   | Driving, kombi commuting, flying, cross-border trucking, Kariba ferry/marine                                                                                      |
| `tourism`   | Outdoors & Conservation | Safari & game drives, camping, conservation, wildlife research, hiking, Kariba fishing, stargazing                                                                |
| `sports`    | Sports & Fitness        | Soccer, netball, rugby, cricket, athletics, coaching, swimming, cycling, horse riding                                                                             |
| `casual`    | Lifestyle & Events      | Braai, potjie, market day (musika), church gatherings, mbira festivals, weddings (roora), education, drone flying, picnics                                        |

**Key functions:** `getActivitiesByCategory(category)`, `getActivityById(id)`, `getActivityLabels(ids)`, `getRelevantActivities(locationTags, selectedIds)`, `getDefaultActivitiesForLocation(locationTags, limit)`, `searchActivities(query)`

**Location-activity association:** `getDefaultActivitiesForLocation(locationTags)` scores activities by tag overlap with a location's tags. Farming areas surface agriculture activities; national parks surface conservation and safari. Universal activities (empty `relevantTags`) are included at lower priority.

**Styling:** `CATEGORY_STYLES` in `activities.ts` maps each category to mineral color CSS classes (`bg`, `border`, `text`, `badge`). Used by `ActivitySelector`, `ActivityInsights`, and any category-aware UI.

**Icons:** `ActivityIcon` in `weather-icons.tsx` resolves icons using a 3-tier strategy: (1) custom `ICON_REGISTRY` for app-specific SVGs, (2) Lucide React library (1600+ icons) via PascalCase name lookup, (3) default SunIcon fallback. New activities can reference any Lucide icon name (e.g., `"TreePine"`, `"Anchor"`) in the database without code changes.

**UI:** Activity selection is centralized in the **My Weather** modal (`src/components/weather/MyWeatherModal.tsx`), accessible from the header pill icon group. The Activities tab shows mineral-colored activity cards in a 2-column grid with icon, label, and category badge. Selected activities display as bordered cards with a checkmark. Category tabs and search allow filtering. Selections are persisted in Zustand (`selectedActivities`) via localStorage and sent to the AI prompt for context-aware advice.

**Insights:** `src/components/weather/ActivityInsights.tsx` — category-specific weather insight cards (farming GDD, mining safety, sports fitness, travel driving, tourism photography, casual comfort). Each card uses its category's mineral color border and icon accent. Only shown when Tomorrow.io data provides extended fields (GDD, heat stress, thunderstorm probability, etc.). Uses `suitability-cache.ts` for client-side caching of rules and category styles.

### Suitability Rules Engine

`src/lib/suitability.ts` — database-driven suitability evaluation engine.

**Core function:** `evaluateRule(rule, insights)` — evaluates `WeatherInsights` against a `SuitabilityRuleDoc`. Conditions are checked in order (first match wins). Returns a `SuitabilityRating` with level, label, colorClass, bgClass, detail, and optional metric.

**Rating levels:** `excellent`, `good`, `fair`, `poor`

**Rule storage:** Rules are stored in MongoDB `suitability_rules` collection, seeded from `src/lib/seed-suitability-rules.ts` via `/api/db-init`. Rule keys follow the pattern `category:<category>` (applies to all activities in that category) or `activity:<id>` (overrides category rule for a specific activity). Activity-specific overrides: `stargazing` (cloud ceiling), `drone-flying` (wind/visibility), `conservation` (storm/visibility/heat), `shipping` (wind/storm/visibility).

**Condition fields:** `thunderstormProbability`, `heatStressIndex`, `uvHealthConcern`, `visibility`, `windSpeed`, `windGust`, `precipitationType`, `gdd10To30`, `gdd10To31`, `gdd08To30`, `gdd03To25`, `dewPoint`, `evapotranspiration`, `moonPhase`, `cloudBase`, `cloudCeiling`. Field names are validated at sync time via `VALID_CONDITION_FIELDS` in `db.ts` — typos throw an error before reaching the database.

**Operators:** `gt`, `gte`, `lt`, `lte`, `eq`

**Metric templates:** Individual conditions can include a `metricTemplate` string with `{value}` placeholders, resolved at evaluation time with the matched condition value. Fallback rules (last condition in the chain) should NOT include metricTemplates — their `{fieldName}` placeholders may reference insight fields that don't exist, producing undefined values.

**Client-side caching:** `src/lib/suitability-cache.ts` — caches suitability rules and category styles on the client with 10-minute TTL. Exports `fetchSuitabilityRules()`, `fetchCategoryStyles()`, `resetCaches()`. Category styles are seeded from static `CATEGORY_STYLES` for instant mineral color rendering on mount.

**Server-side evaluation:** The explore chatbot route (`/api/py/chat`) runs suitability evaluation server-side in `_execute_get_activity_advice`, returning structured level/label/detail to Claude instead of raw weather data, reducing hallucination surface.

### Seed Data

Database seed data files are read by `/api/db-init` for one-time bootstrap:

- `src/lib/seed-suitability-rules.ts` — ordered condition-based rules per activity/category
- `src/lib/seed-categories.ts` — activity categories with mineral color styles
- `src/lib/seed-tags.ts` — tag metadata (slug, label, description, icon, featured flag)
- `src/lib/seed-regions.ts` — supported geographic regions (bounding boxes + center points)
- `src/lib/seed-seasons.ts` — country-specific season definitions for 50+ countries across Southern Africa, East Africa, West Africa, Central Africa, North Africa, Indian Ocean, and ASEAN. Each country covers all 12 months. Grouped by climate zone using `expand()` helper.

### Weather Data

**Tomorrow.io (primary):** `src/lib/tomorrow.ts` — Tomorrow.io API client, weather code mapping, and response normalization to the existing `WeatherData` interface.

- `fetchWeatherFromTomorrow(lat, lon, apiKey)` — fetches forecast (hourly + daily) and normalizes
- `tomorrowCodeToWmo(code)` — maps Tomorrow.io weather codes to WMO codes
- `normalizeTomorrowResponse(data)` — converts Tomorrow.io response to `WeatherData`
- `TomorrowRateLimitError` — thrown on 429, triggers fallback to Open-Meteo
- Free tier limits: 500 calls/day, 25/hour, 3/second; 5-day forecast

**Open-Meteo (fallback):** `src/lib/weather.ts` — Open-Meteo client and pure utility functions:

- `fetchWeather(lat, lon)` — API call (7-day forecast, no auth required)
- `checkFrostRisk(hourly)` — frost detection (temps <= 3°C between 10pm-8am)
- `weatherCodeToInfo(code)` — WMO code to label/icon
- `getDefaultSeason(date, lat)` — hemisphere-aware default season based on latitude. `getZimbabweSeason` is a backward-compat alias
- `windDirection(degrees)` — compass direction
- `uvLevel(index)` — UV severity level
- `synthesizeOpenMeteoInsights(data)` — constructs a `WeatherInsights` object from Open-Meteo data (wind speed, gusts, visibility) for suitability evaluation

**Weather labels:** `src/lib/weather-labels.ts` — extracted contextual label helpers for weather metrics:

- `humidityLabel(h)` — Dry / Comfortable / Humid / Very humid
- `pressureLabel(p)` — Low / Normal / High
- `cloudLabel(c)` — Clear / Mostly clear / Partly cloudy / Mostly cloudy / Overcast
- `precipitationLabel(p)` — None / Light / Moderate / Heavy
- `feelsLikeContext(apparent, actual)` — Cooler than actual / Warmer than actual / Same as actual

**Provider strategy (priority 0 = StationKit, then forecast chain):** The weather API route (`/api/py/weather`) consults sources in this order:

0. **Nyuchi StationKit** (`api/py/_weather.py` `nearest_station_observation`) — most recent QC-validated `weather.observations` doc within **50 km** and the **last 60 minutes**. If a station is in range, its sensor data replaces the `current` block of the response while hourly/daily are still served from the commercial provider/cache below.
1. **MongoDB cache** (`weather_cache`, 15-min TTL)
2. **Tomorrow.io** (primary commercial provider)
3. **Open-Meteo** (free fallback)
4. **Seasonal estimate** (never fails)

The endpoint sets three response headers so callers can verify which source served what:

- `X-Cache` — `HIT` | `MISS` (cache status for the forecast data)
- `X-Weather-Provider` — origin of the **hourly/daily forecast** (`tomorrow` | `open-meteo` | `fallback`)
- `X-Current-Source` — origin of the **`current` block** (`stationkit` | `tomorrow` | `open-meteo` | `fallback`)

**StationKit integration loop (Phase 0D):**

```
StationKit hardware → device.devices (registry, fleet ops)
        ↓                       ↓
   raw readings           heartbeats / telemetry
        ↓
weather.stationObservations → QC pipeline → weather.observations
                                                    ↓
                                /api/py/weather  →  X-Current-Source: stationkit
```

- **Current station fleet:** 1 active station — `nyuchi-africa-hq-harare` (Harare, Zimbabwe). Sensors: temperature, humidity, pressure, wind speed, wind direction, rainfall, UV index, solar radiation. QC rating "excellent".
- **Reader:** `nearest_station_observation(lat, lon, max_distance_km=50, max_age_minutes=60)` runs a `$nearSphere` geospatial query on `weather.observations.location` (GeoJSON Point, 2dsphere-indexed), filtered to `qcStatus=="validated"` and `observedAt >= now - max_age_minutes`, sorted by `observedAt` desc, limit 1. Wrapped in try/except — returns `None` if the index is missing or any DB error occurs, so the endpoint falls through to the commercial chain unmolested.
- **Field mapping:** `station_observation_to_current(obs)` translates platform-schema metric names (`airTemperatureCelsius`, `relativeHumidityPercent`, `atmosphericPressureMillibar`, `windSpeedKph`, `windDirectionDegrees`, `precipitationMillimeters`, `uvIndex`) to mukoko's existing `current` shape (`temperature_2m`, `relative_humidity_2m`, `surface_pressure`, etc.).
- **No writes from this route** — the endpoint is read-only against `weather.stations` / `weather.observations`. Station observations themselves are produced by the StationKit ingest pipeline, not by mukoko-weather.

### State Management (Zustand)

`src/lib/store.ts` exports `useAppStore` with:

- `theme: "light" | "dark" | "system"` — defaults to `"system"` (follows OS `prefers-color-scheme`), persisted to localStorage, synced to server
- `setTheme(theme)` — explicitly set a theme preference
- `toggleTheme()` — cycles through light → dark → system
- `selectedLocation: string` — current location slug (default: `""`), persisted to localStorage, synced to server
- `setSelectedLocation(slug)` — updates location, queues device sync
- `selectedActivities: string[]` — activity IDs (from `src/lib/activities.ts`), persisted to localStorage, synced to server
- `toggleActivity(id)` — adds/removes an activity selection, queues device sync
- `selectedForecastModel: string` — Windy-style forecast model preference (Open-Meteo model id or `"best_match"`, default `"best_match"`), persisted (RxDB) + device-synced. Set via the "Forecast model" radio group in the My Weather modal Settings tab; passed by `fetchWeather()` and highlighted in `ModelComparisonChart`
- `setSelectedForecastModel(model)` — updates the model preference, persists to RxDB
- `savedLocations: string[]` — saved location slugs (up to `MAX_SAVED_LOCATIONS = 10`), persisted to localStorage, synced to server
- `saveLocation(slug)` — adds a location to saved list (no-op if already saved or at cap), queues device sync
- `removeLocation(slug)` — removes a location from saved list, queues device sync
- `myWeatherOpen: boolean` — controls My Weather modal visibility (not persisted)
- `openMyWeather()` / `closeMyWeather()` — toggle the modal
- `savedLocationsOpen: boolean` — controls Saved Locations modal visibility (not persisted)
- `openSavedLocations()` / `closeSavedLocations()` — toggle the modal
- `hasOnboarded: boolean` — tracks whether user has completed onboarding (persisted to localStorage, synced to server)
- `completeOnboarding()` — sets `hasOnboarded: true`, queues device sync
- `shamwariContext: ShamwariContext | null` — carries weather/location/summary data between pages (not persisted)
- `setShamwariContext(ctx)` / `clearShamwariContext()` — set/clear context
- `reportModalOpen: boolean` — controls Weather Report modal visibility (not persisted)
- `openReportModal()` / `closeReportModal()` — toggle the report modal

**ShamwariContext** (`interface ShamwariContext`):

- `source: "location" | "explore" | "history"` — which page set the context
- Optional fields: `locationSlug`, `locationName`, `province`, `weatherSummary`, `temperature`, `condition`, `season`, `historyDays`, `historyAnalysis`, `exploreQuery`
- `activities: string[]` — user's selected activities
- `timestamp: number` — context expires after 10 minutes (`isShamwariContextValid()`)

**Persistence:**

- Uses Zustand `persist` middleware with `partialize` — `theme`, `selectedLocation`, `savedLocations`, `selectedActivities`, and `hasOnboarded` are saved to localStorage under key `mukoko-weather-prefs`
- `myWeatherOpen`, `savedLocationsOpen`, `shamwariContext`, and `reportModalOpen` are transient (reset on page load)
- `onRehydrateStorage` callback applies the persisted theme to the DOM on load

**Device Sync:**

- `src/lib/device-sync.ts` bridges Zustand localStorage with the Python device profile API (`/api/py/devices`)
- **Hybrid approach:** localStorage is the primary read source (instant), MongoDB is the persistence layer (recoverable)
- Changes are synced to server on mutation (debounced 1.5s via `queueSync`)
- On first visit: generates a device UUID, reads any existing localStorage prefs, creates a server profile
- On returning visit: fetches server profile; if local state looks like defaults but server has real data, restores from server (e.g., user cleared localStorage or new browser)
- `flushSync()` fires via `beforeunload` listener (with duplicate registration guard) to persist pending changes before page unload using `navigator.sendBeacon`
- **Merge strategy:** Last-write-wins (not CRDT). If a user has multiple devices, whichever syncs last determines the server value for array fields like `selectedActivities` and `savedLocations`. A per-field timestamp merge is a future enhancement
- `initializeDeviceSync()` is called once on client-side app load after Zustand rehydrates

**Theme system:**

- `resolveTheme(pref)` — resolves `"system"` to `"light"` or `"dark"` based on `matchMedia('(prefers-color-scheme: dark)')`
- `ThemeProvider` listens for OS theme changes when in `"system"` mode and updates `data-theme` on `<html>` in real time
- Theme can be set via the Settings tab in the My Weather modal (light/dark/system radio group)
- An inline script in `layout.tsx` prevents FOUC by reading the persisted theme from localStorage before first paint, falling back to system preference detection

### Styling / Brand System

CSS custom properties are defined in `src/app/globals.css` (Brand System v6). Colors are WCAG 3.0 APCA/AAA compliant. The theme supports light/dark mode with system preference detection, `prefers-contrast: more`, `prefers-reduced-motion: reduce`, and `forced-colors: active`.

**Mineral Color System:**
Each activity category has a dedicated mineral color, defined as CSS custom properties with light and dark variants:

- **Farming** → Malachite (`--mineral-malachite`)
- **Mining** → Terracotta (`--mineral-terracotta`)
- **Travel** → Cobalt (`--mineral-cobalt`)
- **Tourism** → Tanzanite (`--mineral-tanzanite`)
- **Sports** → Gold (`--mineral-gold`)
- **Casual** → Primary (Cobalt brand color)

Category styles are centralized in `CATEGORY_STYLES` (`src/lib/activities.ts`) with static Tailwind classes for `bg`, `border`, `text`, and `badge` per category. Each mineral color has a corresponding `--mineral-*-fg` foreground token for badge text contrast.

**Severity / Status Color System:**
For weather alerts, status indicators, and severity levels, use the semantic severity tokens defined in `globals.css`:

- `--color-severity-low` → safe/operational/none (green/malachite in light, bright green in dark)
- `--color-severity-moderate` → mild/moderate (gold/warmth in light, amber in dark)
- `--color-severity-high` → high/medium (burnt orange in light, orange in dark)
- `--color-severity-severe` → severe/down (red in light, bright red in dark)
- `--color-severity-extreme` → extreme (deep red in light, vivid red in dark)
- `--color-severity-cold` → frost/cold risk (cobalt blue in light, sky blue in dark)

Use these via Tailwind: `text-severity-low`, `bg-severity-severe/10`, `border-severity-moderate/20`, etc.
Never use generic Tailwind colors (`text-green-600`, `text-red-500`, `bg-amber-500`) — always use severity tokens or brand tokens.

**Third-party Brand Color Tokens:**

- `--color-bmc` → Buy Me a Coffee official brand yellow (`#FFDD00`)
- `--color-bmc-fg` → dark text for BMC yellow backgrounds (`#1A1A1A`)

Use via Tailwind: `bg-bmc`, `border-bmc/40`, `text-bmc-fg`, `ring-bmc`, etc. Used by `SupportBanner` component.

**Typography tokens:**

- `--text-body: 1rem` (16px) — base body/footer text
- `--text-body-lg: 1.125rem` (18px) — larger body text variant
- `--text-body-leading: 1.6` — body text line height
- `--text-nav-label: 0.625rem` (10px) — mobile bottom nav labels (matches iOS/Android native nav conventions)

**Animation system:**

- `.stagger-children` — CSS class for staggered child entrance animations (fade-in-up with 50ms delay per child, up to 8 children)
- `--animate-fade-in`, `--animate-fade-in-up`, `--animate-fade-in-down`, `--animate-scale-in` — entrance animation tokens registered in `@theme` block
- `.card-interactive` — hover shadow + active scale effect for clickable cards
- `.press-scale` — active scale-down effect for tappable buttons
- All entrance animations and stagger delays are wrapped in `@media (prefers-reduced-motion: no-preference)` and a global `@media (prefers-reduced-motion: reduce)` rule disables all animations/transitions for users who prefer reduced motion

**Skeleton Primitives:**
Reusable skeleton components in `src/components/ui/skeleton.tsx`:

- `Skeleton` — generic pulsing block (base building block)
- `CardSkeleton` — card-shaped with title + content lines
- `ChartSkeleton` — aspect-ratio-matched chart placeholder
- `BadgeSkeleton` — pill-shaped badge placeholder
- `MetricCardSkeleton` — matches AtmosphericSummary MetricCard shape
- `ChatSkeleton` — matches ExploreChatbot container shape (used as Suspense fallback)

Aspect-matched section skeletons in `src/components/weather/SectionSkeleton.tsx`:

- `SectionSkeleton` — generic fallback (h-32 pulsing card)
- `ReportsSkeleton`, `HourlyForecastSkeleton`, `ActivityInsightsSkeleton`, `DailyForecastSkeleton`, `AISummarySkeleton`, `AISummaryChatSkeleton`, `AtmosphericSummarySkeleton`, `SunTimesSkeleton`, `MapPreviewSkeleton`, `SupportBannerSkeleton`, `LocationInfoSkeleton` — each mirrors the shape of its corresponding component to prevent layout shift

All skeletons include `role="status"` and `aria-label="Loading"` for screen readers. The `sr-only` span is optional when `aria-label` is present — both achieve the same result for assistive technology, so `aria-label` alone is sufficient.

**Rules:**

- Never use hardcoded hex colors, rgba(), or inline `style={{}}` in components — use Tailwind classes backed by CSS custom properties
- **Exception: `src/app/api/og/route.tsx`** — The OG image route uses `next/og` (Satori) which renders via a canvas, not the browser DOM. CSS custom properties and Tailwind are not supported. All styles in this file MUST use inline `style={{}}` with hex values from the `brand` token object at the top of the file. Keep these values in sync with `globals.css` brand tokens. The OG image renders a mineral accent stripe (tanzanite → cobalt → malachite → gold → terracotta) matching the app's `MineralsStripe` component. Avoid `width: "fit-content"` and other CSS properties not supported by Satori
- **Exception: `src/lib/weather-scenes/scenes/*.ts`** — Three.js WebGL requires raw hex colors (`0xRRGGBB`) for materials, lights, and fog. CSS custom properties don't work in WebGL shaders/materials. Hardcoded hex values in scene builder files are a documented exception to the "no hardcoded styles" rule
- All new color tokens must be added to globals.css (both `:root` and `[data-theme="dark"]`) and registered in the `@theme` block
- Use `CATEGORY_STYLES` from `src/lib/activities.ts` for category-specific styling — do not construct dynamic Tailwind class names
- The embed widget (`src/components/embed/`) uses a CSS module for self-contained styling — never use inline styles there
- Frost alert severity colors use `--color-frost-*` tokens, not hardcoded values
- Status/severity indicators use `--color-severity-*` tokens, not generic Tailwind colors
- All skeletons/loading states must include `role="status"` and screen reader text

### AI Summaries

- Generated by Claude Haiku 3.5 (`claude-haiku-4-5-20251001`) via `POST /api/py/ai`, rendered in `src/components/weather/AISummary.tsx`
- AI persona: "Shamwari Weather" (Ubuntu philosophy, region-aware context)
- Summaries are **markdown-formatted** — the system prompt requests bold, bullet points, and no headings
- Rendered with `react-markdown` inside Tailwind `prose` classes
- Cached in MongoDB with tiered TTL (30/60/120 min by location tier)
- If `ANTHROPIC_API_KEY` is unset, a basic weather summary fallback is generated
- **Inline follow-up chat:** `AISummary` fires `onSummaryLoaded(text)` callback; `WeatherDashboard` passes the summary to `AISummaryChat` which allows up to 5 follow-up messages before redirecting to Shamwari
- **Ask Shamwari link:** AISummary includes a "Ask Shamwari about this" link that sets `ShamwariContext` with the current location/weather/summary before navigating to `/shamwari`

### AI Prompt Library (Database-Driven)

All AI system prompts, suggested prompt rules, and model configurations are stored in MongoDB and served via `GET /api/py/ai/prompts`. This allows updating AI behavior without code changes.

**Collections:**

- `ai_prompts` — system prompts keyed by `promptKey` (e.g., `system:weather_summary`, `system:history_analysis`, `system:explore_search`, `system:report_clarification`, `greeting:location`, `greeting:explore`, `greeting:history`). Each document has: `promptKey`, `template` (with `{variable}` placeholders), `model`, `maxTokens`, `active`, `updatedAt`
- `ai_suggested_rules` — dynamic suggested prompt rules. Each rule has: `ruleKey`, `condition` (weather field + operator + threshold), `prompt` (template with `{location}` placeholders), `category` (weather/activity/general), `priority`, `active`. Condition operators: `gt`, `gte`, `lt`, `lte`, `eq`, `in`. The `in` operator checks if any user-selected activity matches an array of activity IDs (source: `"activities"`) or if a weather value falls within an array (source: `"weather"` or `"hourly"`)

**Seed data:** `src/lib/seed-ai-prompts.ts` — seeded via `/api/db-init`

**Client integration:** `src/lib/suggested-prompts.ts` — `generateSuggestedPrompts(weather, location, activities)` fetches rules from the database (5-min client cache), evaluates weather conditions against rules, and returns up to 3 contextual prompts. Used by `AISummaryChat` and `ExploreChatbot`

**Fallbacks:** All components include hardcoded fallback prompts/greetings for when the database or API is unavailable

### Caching Strategy

**Server-side (MongoDB):**

- Weather cache: 15-min TTL (auto-expires via TTL index)
- AI summaries: tiered TTL — 30 min (major cities), 60 min (mid-tier), 120 min (small locations)
- Weather history: unlimited retention (recorded on every fresh API fetch)
- History analysis: 1h TTL in `history_analysis` collection (keyed by location + days + data hash)
- Weather reports: TTL by severity — 24h (mild), 48h (moderate), 72h (severe) in `weather_reports` collection
- Explore route: in-memory location context (5-min TTL), activities (5-min TTL), in-request weather cache (`Map<string, WeatherResult>` per request), in-request suitability rules cache (`rulesCache` ref per request)
- AI prompts: 5-min in-memory cache in Python endpoints (`_ai_prompts.py`, `_reports.py`, `_history_analyze.py`)

**Client-side:**

- No weather data caching — every page load fetches fresh weather data from the server
- User preferences (theme + selected activities) are persisted to localStorage via Zustand `persist` middleware under key `mukoko-weather-prefs`
- Suitability rules: 10-min TTL cache in `src/lib/suitability-cache.ts` (fetched from `/api/py/suitability`)
- Category styles: 10-min TTL cache in `src/lib/suitability-cache.ts`, seeded from static `CATEGORY_STYLES` for instant render
- Suggested prompt rules: 5-min TTL cache in `src/lib/suggested-prompts.ts` (fetched from `/api/py/ai/prompts`)

### i18n

`src/lib/i18n.ts` provides lightweight translation without a heavy library:

- `t(key, params?, locale)` — translation lookup with `{param}` interpolation
- `formatTemp()`, `formatWindSpeed()`, `formatPercent()`, `formatTime()`, `formatDayName()`, `formatDate()` — Intl API-based formatting
- English (`en`) fully implemented; Shona (`sn`) and Ndebele (`nd`) structurally ready
- Locale for Intl: `en-ZW`, `sn-ZW`, `nd-ZW`

### SEO

- Dynamic `robots.ts` and `sitemap.ts`
- Per-page metadata via `generateMetadata()` in `[location]/page.tsx` — season data deduplicated across metadata + page component via React `cache()`
- **Canonical URLs:** Every page sets its own `alternates.canonical` in metadata. The root layout does NOT set a canonical — doing so would bleed into every child page that doesn't override it, causing Google Search Console duplicate canonical errors. The home page (`/`) canonical points to `/harare` so Google indexes the main location page instead of the client-side redirect
- JSON-LD schemas: WebApplication, Organization, WebSite, FAQPage, BreadcrumbList, WebPage+Place
- Twitter cards (`@mukokoafrica`) and Open Graph tags on all pages
- Dynamic OG images via `/api/og` (Edge runtime, Satori) — 6 templates (home, location, explore, history, season, shamwari), mineral accent stripe, in-memory rate limiting, 1-day CDN cache. Location pages intentionally omit weather data from OG params to avoid extra DB round-trips per SSR render

### PWA

- `public/manifest.json` — installable app with shortcuts, theme colors, display modes
- Icons: 192px and 512px in `public/icons/`
- Geolocation support for location detection

### Analytics

- **Google Analytics 4** (GA4) — measurement ID `G-4KB2ZS573N`
- Loaded via `next/script` with `afterInteractive` strategy in `src/components/analytics/GoogleAnalytics.tsx`
- Included in the root layout (`src/app/layout.tsx`) so it runs on all pages
- **Vercel Web Analytics** — `@vercel/analytics` ^1.6.1, imported as `<Analytics />` from `@vercel/analytics/next` in root layout. Server-side Web Vitals collection and real-time performance monitoring in Vercel dashboards
- Privacy policy (`/privacy`) updated to disclose GA4 + Vercel Analytics usage, cookie information, opt-out instructions, and custom event tracking
- No personally identifiable information is collected — only anonymised page views, visitor counts, navigation patterns, and interaction events

**Custom event tracking:** `src/lib/analytics.ts` — centralized utility that fires events to both GA4 and Vercel Analytics via a single `trackEvent(name, properties)` call. Type-safe event names and property shapes. No-ops on server, silently swallows errors so tracking never breaks the app.

**Tracked events:**

| Event                  | Trigger                              | Properties                                  |
| ---------------------- | ------------------------------------ | ------------------------------------------- |
| `report_submitted`     | Weather report wizard complete       | type, severity, location                    |
| `report_upvoted`       | Community report upvote              | reportId, location                          |
| `location_changed`     | User navigates to different location | from, to, method (saved/geolocation/search) |
| `location_saved`       | Location added to saved list         | slug                                        |
| `location_removed`     | Location removed from saved list     | slug                                        |
| `activity_toggled`     | Activity enabled/disabled            | activityId, enabled                         |
| `theme_changed`        | Theme preference changed             | theme                                       |
| `ai_summary_loaded`    | AI summary fetched for location      | location                                    |
| `ai_chat_sent`         | Message sent in AI chat              | source, location?                           |
| `explore_search`       | Explore search performed             | query, resultCount                          |
| `history_analysis`     | Historical analysis triggered        | location, days                              |
| `geolocation_result`   | Home page geolocation resolved       | status, location?                           |
| `map_layer_changed`    | Weather map layer switched           | layer, location                             |
| `onboarding_completed` | Welcome banner action taken          | method                                      |
| `modal_opened`         | Modal opened                         | modal                                       |

### Feature Flags

`src/lib/feature-flags.ts` — lightweight, type-safe, client-side feature flag system. No SaaS dependency.

**Flag definitions:** Code-defined `FLAGS` object with boolean defaults. All currently-shipped features are `true`. Experimental/future features (`premium_maps`, `vector_search`, `multi_language`) are `false`.

**API:**

- `isFeatureEnabled(flag)` — check default flag value (safe on server + client)
- `isFeatureEnabledWithOverride(flag)` — check with localStorage override support (`ff:<flag>` keys)
- `getFeatureFlag(flag)` — check flag with localStorage override support (safe anywhere, not a React hook)

**Dev overrides:** Set `localStorage.setItem("ff:premium_maps", "true")` in browser console to enable features locally. Changes require page reload.

### Historical Weather Dashboard

- **Route:** `/history` — client-side dashboard for exploring recorded weather data
- **Components:** `src/app/history/page.tsx` (server, metadata) + `src/app/history/HistoryDashboard.tsx` (client)
- **Features:** location search, configurable time period (7d–1y), comprehensive charts, summary statistics, daily records table, and AI-powered analysis
- **AI analysis:** `src/components/weather/HistoryAnalysis.tsx` — button-triggered analysis ("Analyze with Shamwari"). Server-side aggregation computes compact stats (~800 tokens) from raw records, sends to Claude for trend/pattern analysis. Results rendered as markdown with tanzanite border. "Discuss in Shamwari" link carries analysis context via `ShamwariContext`. Cached 1h server-side
- **Data source:** `GET /api/history?location=<slug>&days=<n>` backed by MongoDB `weather_history` collection
- **Charts:** Reusable chart components from `src/components/weather/charts/` (Canvas 2D via Chart.js)

**Dashboard metrics (7 charts + stats + table):**

1. **Temperature trend** — actual high/low area chart + feels-like (apparent) temperature overlay lines
2. **Precipitation & rain probability** — dual-axis: rainfall bars (mm) + probability line (%)
3. **UV index & cloud cover** — dual-axis: UV bars + cloud cover line (%)
4. **Wind speed & gusts** — overlapping area chart showing sustained speed vs peak gusts
5. **Barometric pressure** — line chart with auto-scaled Y axis
6. **Humidity** — area chart with gradient fill (0–100%)
7. **Daylight hours** — sunrise-to-sunset duration (shown when data available)

**Summary statistics (4 grouped sections):**

- Temperature: avg high/low, record high/low, feels-like high/low
- Precipitation: total rain, rainy days count, avg rain probability
- Atmosphere: avg humidity, cloud cover, pressure, avg/peak UV with severity label
- Wind & Daylight: avg wind, max gusts, avg daylight hours, data point count

**Data table columns:** Date, Condition, High, Low, Feels-Like, Rain, Rain Prob, Humidity, Cloud, Wind, Gusts, Direction, UV, Pressure, Sunrise, Sunset — responsively hidden on smaller screens

### Header & My Weather Modal

**Header** (`src/components/layout/Header.tsx`): Sticky header with the Mukoko logo on the left, desktop nav links in the center, and a pill-shaped icon group on the right.

**Desktop nav links** (hidden on mobile, `sm:flex`): Explore | Shamwari | History — text links with active state highlighting.

**Action pill** (`bg-primary`, four 48px circular icon buttons):

1. **Compass icon** — links to `/explore` (Explore locations)
2. **Layers icon** — links to `/${selectedLocation}/map` (Weather map)
3. **Megaphone icon** — opens the Weather Report modal (Report current weather)
4. **Map pin icon** — opens the My Weather modal (Preferences)

The header also renders `WeatherReportModal` and `SavedLocationsModal` (both lazy-loaded, only mount when their respective store state is true). `SavedLocationsModal` is additionally wrapped in `ChartErrorBoundary` so a crash in the modal never takes down the header.

The header takes no props — location context comes from the URL path.

**Mobile Bottom Navigation** (visible `sm:hidden`): Fixed bottom nav with 5 items:

1. **Weather** (home icon) → `/`
2. **Explore** (compass icon) → `/explore`
3. **Shamwari** (sparkles icon) → `/shamwari` — center position
4. **History** (clock icon) → `/history`
5. **My Weather** (map-pin button) → opens modal

**My Weather Modal** (`src/components/weather/MyWeatherModal.tsx`): A centralized preferences modal (shadcn Dialog + Tabs) with three tabs:

- **Location** — search input, geolocation button, tag filter pills, scrollable location list with pending-slug highlighting. Selecting a location sets it as _pending_ (does not navigate immediately).
- **Activities** — category tabs (mineral-colored), search, 2-column activity grid with toggle selection. Uses `CATEGORY_STYLES` for consistent mineral color theming. Auto-scrolls into view after location selection.
- **Settings** — theme radio group (light/dark/system) with visual indicators.

**Welcome Banner** (`src/components/weather/WelcomeBanner.tsx`): Inline banner shown to first-time visitors (`hasOnboarded === false`) above the weather grid. Replaces the old auto-opening modal approach which caused a disruptive loading sequence. Two buttons: "Personalise" (opens My Weather modal) and "Continue with {locationName}" (marks onboarding complete). Both buttons use 56px min-height touch targets.

**Deferred navigation:** Location and activity selection are unified — picking a location (either manually or via geolocation) highlights it as pending and auto-advances to the Activities tab so the user can also select activities before navigating. The Done/Apply button commits both choices at once. Navigation only occurs on Done/Apply, not on location tap or geolocation detection. Built with shadcn Dialog (Radix), Tabs, Input, Button, and Badge components.

**Saved Locations Modal** (`src/components/weather/SavedLocationsModal.tsx`): A full-screen dialog (100dvh on mobile, auto-sized on desktop) for browsing, managing, and adding saved locations — up to `MAX_SAVED_LOCATIONS` (10).

**Features:**

- **Current location detection** — geolocation button with feedback states (detecting, denied, error), option to save detected location
- **Saved locations list** — displays saved location slugs with province context, checkmark for currently-viewed location, trash icon per location for removal. Shows loading skeleton while fetching location details; falls back to title-cased slug display if API lookup fails
- **Add location search** — debounced search input (via shared `useDebounce` hook from `@/lib/use-debounce`) calling `/api/py/search`, filters out already-saved slugs, disabled at capacity
- **Capacity management** — displays count (e.g., "5/10"), disables add button when cap is reached

**Interaction flow:** Tap layers icon in header pill → modal opens showing saved locations or empty state → tap location to navigate and close → tap trash to remove → tap + to search and add new locations → tap current location button for GPS detection.

**Icons:** Uses `MapPinIcon`, `SearchIcon`, `TrashIcon`, `PlusIcon`, `NavigationIcon` from `@/lib/weather-icons`.

### Weather Loading Scenes (Three.js)

`src/lib/weather-scenes/` — weather-aware Three.js particle animation system for loading screens.

**Architecture:**

- `types.ts` — `WeatherSceneType` (8 types: clear, partly-cloudy, cloudy, rain, thunderstorm, fog, snow, windy), `WeatherSceneConfig`, `CachedWeatherHint`, `SceneBuilder`
- `create-scene.ts` — Three.js scene factory: creates renderer, camera, ambient/directional lights, calls the appropriate scene builder, returns an animation loop + cleanup
- `resolve-scene.ts` — maps WMO weather codes to `WeatherSceneType` (supports day/night variants)
- `cache.ts` — client-side `localStorage` cache for weather hints (2h TTL per location slug). First visit shows default partly-cloudy scene; subsequent visits show last-known weather condition
- `scenes/` — 8 builder modules, each adding particle systems to the Three.js scene (sun orbs, cloud particles, rain drops, lightning flashes, fog wisps, snow flakes, wind streaks)

**Integration:** `src/components/weather/WeatherLoadingScene.tsx` — branded loading overlay used by:

- `src/app/HomeRedirect.tsx` — home page redirect (shows "Finding your location...")
- `src/app/[location]/loading.tsx` — location page loading (shows location-aware weather animation)

**Route slug detection:** The component extracts a location slug from the URL pathname as a fallback (for `loading.tsx` files). A `KNOWN_ROUTES` set (`explore`, `shamwari`, `history`, `about`, `help`, `privacy`, `terms`, `status`, `embed`) guards against misinterpreting non-location route names as location slugs.

**Accessibility:** Respects `prefers-reduced-motion` — skips Three.js entirely, shows text-only loading with animated dots. Three.js failures are caught and degraded gracefully (CSS-only fallback).

**Note:** Three.js WebGL requires raw hex colors — CSS custom properties don't work in WebGL shaders. Hardcoded hex values in `scenes/*.ts` are a documented exception to the "no hardcoded styles" rule.

### HomeRedirect (Smart Home Page)

`src/app/HomeRedirect.tsx` — client component that replaces a static redirect with location-aware routing.

**Redirect logic (priority order):**

1. **Always attempt geolocation** — browser GPS via `detectUserLocation()` with 3s timeout
2. **If geolocation succeeds** → redirect to detected location
3. **If geolocation fails** → fall back to first saved location, then selected location, then `/explore`

This geo-first approach mirrors Apple Weather / Google Weather behavior — the home page always tries to show your current physical location.

**Key implementation details:**

- Waits for Zustand `persist` rehydration before reading state (uses `hasStoreHydrated()` from `store.ts`) to avoid acting on default values before localStorage loads. A 4s max-wait timeout (`HYDRATION_TIMEOUT_MS`) prevents infinite polling if Zustand persist middleware never fires (e.g., corrupt localStorage)
- Fallback location is read at decision time (inside `.then()`/`.catch()` callbacks via `useAppStore.getState()`) so device sync changes during the 3s geo wait are reflected
- Uses `router.replace()` so the home page doesn't appear in browser history
- `hasRedirected` ref prevents duplicate redirects
- Effect cleanup cancels in-flight geolocation on unmount

### Lazy Loading & Mobile Performance (TikTok-Style)

All pages use a **TikTok-style sequential mounting** pattern — only ONE section mounts at a time via a global FIFO queue. This caps peak memory regardless of how many sections exist.

`LazySection` (`src/components/weather/LazySection.tsx`) provides:

1. **Sequential mount queue** — global FIFO queue mounts ONE component at a time with rAF + settle delay (150ms mobile, 50ms desktop) between mounts
2. **Bidirectional visibility** — sections mount when entering viewport (100-300px margin) and UNMOUNT when scrolling 1500px past viewport to reclaim memory
3. **Adaptive timing** — mobile gets longer settle delays than desktop
4. **Skeleton fallbacks** — each section has an aspect-matched skeleton placeholder shown before mounting
5. **Memory pressure monitoring** — `useMemoryPressure()` hook monitors `performance.memory` for JS heap pressure

**Location page — `CurrentConditions` and `AtmosphericSummary` load eagerly.** All other sections are lazy:

- `HourlyScrollCards` → `ChartErrorBoundary` (eager)
- `CurrentConditions` → `ChartErrorBoundary` (eager — big temp, feels-like, daily high/low)
- `AtmosphericSummary` → `ChartErrorBoundary` (eager — 7 gauge cards: humidity, cloud, wind, pressure, UV, feels-like, precipitation)
- `RecentReports` → `LazySection` + `ChartErrorBoundary` + `Suspense`
- `HourlyForecast` → `LazySection` + `ChartErrorBoundary` + `Suspense`
- `ActivityInsights` → `LazySection` + `ChartErrorBoundary` + `Suspense`
- `DailyForecast` → `LazySection` + `ChartErrorBoundary` + `Suspense`
- `AISummary` → `LazySection` + `ChartErrorBoundary` + `Suspense`
- `AISummaryChat` → `LazySection` + `ChartErrorBoundary` + `Suspense` (only when AI summary loaded & not fallback)
- `SunTimes` → `LazySection` + `ChartErrorBoundary` + `Suspense`
- `MapPreview` → `LazySection` + `ChartErrorBoundary` + `Suspense`
- `SupportBanner` → `LazySection` + `ChartErrorBoundary` (Buy Me a Coffee support card)
- Location info card → `LazySection`

**History page — only the search/filters and summary stats load eagerly.** All charts and the data table are lazy:

- All 7 charts → `LazySection(fallback=<ChartSkeleton />)` + `ChartErrorBoundary` each
- Daily records data table → `LazySection(fallback=<ChartSkeleton />)` with infinite scroll

**Canvas rendering optimizations:**

- Chart.js Canvas 2D rendering — single `<canvas>` DOM element per chart (not thousands of SVG nodes)
- Mobile: `devicePixelRatio: 1`, `animation: false`, data downsampling for large datasets (>60 points on mobile)
- CSS variable resolution via `resolveColor()` — Chart.js needs concrete values, not `var(--chart-1)`
- `HistoryDashboard` uses `reduce()` instead of spread-based `Math.max(...array)` for large datasets

### Atmospheric Summary (Location Page)

`src/components/weather/AtmosphericSummary.tsx` — a grid of 7 compact metric cards with radial arc gauges, rendered eagerly as section 3 on the location page (immediately after `CurrentConditions`). Following the Apple Weather / Google Weather pattern of showing current values with severity-colored gauges and contextual labels.

**Cards shown:** Humidity, Cloud Cover, Wind (with gusts + direction), Pressure, UV Index, Feels Like, Precipitation. Each card has an icon, current value, contextual label (e.g., "Comfortable", "Very High", "Cooler than actual"), and a 270° radial arc gauge color-coded by severity.

**Contextual helpers:** `humidityLabel(h)`, `pressureLabel(p)`, `cloudLabel(c)`, `precipitationLabel(p)` — map raw values to human-readable descriptions. UV labels come from `uvLevel()` in `weather.ts`.

**Link:** "24h trends →" links to `/${slug}/atmosphere` where the full atmospheric charts live for that location.

### Atmospheric Details (Atmosphere Sub-Route & History Page)

`src/components/weather/AtmosphericDetails.tsx` — orchestrates four chart components for 24-hour hourly atmospheric views. Used by the `/${slug}/atmosphere` sub-route page and the history page (via `LazyAtmosphericDetails`). Not rendered on the main location page.

**Imports chart components from `src/components/weather/charts/`:**

1. `HumidityCloudChart` — humidity area + cloud cover dashed line, 0–100%
2. `WindSpeedChart` — wind area + gusts dashed line, km/h (auto-scaled)
3. `PressureChart` — pressure line with auto-scaled Y axis, hPa
4. `UVIndexChart` — UV index bars with dynamic max scale

**Helper function:** `prepareAtmosphericData(hourly)` — slices 24 hours of data starting from the current hour, exported for testing.

### Shamwari AI Chat

**Route:** `/shamwari` — full-viewport AI chat (Claude app style). The chatbot fills the screen between the sticky header and mobile bottom nav. Chat input is fixed above the mobile navigation bar.

**Components:**

- `src/app/shamwari/page.tsx` — server wrapper (metadata, Header only — no Footer for max chat space)
- `src/app/shamwari/ShamwariPageClient.tsx` — client: full-viewport layout (`100dvh - header`), bottom padding for mobile nav (`pb-[4.5rem] sm:pb-0`)
- `src/components/explore/ExploreChatbot.tsx` — reusable chat UI: message bubbles, typing indicator, contextual suggested prompts, markdown rendering, location reference links

**Contextual navigation:** On mount, `ExploreChatbot` checks `useAppStore.shamwariContext`. If present and not expired (10 min), it generates a contextual greeting and location-specific suggested prompts based on the source page (location/explore/history). Context is consumed once and cleared after use. Greetings and prompts are fetched from the database-driven AI prompt library with hardcoded fallbacks.

**API:** `POST /api/py/chat` — Claude-powered chatbot with tool use. Rate-limited to 20 requests/hour/IP.

- **Tools:** `search_locations`, `get_weather`, `get_activity_advice`, `list_locations_by_tag`
- **Input validation:** message required (string, max 2000 chars), history capped at 10 messages (both user and assistant truncated via `truncateHistoryContent` to 2000 chars), activities array (user's selected activities from Zustand store) capped at 20 items and injected into system prompt for personalised advice, location slugs validated via `SLUG_RE` (`/^[a-z0-9-]{1,80}$/`), tags validated against database-driven `get_known_tags()` allowlist
- **Security:** IP required (rejects unknown), structured messages API (boundary markers have no special meaning — no regex needed), system prompt DATA GUARDRAILS, history length caps
- **Resilience:** module-level singleton Anthropic client with key-rotation invalidation (`getAnthropicClient` — recreates client when API key changes), 15s per-tool timeout (`withToolTimeout`), in-request weather cache (`Map<string, WeatherResult>`), in-request suitability rules cache (`rulesCache`), reference deduplication preferring "location" type (`deduplicateReferences`), `list_locations_by_tag` capped to 20 results with note to Claude
- **Server-side caches:** location context (5-min TTL, bounded to 20 locations), activities (5-min TTL, used for dynamic system prompt activity list)
- **Response shape:** `{ response, references, error? }` — references include location slugs/names for quick-link rendering

### Explore (Browse + AI Search)

**Route:** `/explore` — location browsing by category/country (ISR 1h) + AI-powered natural-language search.

**Components:**

- `src/app/explore/page.tsx` — server component (ISR 1h), fetches tag counts and featured tags, renders AI search + Shamwari CTA card + category browse grid + country browse link
- `src/components/explore/ExploreSearch.tsx` — client component: natural-language search input (e.g., "farming areas with low frost risk"), results render as location cards with inline weather data. "Ask Shamwari for more" link sets `ShamwariContext` with `source: "explore"` + `exploreQuery`
- **API:** `POST /api/py/explore/search` — uses Claude with `search_locations` + `get_weather` tools. Falls back to text search if AI unavailable. Rate-limited 15 req/hour/IP

**Sub-routes:**

- `/explore/[tag]` — locations filtered by tag, server-rendered
- `/explore/country` — country index page with flag emoji
- `/explore/country/[code]` — locations in a country, grouped by province
- `/explore/country/[code]/[province]` — locations in a specific province

### Support Banner (Buy Me a Coffee)

`src/components/weather/SupportBanner.tsx` — inline support card linking to Buy Me a Coffee (`https://www.buymeacoffee.com/bryany`). Uses the official BMC brand yellow via `--color-bmc` CSS custom property. Wrapped in `LazySection` + `ChartErrorBoundary` on the location page so a crash never affects weather sections. Rendered after community reports and before the location info card in `WeatherDashboard.tsx`.

### Community Weather Reporting (Waze-Style)

Users can submit real-time ground-truth weather observations, similar to Waze for road incidents.

**Report types (10):** light-rain, heavy-rain, thunderstorm, hail, flooding, strong-wind, clear-skies, fog, dust, frost
**Severity levels (3):** mild (24h TTL), moderate (48h TTL), severe (72h TTL)

**Components:**

- `src/components/weather/reports/WeatherReportModal.tsx` — 3-step dialog wizard: select type (grid of icons) → AI clarification (1-2 follow-up questions) → confirm (summary + severity + submit). Uses shadcn Dialog, triggered via `reportModalOpen` store state
- `src/components/weather/reports/RecentReports.tsx` — shows recent community reports on location pages. Compact cards with type icon, severity badge, verified badge, time ago, upvote button. Includes "Report Weather" trigger

**API endpoints:**

- `POST /api/py/reports` — submit report (rate-limited 5/hour/IP, auto-captures weather snapshot for cross-validation)
- `GET /api/py/reports?location=<slug>&hours=<n>` — list recent reports for a location
- `POST /api/py/reports/upvote` — upvote a report (IP-based dedup)
- `POST /api/py/reports/clarify` — AI-generated follow-up questions (database-driven prompt via `system:report_clarification`)

**Cross-validation:** Reports are auto-verified against API weather data at the same location/time. User reports "heavy rain" but API shows 0% precipitation → unverified. User reports "clear skies" and API confirms → auto-verified with checkmark badge.

**MongoDB collection:** `weather_reports` with TTL-based expiration via `expiresAt` field

### Status Page

**Route:** `/status` — live system health dashboard.

- `src/app/status/page.tsx` — server wrapper (metadata)
- `src/app/status/StatusDashboard.tsx` — client component, calls `GET /api/py/status`
- Checks: MongoDB connectivity, Tomorrow.io API key, Open-Meteo availability, Anthropic API key, weather cache health
- Each service shows operational/degraded/down status with latency

## Testing

**TypeScript (Vitest 4.0.18)** — configured in `vitest.config.ts`

- Environment: Node
- Global test APIs enabled
- Test glob: `src/**/*.test.ts`
- Path alias: `@/*` → `./src/*`
- Coverage: `@vitest/coverage-v8` provider, reporters: `text` + `lcov`
- Coverage command: `npm run test:coverage`

**Python (pytest 8.3)** — configured in `pytest.ini`

- Test directory: `tests/py/`
- Shared fixtures in `tests/py/conftest.py` (mock_request, pymongo/anthropic mocking)
- `conftest.py` evicts the system `py` module and mocks `pymongo`/`anthropic` so tests run without MongoDB or Anthropic connectivity
- Async support via `pytest-asyncio` (auto mode)

**Test files:**

_Library tests:_

- `src/lib/weather.test.ts` — frost detection, season logic, wind direction, UV levels, fallback weather, synthesizeOpenMeteoInsights
- `src/lib/weather-labels.test.ts` — humidity/pressure/cloud/precipitation/feels-like label helpers
- `src/lib/locations.test.ts` — location searching, tag filtering, nearest location
- `src/lib/activities.test.ts` — activity definitions, categories, search, filtering, category styles
- `src/lib/suitability.test.ts` — suitability rule evaluation, condition matching, metric template resolution
- `src/lib/countries.test.ts` — country/province data, flag emoji, province slug generation
- `src/lib/tomorrow.test.ts` — Tomorrow.io weather code mapping, response normalization, insights extraction
- `src/lib/store.test.ts` — theme resolution (light/dark/system), SSR fallback, ShamwariContext set/clear/expiry, savedLocations CRUD/cap/persistence, savedLocationsOpen toggle
- `src/lib/suggested-prompts.test.ts` — suggested prompt generation, weather condition matching, max 3 cap
- `src/lib/device-sync.test.ts` — device sync CRUD, debounced sync, migration, beforeunload
- `src/lib/map-layers.test.ts` — map layer config, default layer, getMapLayerById
- `src/lib/utils.test.ts` — Tailwind class merging (cn utility), getScrollBehavior reduced-motion detection
- `src/lib/i18n.test.ts` — translations, formatting, interpolation
- `src/lib/db.test.ts` — database operations (CRUD, TTL, API keys, activities, suitability rules, Atlas Search time-based recovery, Vector Search embedding guard, $facet aggregation)
- `src/lib/suitability-cache.test.ts` — suitability cache TTL, reset, category styles
- `src/lib/geolocation.test.ts` — browser geolocation API wrapper, auto-creation statuses
- `src/lib/observability.test.ts` — structured logging, error reporting
- `src/lib/analytics.test.ts` — centralized event tracking (GA4 + Vercel), no-op on server, missing gtag, all event types
- `src/lib/feature-flags.test.ts` — flag definitions, default values, localStorage overrides, SSR fallback, getFeatureFlag equivalence
- `src/lib/weather-icons.test.ts` — weather icon mapping
- `src/lib/error-retry.test.ts` — error retry logic
- `src/lib/accessibility.test.ts` — accessibility helpers
- `src/lib/seed-ai-prompts.test.ts` — AI prompt/rule uniqueness, LOCATION DISCOVERY guardrails presence, structural integrity
- `src/lib/use-debounce.test.ts` — useDebounce hook structure, exports, generic typing
- `src/lib/weather-scenes/cache.test.ts` — weather hint cache (set/get, 2h TTL expiry, LRU eviction early-exit, localStorage cleanup)
- `src/lib/weather-scenes/create-scene.test.ts` — scene factory (exports, dispose, scene types, fallback, cleanup)
- `src/lib/weather-scenes/resolve-scene.test.ts` — weather code → scene type mapping (WMO codes, day/night, edge cases)

_TypeScript API route tests (remaining):_

- `src/app/api/og/og-route.test.ts` — OG image route (templates, brand tokens, rate limiting, metadata wiring in layout + location pages)
- `src/app/api/db-init/db-init-route.test.ts` — DB init route

_Note:_ All other API routes have been migrated to Python (`api/py/`). Python backend tests should use pytest (see below).

_Python backend tests (pytest):_

- `tests/py/test_circuit_breaker.py` — circuit breaker state machine (closed→open→half_open), failure window pruning, async execute with timeout, singleton breaker configs
- `tests/py/test_db_helpers.py` — `get_client_ip` (x-forwarded-for, x-real-ip, client.host, None), `check_rate_limit` (allow/deny/boundary/composite-key/None-result)
- `tests/py/test_chat.py` — `_build_chat_system_prompt` (location list, count, activities, fallback vs DB template, 20-location cap), SLUG_RE, KNOWN_TAGS, tool helpers (search, list_by_tag, get_weather cache, tool dispatch)
- `tests/py/test_weather.py` — Weather proxy: Tomorrow.io/Open-Meteo fallback chain, seasonal estimates, cache operations, normalization, circuit breaker integration
- `tests/py/test_locations.py` — Location CRUD: slug generation, geocoding, deduplication, region validation, search/filter, geo lookup, add location
- `tests/py/test_ai.py` — AI summaries: tiered TTL, client singleton, season lookup, staleness detection, caching, system prompt, generate endpoint with fallback
- `tests/py/test_reports.py` — Community reports: cross-validation, IP hashing, fallback questions, submit/list/upvote/clarify endpoints, rate limiting
- `tests/py/test_history.py` — Historical weather data: validation, location verification, datetime serialization, query shape
- `tests/py/test_history_analyze.py` — History analysis: stats aggregation (temps, precip, trends, insights), system prompt building, caching, rate limiting, AI fallback
- `tests/py/test_ai_followup.py` — Follow-up chat: system prompt building, message truncation, history capping, rate limiting, circuit breaker, AI error handling
- `tests/py/test_devices.py` — Device sync: validation (theme, slug, savedLocations, activities), CRUD endpoints, DuplicateKeyError handling, partial updates
- `tests/py/test_explore_search.py` — AI search: tool execution (search/weather), text search fallback, system prompt building, rate limiting, circuit breaker
- `tests/py/test_suitability.py` — Suitability rules: key regex validation, single/all rules, cache headers, error fallback
- `tests/py/test_data.py` — Data endpoints: activities (by id/category/search/labels/categories), tags (all/featured), regions (active)
- `tests/py/test_ai_prompts.py` — AI prompts: single/all prompts, suggested rules, module-level caching, DB error graceful degradation
- `tests/py/test_index.py` — FastAPI app: CORS origins, health endpoint, ConnectionFailure handler, all 16 routers mounted
- `tests/py/test_tiles.py` — Map tiles: Tomorrow.io weather overlay proxy (layer validation, zoom range, timestamp validation, SSRF protection, proxy behavior, cache headers) + Mapbox base tile proxy (style validation, zoom range, URL construction, dark mode)
- `tests/py/test_status.py` — System health: MongoDB/Tomorrow.io/Open-Meteo/Anthropic/cache checks, overall status aggregation
- `tests/py/test_embeddings.py` — Embeddings stub: status endpoint shape

_Page/component tests:_

- `src/app/seo.test.ts` — metadata generation, schema validation, canonical URL coverage (layout bleed guard, per-page canonical presence)
- `src/app/HomeRedirect.test.ts` — HomeRedirect structure, Zustand rehydration guard (max-wait timeout), deferred fallback, redirect logic, geolocation
- `src/app/explore/explore.test.ts` — explore page tests (browse-only, Shamwari CTA link)
- `src/app/shamwari/shamwari.test.ts` — Shamwari page structure, full-viewport layout, loading skeleton
- `src/app/[location]/FrostAlertBanner.test.ts` — banner rendering, severity styling
- `src/app/[location]/WeatherDashboard.test.ts` — weather dashboard tests, cacheWeatherHint integration
- `src/app/history/HistoryDashboard.test.ts` — history dashboard tests
- `src/components/explore/ExploreChatbot.test.ts` — chatbot component tests, MarkdownErrorBoundary, contextual navigation
- `src/components/explore/ExploreSearch.test.ts` — AI search structure, search flow, results rendering, Shamwari context
- `src/components/embed/MukokoWeatherEmbed.test.ts` — widget rendering, data fetching
- `src/components/ui/chart-fallbacks.test.ts` — CSS fallback table key parity (light/dark sync)
- `src/components/ui/primitives.test.ts` — UI primitive variants (StatusIndicator, CTACard, ToggleGroup, InfoRow, SectionHeader)
- `src/components/weather/charts.test.ts` — chart data preparation (hourly + daily + atmospheric), hexWithAlpha
- `src/components/weather/ActivityInsights.test.ts` — severity helpers, moon phases, precip types
- `src/components/weather/ActivityCard.test.ts` — suitability integration (levels, priority, fallbacks, severity tokens)
- `src/components/weather/AtmosphericSummary.test.ts` — gauge functions (UV, humidity, cloud, wind, pressure, feels-like, precipitation)
- `src/components/weather/MetricCard.test.ts` — ArcGauge math, SVG geometry, ARIA contract, exports
- `src/components/weather/DailyForecast.test.ts` — temperature percent, gradient helpers
- `src/components/weather/ChartErrorBoundary.test.ts` — error boundary rendering
- `src/components/weather/CurrentConditions.test.ts` — current conditions rendering
- `src/components/weather/LazySection.test.ts` — lazy section mounting, visibility
- `src/components/weather/WelcomeBanner.test.ts` — welcome banner rendering, onboarding state, accessibility
- `src/components/weather/SupportBanner.test.ts` — BMC support card structure, accessibility, error isolation, no hardcoded styles
- `src/components/weather/AISummaryChat.test.ts` — inline follow-up chat structure, max message cap, accessibility
- `src/components/weather/HistoryAnalysis.test.ts` — analysis structure, endpoint, request body, ShamwariContext, accessibility
- `src/components/weather/SavedLocationsModal.test.ts` — modal structure, icons, search, geolocation, loading skeleton, capacity management, accessibility
- `src/components/weather/WeatherLoadingScene.test.ts` — KNOWN_ROUTES guard, reduced-motion support, Three.js integration, slug display, accessibility
- `src/components/weather/reports/WeatherReportModal.test.ts` — 3-step wizard, report types, severity, accessibility
- `src/components/weather/reports/RecentReports.test.ts` — report list, upvoting, report trigger, UI patterns

**Conventions:**

- TypeScript tests live next to the code they test (co-located `.test.ts` files)
- Python tests live in `tests/py/` (named `test_*.py`, classes `Test*`, functions `test_*`)
- TypeScript: `describe`/`it`/`expect` pattern (Vitest)
- Python: `class Test*` / `def test_*` pattern (pytest), `@patch` for mocking
- Any new utility function, CSS class mapping, API behavior, or component logic must have corresponding tests

## Pre-Commit Checklist (REQUIRED)

Before every commit, you MUST complete ALL of these steps. Do not skip any.

1. **Run TypeScript tests** — `npm test` must pass with zero failures. If you changed behavior, add or update tests.
2. **Run Python tests** — `python -m pytest tests/py/ -v` must pass with zero failures. If you changed Python backend behavior, add or update tests.
3. **Run lint** — `npm run lint` must have zero errors (warnings are acceptable).
4. **Run type check** — `npx tsc --noEmit` must pass with zero errors.
5. **Run build** — `npm run build` must compile and generate all pages successfully.
6. **Update tests** — Any new utility function, CSS class mapping, API behavior, or component logic must have corresponding tests.
7. **Update documentation** — If your change affects any of the following, update the corresponding docs:
   - Public API or routes → update README.md API section
   - Project structure (new files/directories) → update README.md project structure
   - Tech stack (new dependencies) → update README.md tech stack table and CLAUDE.md tech stack
   - Environment variables → update README.md env vars table and CLAUDE.md env vars section
   - Styling patterns or tokens → update CLAUDE.md Styling section
   - AI summary format or prompt → update CLAUDE.md AI Summaries section
   - Developer workflow → update CONTRIBUTING.md
8. **Verify no hardcoded styles** — No new hardcoded hex colors, rgba(), or inline `style={{}}` in components.
9. **Verify layered architecture** — New components follow the Layered Component Architecture (see above): error boundary, lazy loading, skeleton, accessibility, global styles, tests.

## Conventions

### Component Architecture

- **Layered imports** — components import from the layer below, never sideways or upward
- **Chart components** — all chart rendering lives in `src/components/weather/charts/`; dashboards import, never hardcode
- **Error isolation** — every section wrapped in `ChartErrorBoundary`; crashes never propagate
- **Sequential lazy loading** — every non-critical section wrapped in `LazySection` with skeleton fallback
- **Skeleton placeholders** — aspect-matched loading skeletons for every lazy-loaded section
- **API resilience** — external API calls wrapped in circuit breakers (`api/py/_circuit_breaker.py`) to prevent cascade failures

### Styling

- **Global styles only** — all colors and tokens defined in `globals.css` as CSS custom properties
- **Never hardcode** — no hex colors, rgba(), inline `style={{}}`, or dynamic Tailwind class construction
- **Tailwind classes** — always use Tailwind utility classes backed by CSS custom properties
- **Canvas chart colors** — resolved at render time via `resolveColor()` from `src/components/ui/chart.tsx`
- **Design tokens for sizes** — touch targets, radii, and other dimensions live in `:root` (e.g. `--touch-target-min: 48px`, `--radius-button: 9999px`) and are referenced via Tailwind arbitrary values like `w-[var(--touch-target-min)]`. Never hardcode `w-14 h-14` or `min-h-[56px]` on individual components — changing the token must propagate everywhere.

### Fauna — Semantic Component Classes

Repeated Tailwind chains (3+ uses) are extracted into named component classes in the `@layer components` block of `globals.css`, named after African animals and birds. Components compose these instead of duplicating utility chains.

**Current palette:**

| Class            | Purpose                                    | Replaces                                                                                    |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `.kudu`          | Primary pill button (filled, brand colour) | `rounded-button bg-primary px-5 py-3 ...`                                                   |
| `.impala`        | Secondary/outline pill button              | `border border-border bg-transparent px-5 py-3 ...`                                         |
| `.bee`           | Round icon button (mukoko = beehive)       | `w-[var(--touch-target-min)] h-[var(--touch-target-min)] rounded-full bg-background/10 ...` |
| `.baobab`        | Primary card surface                       | `rounded-card border border-primary/25 bg-surface-card p-4 shadow-sm`                       |
| `.acacia`        | Quieter card surface                       | `rounded-card border border-border bg-surface-card p-4`                                     |
| `.giraffe`       | Section heading (tall, stands above)       | `text-base font-semibold text-text-primary font-heading`                                    |
| `.gazelle`       | Body paragraph copy                        | `text-base text-text-secondary leading-relaxed`                                             |
| `.dove`          | Muted secondary text                       | `text-sm text-text-tertiary`                                                                |
| `.weaver`        | Primary nav link                           | `inline-flex items-center text-base font-medium text-text-secondary hover:...`              |
| `.weaver-active` | Active nav link (cobalt + underline)       | active variant of `.weaver`                                                                 |
| `.chameleon`     | Skeleton placeholder                       | `animate-pulse rounded-card border border-surface-dim bg-surface-card shadow-sm`            |

**Rules:**

- Add new fauna classes when a pattern is duplicated 3+ times
- Compose fauna classes with custom utilities where needed: `<button class="kudu press-scale">`
- Fauna classes live in `@layer components` so per-utility classes still override them
- Naming: African animals/birds (kudu, impala, bee, dove, weaver, eagle, hornbill, crane, etc.)
- Update once in `globals.css` — every consumer picks it up automatically

### Accessibility

- **Skip-to-content link** — `<a href="#main-content" className="sr-only focus:not-sr-only ...">` in root `layout.tsx`, targets `<main id="main-content">` on each page
- **ARIA landmarks** — Header uses `role="banner"`, navigation uses `role="navigation"` with descriptive `aria-label` (e.g., "Main navigation", "Mobile navigation", "Page navigation"), Footer uses `role="contentinfo"`
- **Active nav state** — `aria-current="page"` on currently active navigation links (both desktop and mobile)
- **Focus management** — 3px `focus-visible` outlines with theme-aware `--color-focus-ring` (cobalt in light, sky in dark); `focus:not(:focus-visible)` removes outlines for mouse users; `forced-colors` mode uses `Highlight` system color
- **Screen reader utilities** — `.sr-only` CSS class in `globals.css` for visually hidden but screen reader accessible text
- **Reduced motion** — all entrance animations, stagger delays, and transitions gated by `@media (prefers-reduced-motion: no-preference)`; `prefers-reduced-motion: reduce` disables all animations/transitions globally
- **High contrast** — `prefers-contrast: more` overrides for maximum contrast; `forced-colors: active` support for Windows High Contrast mode
- **Touch targets** — minimum 48px on touch devices (`@media (pointer: coarse)` rule in `globals.css` applies `min-height: var(--touch-target-min)` to `a`, `button`, etc.). Desktop (fine pointer) does not enforce the min-height — pointer precision makes it unnecessary and the rule was causing footer/nav link heights to inflate.
- **Headings** — all sections use `aria-labelledby` with heading IDs
- **Decorative elements** — icons marked `aria-hidden="true"`
- **Skeletons** — all loading states include `role="status"` and `aria-label="Loading"` (`sr-only` span is optional when `aria-label` is present)

### General

- Components are in `src/components/`, organized by domain (`brand/`, `layout/`, `weather/`, `explore/`, `embed/`)
- Client components use `"use client"` directive
- Server components are the default (no directive needed)
- The app is mobile-first — all layouts start from small screens
- TypeScript path alias: `@/*` maps to `./src/*` (e.g., `import { t } from "@/lib/i18n"`)
- CORS is configured in `next.config.ts` for `/api/*` and `/embed/*` routes

## Data Standards & Interoperability

All data models in mukoko weather are aligned with **schema.org** vocabulary and **OpenAPI 3.1** standards. This is mandatory — never deviate from these standards when adding new entities, endpoints, or data fields.

### Schema.org Data Model Mapping

Every data entity MUST map to a schema.org type. The JSON-LD structured data in `src/app/layout.tsx` and `src/app/[location]/page.tsx` already implements these mappings. New entities must follow the same pattern.

**Location → `schema.org/Place`:**

| `WeatherLocation` field | schema.org property      | Type                   | Standard                  |
| ----------------------- | ------------------------ | ---------------------- | ------------------------- |
| `slug`                  | `identifier`             | string                 | URL-safe slug             |
| `name`                  | `name`                   | string                 | —                         |
| `lat`                   | `geo.latitude`           | number                 | WGS 84                    |
| `lon`                   | `geo.longitude`          | number                 | WGS 84                    |
| `elevation`             | `geo.elevation`          | QuantitativeValue      | UN/CEFACT unitCode: `MTR` |
| `province`              | `address.addressRegion`  | string (PostalAddress) | —                         |
| `country`               | `address.addressCountry` | string                 | ISO 3166-1 alpha-2        |
| `tags`                  | `additionalType`         | string[]               | Internal taxonomy         |

**Weather data → `schema.org/Observation`:**

| Measurement    | schema.org property | unitCode | unitText | Standard         |
| -------------- | ------------------- | -------- | -------- | ---------------- |
| Temperature    | `PropertyValue`     | `CEL`    | °C       | UN/CEFACT Rec 20 |
| Wind speed     | `PropertyValue`     | `KMH`    | km/h     | UN/CEFACT Rec 20 |
| Pressure       | `PropertyValue`     | `HPA`    | hPa      | UN/CEFACT Rec 20 |
| Humidity       | `PropertyValue`     | `P1`     | %        | UN/CEFACT Rec 20 |
| Precipitation  | `PropertyValue`     | `MMT`    | mm       | UN/CEFACT Rec 20 |
| Wind direction | `PropertyValue`     | `DD`     | °        | UN/CEFACT Rec 20 |
| Elevation      | `QuantitativeValue` | `MTR`    | metres   | UN/CEFACT Rec 20 |
| UV index       | `PropertyValue`     | —        | —        | WHO UV Index     |

**Other entities already mapped:**

- App → `schema.org/WebApplication` (layout.tsx)
- Company → `schema.org/Organization` (layout.tsx)
- Site → `schema.org/WebSite` with `SearchAction` (layout.tsx)
- Navigation → `schema.org/ItemList` / `SiteNavigationElement` (layout.tsx)
- Breadcrumbs → `schema.org/BreadcrumbList` (layout.tsx, [location]/page.tsx)
- FAQs → `schema.org/FAQPage` ([location]/page.tsx, help/page.tsx)
- Country → `schema.org/Country` ([location]/page.tsx `containedInPlace`)

### ISO Standards (Mandatory)

| Domain            | Standard           | Usage                                                                  |
| ----------------- | ------------------ | ---------------------------------------------------------------------- |
| Country codes     | ISO 3166-1 alpha-2 | `WeatherLocation.country`, `Country.code`, `addressCountry`            |
| Date/time         | ISO 8601           | All `time` arrays, `sunrise`/`sunset`, `datePublished`, `dateModified` |
| Weather codes     | WMO 4677 / 4680    | `weather_code` in hourly/daily/current data                            |
| Measurement units | UN/CEFACT Rec 20   | All `unitCode` values in JSON-LD PropertyValue                         |
| Language tags     | IETF BCP 47        | `en-ZW`, `sn-ZW`, `nd-ZW` in i18n formatting                           |
| Coordinates       | WGS 84             | All `lat`/`lon` values (decimal degrees)                               |

### OpenAPI Compliance

The Python FastAPI backend auto-generates an **OpenAPI 3.1** specification from Pydantic models and route definitions.

- **Development:** OpenAPI docs are available at `/api/py/docs` (Swagger UI), `/api/py/redoc` (ReDoc), and `/api/py/openapi.json` (raw schema). Disabled in production for security.
- **Pydantic models** in `api/py/_*.py` files serve as the canonical API contract. All request/response shapes are defined via `BaseModel` subclasses.
- **New endpoints** MUST define Pydantic request/response models — never use raw `dict` responses without a model.
- **When adding a new data entity:** (1) identify its schema.org equivalent, (2) define a Pydantic model with field names matching schema.org where practical, (3) document the mapping in this section.

### Rules

1. **Schema.org first** — any new data entity must identify its schema.org equivalent before implementation. If no direct mapping exists, use the closest parent type and document the extension in this section.
2. **ISO standards always** — country codes are ISO 3166-1, dates are ISO 8601, coordinates are WGS 84, units follow UN/CEFACT Rec 20. No custom formats.
3. **OpenAPI as contract** — all API endpoints expose their schema via Pydantic models. The auto-generated OpenAPI spec is the source of truth for API consumers.
4. **JSON-LD in pages** — all public-facing pages include schema.org JSON-LD structured data. New page types must add appropriate schemas.
5. **Unit codes are explicit** — weather measurements always carry their `unitCode` in JSON-LD output, never bare numbers without context.

## Premium / Subscription Model

**Business model:** All weather data is free. Premium is a single paid plan that unlocks interactive map layers.

**Free tier (all users):**

- Current conditions, hourly/daily forecasts, area charts
- AI Shamwari insights
- Frost alerts
- Location maps with weather markers

**Premium tier (single plan):**

- Radar map layer (precipitation radar)
- Cloud cover satellite map layer
- Precipitation map layer
- All premium map layers use Leaflet/react-leaflet with tile overlays

**Authentication:** Stytch (upcoming)

- Handles sign-up, login, sessions, and premium entitlement checks
- Server-side session validation on premium API routes

**Map data providers:**

- **Tomorrow.io** — Radar satellite constellation with growing Africa coverage. 60+ data layers including precipitation, cloud, wind. Primary source for all premium map tile layers. API key stored in MongoDB (not env vars).
- **Base map tiles:** Mapbox (raster tiles, proxied via `/api/py/map-tiles/base` to keep access token server-side). Theme-aware: `streets-v12` for light mode, `dark-v11` for dark mode. API key stored in MongoDB `api_keys` collection

**Map technical notes:**

- Leaflet/react-leaflet must be loaded as a `"use client"` component with `next/dynamic` and `ssr: false` (Leaflet requires the DOM)
- Premium map layers are gated server-side — tile proxy routes check Stytch session before forwarding to Tomorrow.io

**API key storage:** Third-party API keys (Tomorrow.io, Stytch) are stored in MongoDB (`api_keys` collection via `getApiKey`/`setApiKey` in `src/lib/db.ts`), not as server environment variables. This allows key rotation and management without redeployment. Keys are seeded via `POST /api/db-init` with body `{ "apiKeys": { "tomorrow": "..." } }`.

## Environment Variables

- `MONGODB_URI` — required, MongoDB Atlas connection string
- `WORKOS_API_KEY` — required, server-side WorkOS API key (sk\_...). Used by AuthKit middleware, the `/callback` handler, and `identity.persons` upsert
- `WORKOS_CLIENT_ID` — required, WorkOS Client ID (client\_...) from the WorkOS dashboard
- `WORKOS_COOKIE_PASSWORD` — required, 32+ character secret used to encrypt/sign the session cookie. Rotating this value invalidates every existing session
- `NEXT_PUBLIC_WORKOS_REDIRECT_URI` — required, the OAuth callback URL. Local: `http://localhost:3000/callback`. Production: `https://weather.mukoko.com/callback`. Must match the Redirect URI registered in the WorkOS dashboard
- `ANTHROPIC_API_KEY` — optional, server-side only. Without it, a basic weather summary fallback is generated.
- `DB_INIT_SECRET` — optional, protects the `/api/db-init` endpoint in production (via `x-init-secret` header)
- `ALERT_WEBHOOK_URL` — optional, enables webhook alerting for high/critical severity errors (Slack incoming webhook, Discord webhook, PagerDuty, or compatible services). Used by `src/lib/observability.ts`
- `NEXT_PUBLIC_MAPTILER_API_KEY` — MapTiler Cloud API key for OpenMapTiles base map tiles and aviation map layers (`feature/openmaptiles` branch). Set in `.env.local` (gitignored). Key stored in MapTiler Cloud account.

## Authentication

mukoko-weather uses **WorkOS AuthKit** (`@workos-inc/authkit-nextjs`) for user accounts. The app is a tenant on the shared Nyuchi Platform `identity` database — sign-ins are mirrored into `identity.persons`, never duplicated.

### Pieces

| File                                                        | Role                                                                                                                                                                                                                                   |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/proxy.ts`                                              | Edge middleware. Calls `authkit(request)` on every request to refresh the WorkOS session, then layers our existing `lastLocation` cookie / home-page redirect logic via `handleAuthkitProxy` (so AuthKit headers survive the redirect) |
| `src/app/callback/route.ts`                                 | OAuth callback handler. Wraps `handleAuth({ onSuccess })` — on a successful WorkOS exchange, calls `upsertPlatformPerson(user)` to mirror the user into `identity.persons`                                                             |
| `src/app/auth/signin/route.ts`                              | Server redirect to the WorkOS-hosted sign-in URL (`getSignInUrl()`)                                                                                                                                                                    |
| `src/app/auth/signout/route.ts`                             | Server route that invokes `signOut({ returnTo: "/" })` — clears the session cookie and redirects through WorkOS logout                                                                                                                 |
| `src/lib/auth.ts`                                           | Server helpers: `getCurrentUser()` (returns user or null), `requireUser()` (enforces sign-in), `upsertPlatformPerson()` (the dedup-disciplined identity.persons writer). Re-exports `getSignInUrl`, `signOut`                          |
| `src/components/auth/UserMenu.tsx`                          | Header slot — uses `useAuth()` from `@workos-inc/authkit-nextjs/components` (client). Signed-in users see a `.hoopoe` avatar + email + `Sign out` (`.impala`); anonymous users see a `Sign in` (`.kudu-sm`) link                       |
| `src/components/auth/SignInButton.tsx`, `SignOutButton.tsx` | Reusable buttons that link to `/auth/signin` and `/auth/signout` respectively                                                                                                                                                          |
| `src/app/layout.tsx`                                        | Wraps the entire tree in `<AuthKitProvider initialAuth={…}>`. `initialAuth` is hydrated server-side via `withAuth()` (minus `accessToken`) so the client renders the right state on first paint with no fetch waterfall                |

### Sign-in flow

```
User clicks "Sign in"
   ↓
GET /auth/signin          → server redirects to getSignInUrl()
   ↓
WorkOS-hosted sign-in     → user authenticates
   ↓
GET /callback?code=…      → handleAuth() exchanges code, sets cookie
   ↓
onSuccess → upsertPlatformPerson(user)
                ├─ dedupe by workosUserId, then email
                ├─ insert (or update) identity.persons doc
                ├─ upsert identity.credentials (provider="workos", credentialType="oauth_token")
                └─ append identity.activityLog ({eventType, surfaceContext: "mukoko-weather"})
   ↓
Redirect back to returnPathname ("/")
```

### Dedup discipline (Phase 0E lesson)

`upsertPlatformPerson` enforces these invariants:

- **persons** — dedupe by `workosUserId` first; fall back to `email` to claim legacy email-only records that pre-date WorkOS. Two persons docs for the same WorkOS user is a bug, and a warning is logged if `countDocuments({workosUserId})` ever returns > 1.
- **credentials** — dedupe by `(personId, provider, credentialType)`. Calling `upsertPlatformPerson` repeatedly never inserts a second `workos` + `oauth_token` credential for the same person; it patches `providerUserId` + `updatedAt` instead.
- **activityLog** — append-only; one entry per upsert call. `eventType: "signup"` on insert, `"signin"` on update. `surfaceContext: "mukoko-weather"` so the platform can slice auth analytics per-app.

### Schema notes

- `identity.persons._id` is the OIDC `sub` claim — generated by `stampPlatformFields()` (UUID v4 via `crypto.randomUUID`).
- `_schemaVersion: "v3.1"`, `isActive`, `emailVerified`, `phoneNumberVerified`, `createdAt`, `updatedAt` are all required by the strict validator. `upsertPlatformPerson` stamps every one of them on insert (and never strips them on update).
- OIDC standard claims set when WorkOS provides them: `email`, `givenName`, `familyName`, `picture`.
- `bundu.countryCode` defaults to `"ZW"` per `DEFAULT_COUNTRY_CODE`; revisit when we onboard countries outside Zimbabwe.

### Auth gating policy (Phase 1D)

The app is **public by default** — weather pages, explore, search, maps, and every read-only weather endpoint stay anonymous-accessible. Auth gates the AI surface and the premium feature pages.

| Surface                                     | Gate            | Mechanism                                                                                                                                                                                                                                                                 |
| ------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/shamwari`                                 | Page-level      | `await requireUser()` at the top of the server component → AuthKit redirects anon users to sign-in                                                                                                                                                                        |
| `/aviation`                                 | Page-level      | `await requireUser()` (METAR/TAF planner + PDF briefings)                                                                                                                                                                                                                 |
| `/history`                                  | Page-level      | `await requireUser()` (historical analysis dashboard)                                                                                                                                                                                                                     |
| `/api/ai/*`                                 | Route-level     | Next.js proxy at `src/app/api/ai/[...path]/route.ts` calls `withAuth()`, 401 if anonymous, otherwise forwards to `/api/py/ai/${path}` with `X-Mukoko-User-Id` + `X-Mukoko-User-Email` headers                                                                             |
| `AISummary` widget on public location pages | Component-level | Receives a `user: AISummaryUser \| null` prop hydrated server-side via `getCurrentUser()` in `/[location]/page.tsx`. Anonymous users see a `.baobab` sign-in CTA (with `.kudu-sm` button → `/auth/signin?returnTo=<current>`). Signed-in users see the summary as before. |
| `AISummaryChat` follow-up                   | Component-level | Same `user` prop; anonymous users see the matching tanzanite-bordered CTA.                                                                                                                                                                                                |

**What is NOT gated** (must remain anonymous): `/`, `/[location]/*`, `/explore`, `/explore/**`, `/api/py/weather`, `/api/py/search`, `/api/py/geo`, `/api/py/locations`, `/api/py/airquality`, `/api/py/metar`, `/api/py/map-tiles/*`, `/api/py/reports` (GET/POST), `/api/py/status`, `/api/py/health`, `/api/py/activities`, `/api/py/suitability`, `/api/py/tags`, `/api/py/regions`, `/api/py/devices`, `/api/og`, `/api/db-init`, `/embed/*`.

**Why a Next.js proxy in front of the Python AI endpoints** — the WorkOS session cookie is encrypted with `WORKOS_COOKIE_PASSWORD` on the Next.js side. Python doesn't have the WorkOS SDK or the cookie crypto, so trying to validate sessions there would either duplicate auth or punch a hole. The proxy is single-source-of-truth: AuthKit decides who's signed in, then forwards a clean request with a user-id header. The underlying `/api/py/ai/*` routes still exist (so Python tests stay simple, and internal callers can hit them directly) but the UI now only ever calls `/api/ai/*`.

**Sign-in returnTo** — `/auth/signin?returnTo=<path>` is honoured by `src/app/auth/signin/route.ts`. The route sanitises the param (rejects `//`-prefixed and absolute URLs to prevent open-redirect abuse), then passes it to `getSignInUrl({ returnTo })` so AuthKit drops the user back where they started after a successful WorkOS exchange.

## Common Patterns

### Adding a location

**Seed locations (code):** Add to the `LOCATIONS` array in `src/lib/locations.ts`. Include accurate GPS coordinates, elevation, province, and relevant tags. Then run `POST /api/db-init` to sync locations to MongoDB.

**Community locations (dynamic):** Users can add locations at runtime via:

1. **Geolocation auto-create** — browser GPS → `/api/py/geo?autoCreate=true` → reverse geocode → create
2. **Search** — `POST /api/py/locations/add` with `{ query }` → forward geocode → pick candidate → create
3. **Coordinates** — `POST /api/py/locations/add` with `{ lat, lon }` → reverse geocode → create

Community locations are stored in the same MongoDB `locations` collection as seed data and are immediately available at `/{slug}`.

### Database (MongoDB Atlas — Nyuchi Platform cluster)

Mukoko-weather sits on the shared **Nyuchi Platform cluster** (27 databases). Mukoko consumes six of them. See `docs/mongodb-schema-map.md` for the full map.

- **Clients:** `src/lib/mongo.ts` (TypeScript, module-scoped, connection-pooled via `@vercel/functions`) and `api/py/_db.py` (Python, module-scoped). One `MongoClient` per process, multiple databases via `.db("...")` / `.get_database("...")`.
- **Operations:** `src/lib/db.ts` (used by `db-init` and OG routes) and `api/py/_db.py` (Python primary — all collection accessors, rate limiting, API key management).

**Platform databases (Phase 0B):**

| DB             | Mukoko collections                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | TS / Python accessors                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `weather`      | weather*cache, ai_summaries, weather_history, ~~locations~~ (dropped Phase 0F — use `places.placesGeo` via `src/lib/places.ts` / `api/py/_places_resolver.py`), activities, activity_categories, suitability_rules, tags, regions, seasons, api_keys, ai_prompts, ai_suggested_rules, weather_reports (legacy), history_analysis, ~~countries~~ (dropped Phase 0G — use `placesGeo.geoType=country`), ~~provinces~~ (dropped Phase 0G — use `placesGeo.geoType=province`), metar_cache, rate_limits, **air_quality_cache** (NEW — 1-h TTL, \_id keyed by `{lat:.4f}*{lon:.4f}`), **airports** (NEW — ICAO aviation reference data, \_id = ICAO code, GeoJSON `location`+ 2dsphere index, seeded from`src/lib/icao-codes.ts`via`syncAirports`), **stations** (NEW), **observations** (NEW), **stationObservations** (NEW), **alerts** (NEW), **communityReports** (NEW) | `weatherDb()` / `weather_db()`           |
| `places`       | **places**, **placesGeo**, **categories**, **routes**, **conditionReports**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `placesDb()` / `places_db()`             |
| `identity`     | **persons**, **credentials**, **activityLog**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `identityDb()` / `identity_db()`         |
| `shamwari`     | **conversations**, **messages**, **guardrails**, **knowledgeBase**, **preferences**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `shamwariDb()` / `shamwari_db()`         |
| `device`       | **devices**, **commands**, **telemetry**, **deviceHistory**, device_profiles (legacy)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `deviceDb()` / `device_db()`             |
| `integrations` | **providers**, **providerConfigurations**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `integrationsDb()` / `integrations_db()` |

**Schema conventions (universal):**

- `_id` is a string (UUID), not ObjectId
- `_schemaVersion: "v3.1"` required (enum-validated)
- `bundu` sub-doc required: `{ countryCode, provinceSlug?, ... }`
- `createdAt` + `updatedAt` required (Dates)
- Strict validators: `validationAction: "error"` — writes fail if shape is wrong
- camelCase collection names for new collections (`communityReports`, not `weather_reports`; `activityLog`, not `activity_log`; `placesGeo`, not `places_geo`)

**Stamping writes:** Use `stampPlatformFields(doc, opts)` (TS) / `stamp_platform_fields(doc, country_code=..., province_slug=...)` (Python) on every insert into a platform-validated collection — they auto-fill `_id`, `_schemaVersion`, `createdAt`, `updatedAt`, and `bundu.countryCode` (+ `provinceSlug` if given), preserving any existing values.

**`placesGeo` writes (Phase 0E):** `places.placesGeo` has its OWN validator that does NOT include a `bundu` field — calling `stamp_platform_fields` on it would fail. Use `api/py/_places_geo.upsert_placesgeo_city()` instead. The helper:

- Builds the doc manually (no `bundu`), uses `_schemaVersion: "v3.2"`, and stamps `sourceProvenance.dataOrigin: "mukoko_user"`.
- **Always dedupes first** via `find_nearby_placesgeo` — 5 km radius, normalised-name match (strips diacritics, road-type suffixes, leading house numbers), scoped by `parentPlaceId` (country \_id). If a match is found, the existing doc is returned with `wasExisting: True` — **no auto-suffixed slug is ever generated**.
- Slugs are `<slugified-name>-<6-char hex>` (e.g. `harare-a1b2c3`). Suffixing with `-2`, `-3`, … is forbidden — slug collisions in `weather.locations` now raise `SlugCollisionError` and surface the existing record as a `mode: "duplicate"` response.

**Fundi search-miss queue (Phase 0E — disabled in Phase 0F):** Previously mukoko ALSO enqueued a POI seed request via `_places_geo.enqueue_fundi_seed()` so the Fundi worker would populate `places.places`. Phase 0F removes this call — POI enrichment is a separate optional concern and is not P0 for mukoko-weather. Re-enable behind a flag like `MUKOKO_ENRICH_POIS_VIA_FUNDI` once the POI surface is actually consumed.

**Location resolution (Phase 0F — `weather.locations` dropped):**

`weather.locations` is **gone**. Every location read/write flows through `places.placesGeo` (admin geography) + `places.places` (POIs from OSM/Fundi) via `src/lib/places.ts`. Mukoko-weather is now a consumer of the platform's canonical geographic data, not a maintainer of a parallel silo.

| Helper (`src/lib/places.ts`)             | Purpose                                                    |
| ---------------------------------------- | ---------------------------------------------------------- |
| `resolveLocationSlug(slug)`              | Clean URL slug → adapted `LocationDoc` via placesGeo       |
| `nearestPlacesGeo(lat, lon, maxKm?)`     | $nearSphere on placesGeo for IP-geo / GPS reverse lookup   |
| `nearestPlace(lat, lon, maxKm?)`         | $nearSphere on `places.places` POIs — tight ≤250 m match   |
| `poiTypeFromPlace(doc)`                  | Extract a single POI type (school/hospital/market/park)    |
| `searchPlaces(query, bbox?)`             | Searches `places.places` POIs for the explore/search flows |
| `adaptPlacesGeoToLocationDoc(doc, hint)` | Adapter — placesGeo doc → legacy `LocationDoc` shape       |

**POI-nearest refinement (create-on-demand):** After a GPS/coords reverse-geocode, `geo_lookup` / `add_location` (`api/py/_locations.py` `_match_nearby_poi` → `_places_geo.find_nearest_place`) query `places.places` for the nearest POI within **≤250 m** (`POI_MATCH_RADIUS_KM`). If a named POI is that close, its name replaces the raw reverse-geocode name (richer + consistent with the platform POI catalog) and its type is stamped onto `sourceProvenance.mukokoPoiType` and surfaced as `poiType` on the location payload (so the location page + AI summary can mention "school", "hospital", "market", "park"). This is deliberately tight — NOT a coarse distance-snap to far-away places. The whole lookup is wrapped in try/except and falls back to the reverse-geocode on any miss, empty result, or missing 2dsphere index. TS mirror: `nearestPlace` / `poiTypeFromPlace` in `src/lib/places.ts`; the adapter surfaces `poiType` from `sourceProvenance.mukokoPoiType`.

Resolution chain for `/harare`:

```
/harare
  → resolveLocationSlug("harare")
       1. placesGeo.sourceProvenance.mukokoSlug = "harare"   ← stamped lookup
       2. LOCATIONS[slug].name = "Harare" → placesGeo by    ← static-seed name lookup
          normalised name (city > town > village)
       3. inferNameFromSlug("nairobi-ke") = "Nairobi" → same ← inference fallback
          name lookup
  → adaptPlacesGeoToLocationDoc(doc, hint)
       lat/lon  ← doc.geo.coordinates
       country  ← doc.isoCode  OR  parentPlaceId → country isoCode
       province ← doc.sourceProvenance.mukokoProvince  OR  static seed
       elevation← doc.sourceProvenance.mukokoElevation OR  static seed
       tags     ← doc.sourceProvenance.mukokoTags      OR  static seed
       slug     ← the requested CLEAN slug (NOT the hash-suffixed platform slug)
```

`src/lib/db.ts → getLocationFromDb(slug)` now delegates straight to `resolveLocationSlug` and packages the response as a `LocationDoc`, so every existing caller (`src/app/[location]/*` server components, sitemap, etc.) keeps working with no changes.

**Create-on-demand:** When a user lands on `/<unknown-slug>` AND the request has lat/lon (IP geo header or GPS), `POST /api/py/locations/add` runs `_reverse_geocode → upsert_placesgeo_city(...)` (Phase 0E helper) which:

- Dedupes via `find_nearby_placesgeo` (5 km radius, normalised-name match, country-scoped) and patches the existing doc with the new `mukokoSlug` / `mukokoTags` / `mukokoNominatimAddress` when it finds one
- Otherwise inserts a fresh placesGeo doc with `sourceProvenance.dataOrigin: "mukoko_user"` plus the mukoko-side metadata stamped into `sourceProvenance.mukoko*`
- Returns `{ placesGeoId, placesGeoSlug, location }` so the caller can redirect

Slugs in `places.placesGeo` are hash-suffixed (`harare-a1b2c3`) — the resolver always bridges the clean mukoko slug to the platform record, never exposes the suffix in URLs.

**Dedup discipline (Phase 0E carried forward):** No auto-suffixed slugs (`-2`, `-3`) ever. When two placesGeo entries share a normalised name within 5 km, the resolver prefers `geoType: city > town > village`, then higher `sourceProvenance.dataConfidence`. The `LOCATIONS` static seed array has globally-unique slugs by construction (tested).

**Static `LOCATIONS` array still ships in code** (`src/lib/locations.ts`) — but **not as a database seed source**. It's the canonical clean-slug → display-name/tags/province/elevation map for the 265 places the app ships with. New community-created entries get those fields via `sourceProvenance.mukoko*` on the placesGeo doc itself.

**Backward compat:** `getDb()` / `get_db()` is aliased to `weatherDb()` / `weather_db()` so existing call sites keep working. Legacy collection accessors (`weather_cache_collection`, `locations_collection`, etc.) now route to the appropriate platform DB internally — no call-site changes required.

**Other notes:**

- Collections use TTL indexes for automatic cache expiration
- Historical weather data is recorded automatically on every fresh API fetch
- Rate limits collection has TTL index on `expiresAt` for automatic cleanup

**Atlas Search (fuzzy text search):**

- `searchActivitiesFromDb(query)` — Atlas Search → `$text` fallback for activities
- Phase 0F: `searchLocationsFromDb` now scans the static `LOCATIONS` seed catalog directly (no Atlas Search). Location text search will be reimplemented against `places.placesGeo` or `places.places` in a follow-up.
- Requires an Atlas Search index named `activity_search` (definitions in `src/lib/db.ts` via `getAtlasSearchIndexDefinitions()`)
- **Time-based recovery:** When a missing-index error is detected (MongoDB code 40324), search is disabled for `ATLAS_RETRY_AFTER_MS` (5 minutes), then automatically retries.

**Vector Search (semantic search — Phase 0F neutralised):**

- `vectorSearchLocations(embedding, options)` returns `[]` and `storeLocationEmbedding*` are no-ops — `weather.locations` is dropped, so there's nowhere to store embeddings.
- Semantic search will be reimplemented against `shamwari.knowledgeBase` (vector-embedded) or `places.places` once an embedding pipeline lands.

**$facet aggregation:**

- `getTagCountsAndStats()` — runs tag counts and location stats in a single aggregation pipeline

### Modifying SEO

- Root metadata: `src/app/layout.tsx`
- Per-location metadata: `src/app/[location]/page.tsx` `generateMetadata()`
- Structured data: JSON-LD in both layout and location page

### Modifying colors

1. Add CSS custom properties in `src/app/globals.css` — both `:root` (light) and `[data-theme="dark"]` (dark) blocks
2. Register in the `@theme inline` block so Tailwind can generate utility classes
3. Use Tailwind classes (`text-frost-severe`, `bg-surface-card`) in components — never hardcoded values
4. Verify APCA contrast ratios using <https://www.myndex.com/APCA/> for both light and dark themes

### Adding translations

1. Add keys to the `messages.en` object in `src/lib/i18n.ts`
2. Use `t("key.path")` in components
3. For interpolation: `t("weather.current", { location: name })`

### Cloudflare Workers (optional edge layer)

The `worker/` directory contains an independent Hono-based API that mirrors the Next.js API routes. It uses Cloudflare KV for caching instead of MongoDB. This is an optional deployment target — the primary deployment is Vercel.

## Removed / Migrated / Renamed Files

The following TypeScript files were **removed** during the Python backend migration:

- `src/lib/circuit-breaker.ts` — circuit breaker resilience (re-implemented in Python as `api/py/_circuit_breaker.py`)
- `src/lib/rate-limit.ts` — rate limiting (replaced by `check_rate_limit` in `api/py/_db.py`)
- `src/lib/geocoding.ts` — geocoding (replaced by Python in `api/py/_locations.py`)
- `src/lib/kv-cache.ts` — KV cache (replaced by MongoDB `src/lib/db.ts`, then migrated to Python)
- `src/types/cloudflare.d.ts` — KV types (no longer needed)
- All TypeScript API routes under `src/app/api/` except `og/` and `db-init/` — replaced by Python endpoints under `api/py/`

The following files were **renamed**:

- `src/lib/locations-africa.ts` → `src/lib/locations-global.ts` — expanded from African cities to include ASEAN countries (imported as `GLOBAL_LOCATIONS`)
