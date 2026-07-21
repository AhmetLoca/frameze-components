# frameze-mcp

An MCP (Model Context Protocol) server exposing the [Frameze](https://frameze.com) Framer component registry to AI coding agents — Claude Code, Claude Desktop, Cursor, and anything else that speaks MCP.

It doesn't bundle any component data itself: every call fetches live from `raw.githubusercontent.com/AhmetLoca/frameze-components`, so it always reflects whatever is currently in the [registry](../registry/registry.json) — no redeploy needed when a new component is added.

The registry covers the full Frameze catalog — every category (Hero, Gallery, Testimonial, Pricing, Forms, and 25+ more), not just a couple of demo items. Only `animated-stats` and `particle-text-pro` have real open-source `.tsx` code checked in; every other entry is searchable metadata (description, category, price, preview and buy links) pointing back to the live marketplace, since the rest is paid, licensed component code.

## Tools

| Tool | Description |
|---|---|
| `search_components(query, category?)` | Free-text search across the whole catalog — name, category, description. Optional exact `category` filter. Returns price, links, and whether source is available per match. |
| `get_component_code(slug)` | Returns real `.tsx` source for the open-source demo components; for everything else, returns the description plus preview/buy links instead. |
| `list_categories()` | Lists every category in the catalog with item counts. |
| `list_design_tokens()` | Returns the paper/ink/glass theme system (colors + motion easing) used across Frameze components. |

## Install

Published on npm as [`frameze-mcp`](https://www.npmjs.com/package/frameze-mcp).

### Claude Code

```
claude mcp add frameze -- npx -y frameze-mcp
```

### Claude Desktop / Cursor / other MCP clients

Add to your MCP config:

```json
{
  "mcpServers": {
    "frameze": {
      "command": "npx",
      "args": ["-y", "frameze-mcp"]
    }
  }
}
```

Restart your tool. Ask it something like *"find a Frameze component for a pricing section"* — it should call `search_components` on its own.

### From source (for development)

```
git clone https://github.com/AhmetLoca/frameze-components.git
cd frameze-components/mcp
npm install
npm run build
```

Then point your MCP config at the built file instead of `npx`:

```json
{
  "mcpServers": {
    "frameze": {
      "command": "node",
      "args": ["/absolute/path/to/frameze-components/mcp/dist/index.js"]
    }
  }
}
```

## Development

```
npm install
npm run dev    # tsc --watch
npm run build  # one-off build
```

No API keys or auth required — it only reads public raw GitHub content.
