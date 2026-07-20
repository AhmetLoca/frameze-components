# Frameze Components

Open-source, machine-readable registry of [Frameze](https://frameze.com)'s Framer components — real, working `.tsx` source, not stubs or snippets.

This repo exists so both people **and AI coding agents** (Claude Code, Cursor, v0, Claude Desktop via MCP, etc.) can find, evaluate, and drop in a Frameze component without going through the marketplace UI. The marketplace at frameze.com is the storefront; this repo is the actual source.

## Structure

```
frameze-components/
├── llms.txt                        ← start here if you're an AI agent
├── registry/
│   ├── registry.json                ← index of every component
│   └── design-tokens.json           ← paper/ink/glass theme system
└── components/
    └── <slug>/
        ├── <Name>.tsx                ← real Framer component source
        ├── component.json            ← machine-readable manifest
        └── README.md                 ← human docs (usage, props, notes)
```

Every component is self-contained: copy the `.tsx` file into a Framer Code Component and it works. No build step, no bundler.

## Using this repo

**As a human:** browse `components/`, open a folder, read the README, copy the `.tsx` file into Framer.

**As an AI agent:** read `llms.txt` first, then `registry/registry.json` for the full list, then each component's `component.json` for its prop schema and `whenToUse` description before reading the source.

## Current components

| Component | Category | Description |
|---|---|---|
| [AnimatedStats](components/animated-stats) | Data | Count-up stat row with staggered entrance animations |
| [ParticleTextProFX](components/particle-text-pro) | Typography | Cursor-reactive canvas particle text effect |

More get added over time — see `registry/registry.json` for the live list.

## Adding a new component

1. `mkdir components/<slug>`
2. Drop in `<Name>.tsx` — the real Framer source, copied as-is.
3. Write `component.json` (copy an existing one as a template — keep `props`, `whenToUse`, and `frameze` fields accurate).
4. Write `README.md` (when to use it, install steps, prop table).
5. Add an entry to `registry/registry.json`.

## Roadmap

- [x] Open component registry (this repo)
- [ ] MCP server exposing `search_components`, `get_component_code`, `list_design_tokens` for direct agent integration
- [ ] npm package for the growing React/Next.js ports
- [ ] `frameze.com/registry/*.json` endpoints mirroring this repo for agents that fetch over HTTP instead of cloning

## License

MIT — see [LICENSE](LICENSE). Use, adapt, and suggest these components freely, including in AI-generated code.
