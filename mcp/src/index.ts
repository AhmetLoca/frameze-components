#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const REPO = "AhmetLoca/frameze-components";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main`;

type RegistryItem = {
  name: string;
  slug: string;
  manifest: string;
  file: string;
  category: string;
};

type Registry = {
  name: string;
  description: string;
  homepage: string;
  items: RegistryItem[];
};

type ComponentManifest = {
  name: string;
  slug: string;
  type: string;
  category: string;
  description: string;
  whenToUse: string;
  framework: string;
  language: string;
  dependencies: string[];
  files: string[];
  props: Record<string, string>;
  designTokens?: Record<string, string>;
  frameze?: {
    id: string;
    marketplaceName: string;
    price: string;
    previewUrl: string;
    buyUrl: string;
  };
};

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${RAW_BASE}/${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

async function fetchText(path: string): Promise<string> {
  const url = `${RAW_BASE}/${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function getRegistry(): Promise<Registry> {
  return fetchJson<Registry>("registry/registry.json");
}

async function getManifest(item: RegistryItem): Promise<ComponentManifest> {
  return fetchJson<ComponentManifest>(item.manifest);
}

const server = new McpServer({
  name: "frameze-components",
  version: "0.1.0",
});

server.tool(
  "search_components",
  "Search the Frameze Framer component registry by keyword. Matches against component name, slug, category, description, and 'when to use' guidance. Returns a summary for each match — call get_component_code with a matching slug to get the full source.",
  {
    query: z
      .string()
      .describe(
        "Free-text search, e.g. 'pricing section', 'hover card', 'particle text', 'stats'",
      ),
  },
  async ({ query }) => {
    const registry = await getRegistry();
    const manifests = await Promise.all(
      registry.items.map((item) => getManifest(item)),
    );

    const q = query.trim().toLowerCase();
    const matches = manifests.filter((m) => {
      const haystack = [
        m.name,
        m.slug,
        m.category,
        m.type,
        m.description,
        m.whenToUse,
      ]
        .join(" ")
        .toLowerCase();
      return q.length === 0 || haystack.includes(q);
    });

    if (matches.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `No components matched "${query}". Full list of available components: ${registry.items
              .map((i) => i.slug)
              .join(", ")}`,
          },
        ],
      };
    }

    const summary = matches
      .map(
        (m) =>
          `## ${m.name} (slug: ${m.slug})\n` +
          `Category: ${m.category} · Type: ${m.type}\n` +
          `${m.description}\n` +
          `When to use: ${m.whenToUse}\n` +
          (m.frameze
            ? `Price: ${m.frameze.price} · Preview: ${m.frameze.previewUrl}\n`
            : ""),
      )
      .join("\n---\n\n");

    return {
      content: [{ type: "text", text: summary }],
    };
  },
);

server.tool(
  "get_component_code",
  "Fetch the full, real Framer component source code (.tsx) for a given component slug from the Frameze registry. Also returns the prop schema from its component.json manifest.",
  {
    slug: z
      .string()
      .describe(
        "The component's slug, e.g. 'animated-stats' or 'particle-text-pro'. Use search_components first if you don't know the exact slug.",
      ),
  },
  async ({ slug }) => {
    const registry = await getRegistry();
    const item = registry.items.find((i) => i.slug === slug);

    if (!item) {
      return {
        content: [
          {
            type: "text",
            text: `No component with slug "${slug}". Available slugs: ${registry.items
              .map((i) => i.slug)
              .join(", ")}`,
          },
        ],
        isError: true,
      };
    }

    const [manifest, code] = await Promise.all([
      getManifest(item),
      fetchText(item.file),
    ]);

    const propsTable = Object.entries(manifest.props)
      .map(([key, desc]) => `- \`${key}\`: ${desc}`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text:
            `# ${manifest.name}\n\n${manifest.description}\n\n` +
            `**When to use:** ${manifest.whenToUse}\n\n` +
            `**Props:**\n${propsTable}\n\n` +
            `**Source (${item.file}):**\n\n\`\`\`tsx\n${code}\n\`\`\``,
        },
      ],
    };
  },
);

server.tool(
  "list_design_tokens",
  "Return the Frameze paper/ink/glass design token system (colors, theme pairs, and the signature motion easing curve) used across Frameze components. Use this to generate visually-consistent variants or new components matching the Frameze style.",
  {},
  async () => {
    const tokens = await fetchText("registry/design-tokens.json");
    return {
      content: [{ type: "text", text: tokens }],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("frameze-mcp fatal error:", err);
  process.exit(1);
});
