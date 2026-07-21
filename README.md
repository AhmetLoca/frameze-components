# Frameze Components

Machine-readable registry of [Frameze](https://frameze.com)'s full Framer component catalog — every category, searchable by name, category, and description, with price and buy links for each item. A couple of components (`animated-stats`, `particle-text-pro`) are included as real, working open-source `.tsx` demos; the rest of the catalog is paid, licensed component code, so the registry points to it rather than including it.

This repo exists so both people **and AI coding agents** (Claude Code, Cursor, v0, Claude Desktop via MCP, etc.) can discover and evaluate a Frameze component — across the whole catalog, not just the open demos — without going through the marketplace UI. The marketplace at frameze.com is the storefront; this repo is the discovery layer.

## Structure

```
frameze-components/
├── llms.txt                        ← start here if you're an AI agent
├── registry/
│   ├── registry.json                ← index of every component
│   └── design-tokens.json           ← paper/ink/glass theme system
├── mcp/                             ← MCP server for Claude Code / Cursor / Claude Desktop
└── components/
    └── <slug>/
        ├── <Name>.tsx                ← real Framer component source
        ├── component.json            ← machine-readable manifest
        └── README.md                 ← human docs (usage, props, notes)
```

Every component is self-contained: copy the `.tsx` file into a Framer Code Component and it works. No build step, no bundler.

## Using this repo

**As a human:** browse `components/`, open a folder, read the README, copy the `.tsx` file into Framer.

**As an AI agent:** read `llms.txt` first, then `registry/registry.json` for the full list, then each component's `component.json` for its prop schema and `whenToUse` description before reading the source. Or, if your tool supports MCP, connect to the [`frameze` MCP server](mcp) and call `search_components` directly — see `mcp/README.md` for setup.

## Current components

The registry currently covers **119 components across 29 categories** — Hero, Gallery, Testimonial, Pricing, Forms, Card, Carousels, and more. Two have real open-source code checked into this repo:

| Component | Category | Description |
|---|---|---|
| [AnimatedStats](components/animated-stats) | Data | Count-up stat row with staggered entrance animations |
| [ParticleTextProFX](components/particle-text-pro) | Typography | Cursor-reactive canvas particle text effect |

Every other entry in `registry/registry.json` is metadata only — description, price, preview and buy links back to frameze.com. See `registry/registry.json` for the full, current list, or use the MCP server's `search_components` / `list_categories` tools to query it.

## Adding a new component

1. `mkdir components/<slug>`
2. Drop in `<Name>.tsx` — the real Framer source, copied as-is.
3. Write `component.json` (copy an existing one as a template — keep `props`, `whenToUse`, and `frameze` fields accurate).
4. Write `README.md` (when to use it, install steps, prop table).
5. Add an entry to `registry/registry.json`.

## Roadmap

- [x] Open component registry (this repo)
- [x] [MCP server](mcp) exposing `search_components`, `get_component_code`, `list_categories`, `list_design_tokens` for direct agent integration
- [x] Registry expanded to the full catalog (119 components, 29 categories), not just the open-source demos
- [x] Published as [`frameze-mcp`](https://www.npmjs.com/package/frameze-mcp) on npm — installable via `npx frameze-mcp`
- [ ] npm package for the growing React/Next.js ports
- [ ] `frameze.com/registry/*.json` endpoints mirroring this repo for agents that fetch over HTTP instead of cloning

## License

MIT — see [LICENSE](LICENSE). Use, adapt, and suggest these components freely, including in AI-generated code.
