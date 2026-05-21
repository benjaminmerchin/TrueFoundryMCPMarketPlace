export type Risk = "read" | "write" | "destructive";

export type Tool = {
  id: string;
  name: string;
  serverId: string;
  description: string;
  risk: Risk;
};

export type Server = {
  id: string;
  name: string;
};

export type Pack = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  tools: Tool[];
  recommended?: boolean;
};

export const SERVERS: Record<string, Server> = {
  github: { id: "github", name: "GitHub" },
  slack: { id: "slack", name: "Slack" },
  notion: { id: "notion", name: "Notion" },
  linear: { id: "linear", name: "Linear" },
  websearch: { id: "websearch", name: "Web Search" },
  arxiv: { id: "arxiv", name: "Arxiv" },
  gdrive: { id: "gdrive", name: "Google Drive" },
  gmail: { id: "gmail", name: "Gmail" },
  gcal: { id: "gcal", name: "Google Calendar" },
  gsheets: { id: "gsheets", name: "Google Sheets" },
  stripe: { id: "stripe", name: "Stripe" },
  supabase: { id: "supabase", name: "Supabase" },
  postgres: { id: "postgres", name: "Postgres" },
  zendesk: { id: "zendesk", name: "Zendesk" },
  kb: { id: "kb", name: "Knowledge Base" },
};

function t(
  serverId: string,
  name: string,
  description: string,
  risk: Risk = "read",
): Tool {
  return {
    id: `${serverId}.${name}`,
    name,
    serverId,
    description,
    risk,
  };
}

export const PACKS: Pack[] = [
  {
    id: "openclaw",
    slug: "openclaw-basics",
    name: "OpenClaw Basics",
    tagline: "The essential tool stack for a long-running coding agent.",
    description:
      "Recommended starter for OpenClaw-style agents: ship, plan, and document inside one toolchain.",
    accent: "from-emerald-400/30 to-cyan-400/10",
    recommended: true,
    tools: [
      t("github", "get_repo", "Read repository metadata and settings."),
      t("github", "list_pull_requests", "List PRs filtered by state and author."),
      t("github", "get_pull_request", "Fetch a single PR with diff and reviews."),
      t("github", "create_pull_request", "Open a new PR from a branch.", "write"),
      t(
        "github",
        "comment_on_pull_request",
        "Leave a review comment on a PR.",
        "write",
      ),
      t("slack", "list_channels", "List channels the bot has access to."),
      t(
        "slack",
        "send_message",
        "Post a message to a channel or thread.",
        "write",
      ),
      t("notion", "search", "Search pages and databases the agent can read."),
      t(
        "notion",
        "create_page",
        "Create a new page under a parent.",
        "write",
      ),
      t(
        "notion",
        "append_block",
        "Append blocks to an existing page.",
        "write",
      ),
      t("linear", "list_issues", "List issues by team or assignee."),
      t(
        "linear",
        "create_issue",
        "File a new Linear issue with title and body.",
        "write",
      ),
      t(
        "linear",
        "update_issue",
        "Update status, assignee, or priority on an issue.",
        "write",
      ),
    ],
  },
  {
    id: "research",
    slug: "research-pack",
    name: "Research Pack",
    tagline: "Read the web, the papers, and your notes from one agent.",
    description:
      "For analyst agents that comb literature, summarize, and file findings.",
    accent: "from-fuchsia-400/30 to-violet-400/10",
    tools: [
      t("websearch", "web_search", "Run a keyword search and return ranked URLs."),
      t("websearch", "fetch_url", "Fetch and clean the content of a web page."),
      t("arxiv", "search_papers", "Search arXiv by query, author, or category."),
      t("arxiv", "get_paper", "Fetch the abstract and metadata of a paper."),
      t("arxiv", "summarize_paper", "Generate a structured summary of a paper."),
      t("notion", "search", "Search pages and databases the agent can read."),
      t(
        "notion",
        "create_page",
        "Write up findings into a new Notion page.",
        "write",
      ),
      t(
        "notion",
        "append_block",
        "Append findings to an existing report.",
        "write",
      ),
      t("gdrive", "search_files", "Search Drive by name, type, or owner."),
      t("gdrive", "get_file_content", "Download and read the contents of a file."),
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
      t("gmail", "search_messages", "Search the inbox by query, sender, or label."),
      t("gmail", "get_message", "Fetch a single email with headers and body."),
      t("gmail", "send_message", "Send a new email or reply in thread.", "write"),
      t("gcal", "list_events", "List upcoming events in a window."),
      t("gcal", "create_event", "Create a calendar event with attendees.", "write"),
      t(
        "gcal",
        "update_event",
        "Update time, attendees, or notes on an event.",
        "write",
      ),
      t("slack", "send_message", "Notify a channel or DM a teammate.", "write"),
      t("slack", "list_channels", "Resolve channel names to IDs."),
      t("gsheets", "read_range", "Read a cell range from a sheet."),
      t("gsheets", "append_row", "Append a row to a sheet.", "write"),
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
      t("stripe", "list_customers", "List customers with filters."),
      t("stripe", "list_charges", "List recent charges by customer or date."),
      t(
        "stripe",
        "create_payment_link",
        "Generate a one-off payment link.",
        "write",
      ),
      t("stripe", "create_refund", "Refund a charge.", "destructive"),
      t("supabase", "query", "Run a parameterized SELECT against a table."),
      t("supabase", "insert", "Insert rows into a table.", "write"),
      t("supabase", "update", "Update rows matching a filter.", "write"),
      t("postgres", "query", "Run a read-only SQL query."),
      t("postgres", "list_tables", "List tables in the connected schema."),
      t("github", "get_repo", "Read repository metadata."),
      t(
        "github",
        "create_pull_request",
        "Open a PR from a feature branch.",
        "write",
      ),
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
      t("zendesk", "list_tickets", "List open tickets by queue or priority."),
      t("zendesk", "get_ticket", "Fetch ticket metadata and conversation."),
      t(
        "zendesk",
        "add_comment",
        "Add a public or internal comment to a ticket.",
        "write",
      ),
      t(
        "zendesk",
        "update_ticket",
        "Change status, assignee, or priority.",
        "write",
      ),
      t("kb", "search_articles", "Search the help center for relevant articles."),
      t("kb", "get_article", "Fetch a help center article by ID."),
      t("slack", "send_message", "Escalate to an internal channel.", "write"),
      t("gmail", "search_messages", "Find related emails by sender or subject."),
      t("gmail", "send_message", "Reply to a customer by email.", "write"),
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
      t("gmail", "search_messages", "Search the inbox by query, sender, or label."),
      t("gmail", "get_message", "Read a single email."),
      t("gmail", "send_message", "Draft and send an email.", "write"),
      t("gcal", "list_events", "List your upcoming events."),
      t("gcal", "create_event", "Book a meeting on your calendar.", "write"),
      t("gcal", "update_event", "Reschedule or update an event.", "write"),
      t("notion", "search", "Search your notes and second brain."),
      t("notion", "create_page", "Create a new note.", "write"),
      t("notion", "append_block", "Append to an existing note.", "write"),
      t("gdrive", "search_files", "Search Drive by name or type."),
      t("gdrive", "get_file_content", "Read a Drive document."),
    ],
  },
];

export function recommendPack(query: string): Pack {
  const q = query.toLowerCase();
  const has = (...keywords: string[]) => keywords.some((k) => q.includes(k));

  if (
    has(
      "code",
      "github",
      "developer",
      "dev",
      "ship",
      "engineer",
      "openclaw",
      "agent",
      "build",
    )
  )
    return PACKS[0];
  if (has("research", "paper", "summarize", "arxiv", "analyst"))
    return PACKS[1];
  if (has("payment", "stripe", "saas", "startup", "founder")) return PACKS[3];
  if (has("support", "customer", "ticket", "zendesk")) return PACKS[4];
  if (has("email", "calendar", "meeting", "team", "ops")) return PACKS[2];
  return PACKS[5];
}

export function groupToolsByServer<T extends Tool>(tools: T[]) {
  const map = new Map<string, T[]>();
  for (const tool of tools) {
    const list = map.get(tool.serverId) ?? [];
    list.push(tool);
    map.set(tool.serverId, list);
  }
  return Array.from(map.entries()).map(([serverId, items]) => ({
    server: SERVERS[serverId] ?? { id: serverId, name: serverId },
    tools: items,
  }));
}

export function countServers(tools: Tool[]) {
  return new Set(tools.map((tool) => tool.serverId)).size;
}
