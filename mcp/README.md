# frameze-mcp

An MCP (Model Context Protocol) server exposing the [Frameze](https://frameze.com) Framer component registry to AI coding agents — Claude Code, Claude Desktop, Cursor, and anything else that speaks MCP.

It doesn't bundle any component data itself: every call fetches live from `raw.githubusercontent.com/AhmetLoca/frameze-components`, so it always reflects whatever is currently in the [registry](../registry/registry.json) — no redeploy needed when a new component is added.

## Tools

| Tool | Description |
|---|---|
| `search_components(query)` | Free-text search across name, category, description, and "when to use" guidance. Returns a summary per match. |
| `get_component_code(slug)` | Returns the full real `.tsx` source for a component, plus its prop table. |
| `list_design_tokens()` | Returns the paper/ink/glass theme system (colors + motion easing) used across Frameze components. |

## Install

### Claude Code

```
claude mcp add frameze -- npx -y frameze-mcp
```

(Once published to npm — see below. Until then, use the local path method.)

### Claude Code / Claude Desktop / Cursor — from source

Clone this repo, build the server, then point your MCP config at the built file:

```
git clone https://github.com/AhmetLoca/frameze-components.git
cd frameze-components/mcp
npm install
npm run build
```

Add to your MCP config (`~/.claude/mcp.json` for Claude Code, or the equivalent for your tool):

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

Restart your tool. Ask it something like *"find a Frameze component for a pricing section"* — it should call `search_components` on its own.

## Development

```
npm install
npm run dev    # tsc --watch
npm run build  # one-off build
```

No API keys or auth required — it only reads public raw GitHub content.
