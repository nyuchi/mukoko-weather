---
name: scaffold-component
version: 1.0.0
description: How to scaffold a new Nyuchi component correctly
agents: claude-code, cursor, copilot, cline
requires_mcp: true
---

# Scaffolding a Nyuchi Component

Follow this workflow whenever you are creating a new component in the Nyuchi Design System. The system is DB-first: production source lives in components.source_code, not in the file system. The frontend pulls from the DB at build time.

## Step 1 — Decide the node

Use the Node Decision Guide:

- N1 Tokens — CSS value, spacing, colour, motion, radius (goes in a styling-* collection, not components)
- N2 Primitive — generic UI (button, card, input, dialog, toolbar, bento-grid)
- N3 Brand — Nyuchi-branded composition with mineral palette and harness integration
- N4 Safety — conditional-rendering gate (permission, geo, rate limit)
- N5 Resilience — error boundary, skeleton, offline banner, fallback chain
- N6 Page — full-screen layout composition
- N7 Shell — app container (navigation, routing, lifecycle)
- N8 Assurance — instrumentation, a11y audit, RTL conformity, probes
- N9 Fundi — automated healing
- N10 Documentation — docs, AI instructions, docs infrastructure

If you are unsure, query the MCP: `get_node_categories(N)` shows what lives in each node.

## Step 2 — Register in component_documents with status=alpha

`public.components` is a **read-only view** projected from the `component_documents` base table — you cannot INSERT or UPDATE it. Author by writing a row to `component_documents`; the view reflects it automatically.

```sql
INSERT INTO component_documents (collection, name, node, owner, document)
VALUES (
  'primitives',              -- collection: primitives | brand | pages | shell | safety | resilience | observability | fundi | documentation
  'your-component-name',
  2,                         -- ecosystem node (1-10); matches the collection
  'mzizi',                   -- owner: mzizi | nyuchi | bundu | framework
  jsonb_build_object(
    'name',         'your-component-name',
    'node',         2,
    'collection',   'primitives',
    'owner',        'mzizi',
    'nodeLabel',    'primitive',     -- primitive/brand/safety/resilience/pages/shell/assurance/fundi/documentation
    'category',     'layout',        -- e.g. layout, form, feedback, navigation, conformity
    'status',       'alpha',         -- alpha until source is production-ready, then stable
    'dnaRole',      'core',          -- core | shipped | swappable | genetic-code | machinery | documentation
    'model',        'mzizi-dna-helix',
    'framework',    'react',
    'runtimeLang',  'typescript',
    'platforms',    jsonb_build_array('web'),
    'description',  'Short description of what it does',
    'doctrineVersion','4.1.7',
    'source_code',  '',              -- filled in Step 3
    'urls', jsonb_build_object(
      'portal',     'https://mzizi.dev/components/your-component-name',
      'api',        'https://mzizi.dev/api/components/your-component-name',
      'health',     'https://mzizi.dev/api/health/your-component-name',
      'source',     'https://mzizi.dev/source/your-component-name',
      'changelog',  'https://mzizi.dev/changelog/your-component-name',
      'playground', 'https://mzizi.dev/playground/your-component-name'
    )
  )
);
```

The composite primary key is `(collection, name)`. `dna_role` and `schema_version` are derived from the document's `dnaRole` / `_schemaVersion`. Portal URLs stay on `mzizi.dev` (the registry/portal host); the MCP endpoint is `mcp.mzizi.dev/mcp`.

## Step 3 — Write the source

Once registered, write the production source into the document's `source_code` field via SQL — never to the read-only `components` view. Follow the enterprise criteria for the chosen node:

```sql
UPDATE component_documents
SET document = jsonb_set(document, '{source_code}', to_jsonb($$ ...your TSX source... $$::text), true)
WHERE collection = 'primitives' AND name = 'your-component-name';
```

### N2 Primitive checklist

- No useNyuchiHarness import
- data-slot attribute on root element
- data-portal attribute pointing to mzizi.dev/components/{name}
- cn() for className composition
- No raw Tailwind colours — use semantic tokens (bg-primary, text-foreground, etc.)
- Icons from @/lib/icons, never lucide-react directly
- Touch targets follow styling-touch-targets (48px minimum)
- If pill-shaped category (button, input, avatar, badge, toggle), use borderRadius 9999

### N3 Brand checklist

- nyuchi- prefix on the name
- useNyuchiHarness hook with full destructure { log, motion, LiveRegion }
- animStyle with motion.prefersReduced check
- ARIA role or aria-label
- data-slot and data-portal attributes
- focus-visible ring on interactive elements
- min-h-[48px] touch targets on buttons (styling-touch-targets.comfortable)
- I18N via Intl formatters for dates, numbers, currency
- Semantic tokens for status-bearing colours

### N6 Page checklist

- Pure composition — no inline buttons, cards, or SVGs
- Accept children/slots for content
- Semantic CSS vars only (bg-card, text-foreground, bg-primary)
- Loading state prop
- role="main" and aria-label

### N8 Assurance checklist

- TypeScript module exporting typed functions and React hooks
- Banner comment identifying node and purpose
- Configurable rules array
- Optional onViolation/onComplete callbacks
- React hook variant for continuous monitoring

## Step 4 — Add docs and demos

Docs and demos are fields **inside** the same `component_documents` row — not separate tables. Merge them into the document:

```sql
UPDATE component_documents
SET document = document || jsonb_build_object(
  'use_cases', jsonb_build_array('Use case 1', 'Use case 2'),
  'variants',  jsonb_build_array('default', 'sm', 'lg'),
  'features',  jsonb_build_array('cn() for className composition', 'data-slot attribute'),
  'a11y',      jsonb_build_array('Accessibility feature'),
  'demo',      jsonb_build_object('has_demo', true, 'demo_type', 'interactive')
)
WHERE collection = 'primitives' AND name = 'your-component-name';
```

## Step 5 — Flip status to stable

Once the source is production-ready and has been dogfooded somewhere:

```sql
UPDATE component_documents
SET document = jsonb_set(document, '{status}', '"stable"')
WHERE collection = 'primitives' AND name = 'your-component-name';

SELECT log_version('your-component-name', 'promoted', 'Promoted from alpha to stable', 'your-handle');
```

## Step 6 — Validate accessibility

If your component introduces a new colour pair, validate before shipping:

```sql
SELECT calculate_contrast_ratio('#FFFFFF', '#0047AB');
-- Returns the WCAG 2.1 contrast ratio. AA 4.5, AAA 7.0.
```

For systematic pair tracking look at styling-accessibility-checks — critical pairs have a row with computed ratio and colour-blindness safety flags.

## What to avoid

- Never store component source in the file system if it's meant to be distributed via the registry. The DB is canonical.
- Never hardcode hex colour values (except documented third-party brands like Ethereum, Google, EcoCash).
- Never use lucide-react directly — go through @/lib/icons.
- Never use margin-left / padding-right / left — use logical properties (margin-inline-start etc.) for RTL support.
- Never bump major version without architectural redesign. 4.0.x is internal patches, 4.1.0 is first public release, 5.0.0 reserved for redesign.
