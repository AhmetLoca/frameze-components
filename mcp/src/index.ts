#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const REPO = "AhmetLoca/frameze-components";
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main`;

type RegistryItem = {
  name: string;
  slug: string;
  category: string;
  // Present only for the small set of components with real, open-source
  // code checked into this repo (see manifest/file below).
  manifest?: string;
  file?: string;
  // Present on every item — inline metadata pulled from the live Frameze
  // catalog. Used directly when there's no manifest to fetch.
  description?: string;
  price?: string;
  previewUrl?: string;
  buyUrl?: string;
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

// A normalized view of an item, whether its detail came from a fetched
// component.json manifest or straight from the registry's inline fields.
type ResolvedItem = {
  name: string;
  slug: string;
  category: string;
  description: string;
  whenToUse?: string;
  price?: string;
  previewUrl?: string;
  buyUrl?: string;
  hasSource: boolean;
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

async function resolveItem(item: RegistryItem): Promise<ResolvedItem> {
  if (item.manifest) {
    const manifest = await fetchJson<ComponentManifest>(item.manifest);
    return {
      name: manifest.name,
      slug: manifest.slug,
      category: manifest.category,
      description: manifest.description,
      whenToUse: manifest.whenToUse,
      price: manifest.frameze?.price ?? item.price,
      previewUrl: manifest.frameze?.previewUrl ?? item.previewUrl,
      buyUrl: manifest.frameze?.buyUrl ?? item.buyUrl,
      hasSource: Boolean(item.file),
    };
  }

  return {
    name: item.name,
    slug: item.slug,
    category: item.category,
    description: item.description ?? `${item.name} — a Frameze component.`,
    price: item.price,
    previewUrl: item.previewUrl,
    buyUrl: item.buyUrl,
    hasSource: false,
  };
}

const server = new McpServer({
  name: "frameze-components",
  version: "0.2.0",
});

server.tool(
  "search_components",
  "Search the full Frameze Framer component catalog by keyword — every category (hero, gallery, testimonial, pricing, forms, etc.), not just the open-source demo items. Matches against name, slug, category, and description. Returns a summary with price and links for each match. Only a couple of items have real source available (see 'hasSource') — call get_component_code with a matching slug either way; it returns source when available and a buy link otherwise.",
  {
    query: z
      .string()
      .describe(
        "Free-text search, e.g. 'pricing section', 'hover card', 'particle text', 'testimonial slider', 'gallery'",
      ),
    category: z
      .string()
      .optional()
      .describe(
        "Optional exact category filter, e.g. 'Gallery', 'Testimonial', 'Hero', 'Forms'",
      ),
  },
  async ({ query, category }) => {
    const registry = await getRegistry();
    const q = query.trim().toLowerCase();
    const cat = category?.trim().toLowerCase();

    const candidates = registry.items.filter((item) => {
      const matchesCategory = !cat || item.category.toLowerCase() === cat;
      if (!matchesCategory) return false;
      const haystack = [item.name, item.slug, item.category, item.description]
        .join(" ")
        .toLowerCase();
      return q.length === 0 || haystack.includes(q);
    });

    if (candidates.length === 0) {
      const categories = [...new Set(registry.items.map((i) => i.category))]
        .sort()
        .join(", ");
      return {
        content: [
          {
            type: "text",
            text: `No components matched "${query}"${cat ? ` in category "${category}"` : ""}. Available categories: ${categories}`,
          },
        ],
      };
    }

    const resolved = await Promise.all(candidates.map(resolveItem));

    const summary = resolved
      .map(
        (m) =>
          `## ${m.name} (slug: ${m.slug})\n` +
          `Category: ${m.category}${m.price ? ` · Price: ${m.price}` : ""}${m.hasSource ? " · Source: available" : ""}\n` +
          `${m.description}\n` +
          (m.whenToUse ? `When to use: ${m.whenToUse}\n` : "") +
          (m.previewUrl ? `Preview: ${m.previewUrl}\n` : "") +
          (m.buyUrl ? `Buy: ${m.buyUrl}\n` : ""),
      )
      .join("\n---\n\n");

    return {
      content: [{ type: "text", text: summary }],
    };
  },
);

server.tool(
  "get_component_code",
  "Fetch details for a Frameze component by slug. Returns the real Framer source (.tsx) for the handful of open-source demo components. For every other catalog item (the paid Frameze marketplace), returns its description and buy/preview links instead, since source isn't public for those.",
  {
    slug: z
      .string()
      .describe(
        "The component's slug, e.g. 'animated-stats', 'particle-text-pro', or any catalog slug returned by search_components.",
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
            text: `No component with slug "${slug}". Use search_components to find a valid slug.`,
          },
        ],
        isError: true,
      };
    }

    if (!item.file || !item.manifest) {
      const resolved = await resolveItem(item);
      return {
        content: [
          {
            type: "text",
            text:
              `# ${resolved.name}\n\n${resolved.description}\n\n` +
              `No public source is available for this component — it's part of the paid Frameze catalog.\n` +
              (resolved.price ? `Price: ${resolved.price}\n` : "") +
              (resolved.previewUrl ? `Preview: ${resolved.previewUrl}\n` : "") +
              (resolved.buyUrl ? `Buy: ${resolved.buyUrl}\n` : ""),
          },
        ],
      };
    }

    const [manifest, code] = await Promise.all([
      fetchJson<ComponentManifest>(item.manifest),
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
  "list_categories",
  "List every component category in the Frameze catalog with item counts — use this to see the full taxonomy before searching.",
  {},
  async () => {
    const registry = await getRegistry();
    const counts = new Map<string, number>();
    for (const item of registry.items) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    const lines = [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([cat, count]) => `- ${cat}: ${count}`)
      .join("\n");

    return {
      content: [{ type: "text", text: lines }],
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
