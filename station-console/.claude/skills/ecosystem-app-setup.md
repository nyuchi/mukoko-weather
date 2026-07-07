---
name: ecosystem-app-setup
version: 1.0.0
description: End-to-end setup for a new Bundu/Mukoko ecosystem app
agents: claude-code, cursor, copilot
requires_mcp: false
---

# Setting Up a New Nyuchi-Ecosystem App

Follow this skill when a user wants to start a new app that is part of the Nyuchi ecosystem (mukoko, nyuchi, shamwari, bundu, nhimbe) or an app that consumes the Nyuchi Design System.

## Preferred path — one command

Once @nyuchi/design-cli ships, bootstrapping is a single command:

```bash
npx @nyuchi/design-cli init
```

This scaffolds a Next.js 16 project (Turbopack, pnpm, Node 24) with:

- globals.css pre-populated with the seven African minerals tokens (with role + family)
- components.json pointing at https://mzizi.dev/api/v1/ui
- lib/utils.ts with the cn() helper
- app/layout.tsx wired with the nyuchi-theme-provider
- .claude/skills/ populated with all published Nyuchi skills
- package.json with the right scripts and dependencies

Until @nyuchi/design-cli ships, follow the manual steps below.

## Manual bootstrap (legacy — use until CLI lands)

### 1. Create the Next.js project

```bash
pnpm create next-app@latest my-app --turbopack --typescript --tailwind --app --no-src-dir
cd my-app
```

### 2. Install Nyuchi-compatible dependencies

```bash
pnpm add class-variance-authority clsx tailwind-merge
pnpm add -D @tailwindcss/typography
```

### 3. Scaffold globals.css

Add the seven African minerals tokens at the top of `app/globals.css`:

```css
@layer base {
  :root {
    /* Seven minerals (dark-theme values) — query styling-minerals for canonical light/dark, container, role, family */
    /* deep-earth family */
    --color-cobalt: 0 176 255;         /* Knowledge — Katanga, DRC & Zambia */
    --color-sodalite: 61 90 254;       /* Intelligence — Kunene, Namibia & SA */
    --color-tanzanite: 179 136 255;    /* Identity — Merelani Hills, Tanzania */
    --color-malachite: 100 255 218;    /* Growth — Congo Copper Belt */
    /* hand family */
    --color-gold: 255 215 64;          /* Value — Ghana/SA/Mali/Zimbabwe */
    --color-copper: 255 138 101;       /* Stewardship — Central African Copperbelt */
    --color-terracotta: 225 176 126;   /* Community — Pan-African Sahel */
    
    /* Semantic — query styling-semantic-colors */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: var(--color-cobalt);
    /* ... */
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... */
  }
}
```

Note: these are seed values. Query the live styling-semantic-colors collection for the canonical definitions — the DB is the source of truth.

### 4. Set up components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  },
  "registries": {
    "nyuchi": {
      "url": "https://mzizi.dev/api/v1/ui"
    }
  }
}
```

### 5. Add a component to verify

```bash
pnpm dlx shadcn@latest add https://mzizi.dev/api/v1/ui/nyuchi-theme-provider
pnpm dlx shadcn@latest add https://mzizi.dev/api/v1/ui/button
```

### 6. Wire the theme provider

In `app/layout.tsx`:

```tsx
import { NyuchiThemeProvider } from "@/components/nyuchi-theme-provider"

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NyuchiThemeProvider>
          {children}
        </NyuchiThemeProvider>
      </body>
    </html>
  )
}
```

### 7. Install the Nyuchi skills

```bash
npx skills add nyuchi/design-agent-skills
```

This populates `./.claude/skills/` with `nyuchi-design-system.md`, `scaffold-component.md`, and `ecosystem-app-setup.md` — so any AI assistant working in this repo has the doctrine on hand.

### 8. Verify everything works

```bash
pnpm dev
```

Open http://localhost:3000 and confirm the theme toggle works, the button renders with the mineral-based styling, and Tailwind picks up the CSS variables.

## Ubuntu philosophy alignment

Nyuchi is built on Ubuntu — "I am because we are." When you architect a new app:

- Prefer open source over proprietary
- Build for community, not extraction
- Respect data sovereignty — African data stays on African infrastructure where possible
- Accessibility is not an afterthought; it is the starting point
- Every feature should contribute to collective wellbeing, not just individual efficiency

These aren't marketing claims. They're architectural constraints. If you find yourself designing something that only benefits a small subset of users at others' expense, question whether it belongs in the ecosystem.

## What goes in the ecosystem and what doesn't

The ecosystem has two legal layers — the Bundu Foundation (research lab, standards body, open-source org, AI lab; owns the doctrine, architecture, and token palette) above Nyuchi Africa (the single operating company). Inside Nyuchi Africa sit three pillars and the platform:

- Mukoko — the consumer pillar: the super-app (social, commerce, payments, identity)
- Nyuchi — the commercial/infrastructure pillar and the platform (web services, developer tools, MCP, Honeycomb storage)
- Shamwari AI — the intelligence pillar, sovereign by nature (on-device inference, pod-resident context, no third-party AI vendor)
- Nhimbe — cooperative economic features

Bundu is not an app and not a layer inside a stack; it is the Foundation that governs the ecosystem. Mukoko and Shamwari AI are pillars/products inside Nyuchi Africa, not separate companies.

Not ecosystem apps:
- Any app that extracts value without giving back
- Any app that requires surveillance for its business model
- Any app that centralises what should be federated

If the app you're building doesn't fit the ecosystem, that's fine — use the Nyuchi Design System as a consumer, but don't brand it as ecosystem.
