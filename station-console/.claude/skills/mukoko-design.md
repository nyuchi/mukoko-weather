# Mukoko — _The Swarm_

The visual identity for **Mukoko**, the hive at the centre of the Nyuchi ecosystem. Every asset
here is generated from the live tokens in `nyuchi_design_db → styling-minerals` (doctrine **v4.1.0**).
**The database is the source of truth**, not this folder — if the palette shifts, re-pull and regenerate.

## The idea (the meaning, say it right)

The mark is the **Seed of Life** — one centre cell ringed by six, the first complete ring of the
honeycomb — rendered in the **seven African Minerals**:

> **Tanzanite at the core** (Mukoko, the brand), ringed by the six minerals of the ecosystem.
> One hive holding the whole. **Ndiri nekuti tiri** — _I am because we are._

It is a _known_ geometric figure (like the Audi or Olympic rings), made ours through the mineral
palette and the meaning. Symmetry of form; distinctiveness through colour and story. **nyuchi is the
bee; mukoko is the hive** — so Mukoko's hero mark is the hive/cluster, never a bee (that's Nyuchi's).

## The seven minerals

| Mineral       | Light     | Dark      | Meaning                 | Role                  |
| ------------- | --------- | --------- | ----------------------- | --------------------- |
| cobalt        | `#0047AB` | `#00B0FF` | digital future, trust   | CTAs, links           |
| **tanzanite** | `#4B0082` | `#B388FF` | premium, connection     | **brand / core cell** |
| malachite     | `#004D40` | `#64FFDA` | growth, success         | positive actions      |
| gold          | `#5D4037` | `#FFD740` | honey, rewards          | achievements          |
| terracotta    | `#A0522D` | `#E1B07E` | earth, community        | community             |
| sodalite      | `#283593` | `#3D5AFE` | intelligence, depth     | AI / Shamwari         |
| copper        | `#BF5A36` | `#FF8A65` | connection, stewardship | Bundu / commons       |

Use `light` on light surfaces, `dark` on dark. Full machine-readable values (containers + on-containers)
are in `tokens/minerals.json`; drop-in CSS custom properties are in `tokens/minerals.css`.

**Ring order** (clockwise from top): `cobalt → gold → malachite → copper → sodalite → terracotta`,
**tanzanite** in the centre. This alternates cool/warm for visual balance — a design decision, not a
law. If positions are ever assigned meaning, regenerate from the geometry script.

## Assets in this skill

```
logo/mark/        full-palette mark (light/dark, SVG + PNG) + mono/ (7 minerals × light|dark SVG)
logo/lockup/      mark + lowercase `mukoko` serif wordmark (light/dark, SVG + PNG)
app-icon/         primary (full palette on deep tanzanite), paper, mono-tanzanite knockout (SVG + 1024 PNG)
favicon/          MONO tanzanite mark, legible small (SVG + 16/32/48/180 PNG)
backgrounds/      honeycomb grain (paper), tanzanite header band, stone splash 1080×1920, full-mineral pattern
tokens/           minerals.json (source for native tokens) + minerals.css (web, auto dark-mode)
BRAND-GUIDE.md    the full written guide (meaning, manifest, usage, do/don't)
```

## Rules for using the mark

- **Default to the full-palette mark at ≥32px** (headers, About screens, decks, profile images, merch).
- **Below 32px use the mono favicon** — the seven hues fuse small; the single-mineral version stays crisp. This is why the favicon ships mono tanzanite.
- **Mono variants** let one app/surface/sub-brand wear a single mineral (Shamwari→sodalite, community→terracotta, success→malachite). Shape constant; only colour changes.
- **Clear space** = one cell-radius on all sides. **Min size:** 24px full mark, 16px mono favicon.
- **App icon default** = `app-icon/mukoko-appicon-primary` (full palette on deep tanzanite `#1A0033`).
- **Wordmark:** Noto Serif 600, **lowercase always** (`mukoko`, never `Mukoko`/`MUKOKO`). UI = Noto Sans; code/labels = JetBrains Mono.

## Do / don't

**Do** — use the supplied SVGs; flip light/dark mineral values to the surface; use mono variants to signal context; give the mark room.
**Don't** — add gradients/shadows/glows/outlines; recolour petals off-palette or reorder the ring arbitrarily; rotate, stretch or rearrange cells; capitalise the wordmark; use the full-palette mark below 32px.

## Regenerating

All assets are deterministic from the minerals tokens. Re-pull `styling-minerals` from the DB and
rebuild the cluster (core + six petals at edge-normal angles `30 + 60·i`, distance `√3·r + gap`,
sharing true edges) so geometry, ring order and exports stay reproducible.

## If invoked with no other guidance

Ask what's needed (logo export? app icon? social/launch asset? splash? a new surface wearing a
mineral?), confirm light vs dark surface, then produce the asset using the files here — or regenerate
from tokens for a size/format not already exported.

_Mukoko — the hive that holds the whole._