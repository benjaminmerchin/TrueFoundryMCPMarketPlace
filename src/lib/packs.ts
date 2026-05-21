export type McpTool = {
  id: string;
  name: string;
  category: string;
};

export type Pack = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  tools: McpTool[];
};

export const ALL_TOOLS: Record<string, McpTool> = {
  github: { id: "github", name: "GitHub", category: "dev" },
  slack: { id: "slack", name: "Slack", category: "comms" },
  notion: { id: "notion", name: "Notion", category: "docs" },
  linear: { id: "linear", name: "Linear", category: "project" },
  websearch: { id: "websearch", name: "Web Search", category: "research" },
  arxiv: { id: "arxiv", name: "Arxiv", category: "research" },
  gdrive: { id: "gdrive", name: "Google Drive", category: "docs" },
  gmail: { id: "gmail", name: "Gmail", category: "comms" },
  gcal: { id: "gcal", name: "Google Calendar", category: "comms" },
  gsheets: { id: "gsheets", name: "Google Sheets", category: "data" },
  stripe: { id: "stripe", name: "Stripe", category: "payments" },
  supabase: { id: "supabase", name: "Supabase", category: "data" },
  postgres: { id: "postgres", name: "Postgres", category: "data" },
  zendesk: { id: "zendesk", name: "Zendesk", category: "support" },
  kb: { id: "kb", name: "Knowledge Base", category: "support" },
};

export const PACKS: Pack[] = [
  {
    id: "builder",
    slug: "builder-pack",
    name: "Builder Pack",
    tagline: "Ship code faster with the essential developer stack.",
    description:
      "For coding agents and product teams shipping software end-to-end.",
    accent: "from-emerald-400/30 to-cyan-400/10",
    tools: [
      ALL_TOOLS.github,
      ALL_TOOLS.slack,
      ALL_TOOLS.notion,
      ALL_TOOLS.linear,
    ],
  },
  {
    id: "research",
    slug: "research-pack",
    name: "Research Pack",
    tagline: "Read the web, the papers, and your notes in one place.",
    description:
      "For analyst agents that comb literature, summarize, and file findings.",
    accent: "from-fuchsia-400/30 to-violet-400/10",
    tools: [
      ALL_TOOLS.websearch,
      ALL_TOOLS.arxiv,
      ALL_TOOLS.notion,
      ALL_TOOLS.gdrive,
    ],
  },
  {
    id: "business",
    slug: "business-pack",
    name: "Business Pack",
    tagline: "Email, calendar, sheets — the operator's toolkit.",
    description:
      "For executive assistants and ops agents that move the work along.",
    accent: "from-amber-400/30 to-orange-400/10",
    tools: [
      ALL_TOOLS.gmail,
      ALL_TOOLS.gcal,
      ALL_TOOLS.slack,
      ALL_TOOLS.gsheets,
    ],
  },
  {
    id: "saas",
    slug: "saas-pack",
    name: "SaaS Pack",
    tagline: "Payments, data, and code for startup agents.",
    description:
      "For founder agents wiring revenue, infrastructure, and shipping in one loop.",
    accent: "from-sky-400/30 to-blue-400/10",
    tools: [
      ALL_TOOLS.stripe,
      ALL_TOOLS.supabase,
      ALL_TOOLS.github,
      ALL_TOOLS.postgres,
    ],
  },
  {
    id: "support",
    slug: "support-pack",
    name: "Support Pack",
    tagline: "Resolve tickets without leaving the inbox.",
    description:
      "For customer support agents triaging, replying, and escalating issues.",
    accent: "from-rose-400/30 to-pink-400/10",
    tools: [
      ALL_TOOLS.zendesk,
      ALL_TOOLS.slack,
      ALL_TOOLS.kb,
      ALL_TOOLS.gmail,
    ],
  },
  {
    id: "personal",
    slug: "personal-assistant-pack",
    name: "Personal Assistant Pack",
    tagline: "A second brain that books, drafts, and remembers.",
    description:
      "For long-running personal agents that manage your life and inbox.",
    accent: "from-lime-400/30 to-emerald-400/10",
    tools: [
      ALL_TOOLS.gmail,
      ALL_TOOLS.gcal,
      ALL_TOOLS.notion,
      ALL_TOOLS.gdrive,
    ],
  },
];

export function recommendPack(query: string): Pack {
  const q = query.toLowerCase();
  const has = (...keywords: string[]) => keywords.some((k) => q.includes(k));

  if (has("code", "github", "developer", "dev", "ship", "engineer"))
    return PACKS[0];
  if (has("research", "paper", "summarize", "arxiv", "analyst"))
    return PACKS[1];
  if (has("payment", "stripe", "saas", "startup", "founder"))
    return PACKS[3];
  if (has("support", "customer", "ticket", "zendesk"))
    return PACKS[4];
  if (has("email", "calendar", "meeting", "team", "ops"))
    return PACKS[2];
  return PACKS[5];
}
