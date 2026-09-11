> **Doctrine v4.1.0.** The source of truth for all tokens is the live database
> `nyuchi_design_db → component_documents` (and its mirror `globals.css` / `colors_and_type.css`).
> Pull live before assuming — the palette and scales evolve faster than this file.
> **Last verified (this revision):** minerals, heritage anchors, radius scale. Typography, spacing,
> semantic colors, motion, shadow and z-index were **not** re-verified in this pass — confirm against the DB if precision matters.

Read the `README.md` file within this skill, and explore the other available files. Key entry points:

- `README.md` — brand context, content fundamentals, visual foundations, iconography.
- `colors_and_type.css` — canonical CSS tokens (light + dark). Always `@import` this rather than hard-coding hex values. **Note:** refresh against the live DB for the two newest minerals (sodalite, copper) and the heritage anchors if the local file predates doctrine v4.1.0.
- `assets/` — brand marks. **nyuchi** = the bee (worker / infrastructure). **mukoko** = the hive. Mukoko's current mark is **the Swarm** (seven-mineral Seed-of-Life cluster) — see the dedicated `mukoko-design` skill. Use the light mark on dark surfaces and vice versa.
- `preview/` — reference cards for type, colors, spacing, components, brand.
- `ui_kits/mukoko/` — React/JSX super-app UI kit with a working click-through prototype.

## Rules that are non-negotiable

- **Lowercase wordmarks** — `mukoko`, `nyuchi`, `bundu`, `shamwari`, `nhimbe`, `bushtrade` — always.
- **Seven African Minerals** (geological, the core palette). Pull from `--color-<name>` / `--container-<mineral>` / `--on-container-<mineral>`:
  - `cobalt` — primary blue, links, CTAs · digital future, trust
  - `tanzanite` — **mukoko's brand mineral**, social features · premium, connection
  - `malachite` — success states, positive actions · growth
  - `gold` — achievements, rewards, highlights · honey, warmth
  - `terracotta` — community features · earth, grounding
  - `sodalite` — **AI / Shamwari surfaces, deep-reasoning states** · intelligence, depth _(added v4.1.0)_
  - `copper` — **Bundu ecosystem identity, the commons** · connection, stewardship _(added v4.1.0)_
- **Seven Heritage tones (indigo, savanna, baobab, sunset, river, hematite, kalahari) — legacy note superseded; see styling-heritage-colors. Former text: Two Heritage anchors** (atmospheric neutrals, mini-app surfaces & backgrounds): `hematite` (#546E7A / #90A4AE, neutral anchor) and `kalahari` (#C9B589 / #E8D9B5, warm light anchor). _(The earlier "Five Heritage / Ten Colors of Africa" framing is retired.)_
- **Each brand owns a mineral** (`styling-ecosystem`, verified v4.1.0): bundu→**copper**, nyuchi→**gold**, mukoko→**tanzanite**, shamwari→**sodalite**, nhimbe/campfire/novels/health→malachite, lingo/planner→cobalt, bushtrade/places/transport/wallet→gold, bytes/pulse→tanzanite, circles→terracotta. Theme a surface in its brand's mineral — never default everything to tanzanite.
- **Buttons are ALWAYS pill** (`rounded-full` → `--radius-full`, 9999px). Inputs match buttons visually.
- **Button height 56px** (sm 48px). **Input height 48px** (sm 40px). Min touch target 48px. Badges are 20px tall.
- **Radius scale is named** (px): `none` 0 · `xs` 4 · `sm` 7 · `md` 12 · `lg` 14 (**DEFAULT** cards/panels) · `xl` 17 · `2xl` 24 · `full` 9999 (pills). Checkboxes use `sm`(7), inputs/small cards `md`(12), cards/panels `lg`(14), modals/sheets/dialogs/tabs `xl`(17), hero cards `2xl`(24). Reference via `--radius-<name>`.
- **H1–H3 are Noto Serif. H4+ and body are Noto Sans. Code is JetBrains Mono.**
- **Rings over shadows.** Cards get `ring-1` of `--border`, not a drop shadow.
- **No gradients, no glassmorphism** except sticky chrome (`backdrop-blur`).
- **Emoji only as mini-app identifiers**, never as chrome or body decoration.
- **Status colors are NOT minerals.** Use `--status-success` (#22C55E), `--status-warning` (#F59E0B), `--status-error` (#EF4444), `--status-info` (#3B82F6) — universal accessibility-first. Severity scale (`--severity-low/moderate/high/severe/extreme/cold`) and connection (`--connection-online/syncing/cached/offline`) follow the same logic. Verification tiers are the only place minerals carry status meaning (community→malachite, otp→cobalt, government→tanzanite, licensed→gold).
- **Surfaces (April 2026 AAA refresh):** light mode — `--background` warm paper, `--card` pure white, `--muted` cream, `--overlay` white. Dark mode — `--background` warm stone L10%, `--card` L6% (darker than bg), `--muted` L2% (deepest), `--overlay` L14% (lighter than bg, scrim creates pop).
- **Mukoko's mark is the Swarm** — a seven-mineral Seed-of-Life cluster (tanzanite core, six minerals ringed around it). Full-palette at ≥32px; mono single-mineral version below that. Full kit + rules live in the `mukoko-design` skill.
- **Lucide React** for UI icons (or the Lucide CDN JS build for HTML prototypes).
- **APCA 3.0 AAA contrast** on both primary and secondary text on every surface.

## When creating visual artifacts

Copy assets out of this skill and create static HTML files for the user to view. `@import` `colors_and_type.css` at the top of every HTML file. For phone prototypes copy the structure from `ui_kits/mukoko/index.html`. For slide decks use the MineralStrip accent and serif display type.

## When working on production code

Install upstream components with the shadcn CLI — never hand-roll copies:

```bash
npx shadcn@latest add https://design.nyuchi.com/api/v1/ui/<name>
```

Read the rules in `README.md` to become an expert in designing with this brand. Pull CSS variables from the upstream `globals.css` (mirrored in `colors_and_type.css`); refresh the mineral/heritage/radius tokens from the live DB if the mirror predates v4.1.0.

## If invoked with no other guidance

Ask what the user wants to build or design (marketing page? a new mini-app for mukoko? a deck? a component?), ask what surface (mobile / desktop / print / slide), ask which brand voice (bundu / nyuchi / mukoko / shamwari / nhimbe), then act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
