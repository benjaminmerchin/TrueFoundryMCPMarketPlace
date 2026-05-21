"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  countServers,
  groupToolsByServer,
  PACKS,
  type Pack,
  type Risk,
  type Tool,
  recommendPack,
} from "@/lib/packs";

const TRUEFOUNDRY_GATEWAY_URL =
  "https://dalta.truefoundry.cloud/llm-gateway/mcp-servers";
const TRUEFOUNDRY_MCP_SERVER_ID = "dbl9pru86y9okd6afkr8g4v7";

type ToolState = Tool & {
  enabled: boolean;
  custom?: boolean;
};

function packToToolState(pack: Pack): ToolState[] {
  return pack.tools.map((tool) => ({ ...tool, enabled: true }));
}

function slugifySegment(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const RISK_STYLES: Record<Risk, { label: string; className: string }> = {
  read: {
    label: "read",
    className:
      "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  },
  write: {
    label: "write",
    className: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  },
  destructive: {
    label: "destructive",
    className: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  },
};

export function Marketplace() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tools, setTools] = useState<ToolState[]>([]);
  const [customTool, setCustomTool] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const selected = useMemo(
    () => PACKS.find((pack) => pack.id === selectedId) ?? null,
    [selectedId],
  );

  function handleSelectPack(pack: Pack) {
    setSelectedId(pack.id);
    setTools(packToToolState(pack));
    setHighlightId(pack.id);
    setTimeout(() => {
      document
        .getElementById("customize")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  function handleRecommend() {
    if (!query.trim()) {
      toast.info("Describe what you want to build first.");
      return;
    }
    const pack = recommendPack(query);
    handleSelectPack(pack);
    toast.success(`Matched you to the ${pack.name}`, {
      description: pack.tagline,
    });
  }

  function toggleTool(id: string) {
    setTools((prev) =>
      prev.map((tool) =>
        tool.id === id ? { ...tool, enabled: !tool.enabled } : tool,
      ),
    );
  }

  function toggleServer(serverId: string, enabled: boolean) {
    setTools((prev) =>
      prev.map((tool) =>
        tool.serverId === serverId ? { ...tool, enabled } : tool,
      ),
    );
  }

  function removeTool(id: string) {
    setTools((prev) => prev.filter((tool) => tool.id !== id));
  }

  function addCustomTool() {
    const trimmed = customTool.trim();
    if (!trimmed) return;
    const dotIndex = trimmed.indexOf(".");
    if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
      toast.error("Use the format server.tool_name (e.g. github.archive_repo)");
      return;
    }
    const serverIdRaw = trimmed.slice(0, dotIndex);
    const toolNameRaw = trimmed.slice(dotIndex + 1);
    const serverId = slugifySegment(serverIdRaw);
    const toolName = slugifySegment(toolNameRaw);
    if (!serverId || !toolName) {
      toast.error("Couldn't parse that tool name. Try github.archive_repo.");
      return;
    }
    const id = `${serverId}.${toolName}`;
    if (tools.some((tool) => tool.id === id)) {
      toast.warning(`${id} is already in the pack.`);
      return;
    }
    setTools((prev) => [
      ...prev,
      {
        id,
        name: toolName,
        serverId,
        description: "Custom tool added in the marketplace.",
        risk: "write",
        enabled: true,
        custom: true,
      },
    ]);
    setCustomTool("");
    toast.success(`Added ${id}`);
  }

  const enabledTools = useMemo(
    () => tools.filter((tool) => tool.enabled),
    [tools],
  );

  const grouped = useMemo(() => groupToolsByServer(tools), [tools]);

  const generatedConfig = useMemo(() => {
    if (!selected) return null;
    const byServer: Record<string, { tools: string[] }> = {};
    for (const tool of enabledTools) {
      const serverKey = tool.serverId;
      if (!byServer[serverKey]) byServer[serverKey] = { tools: [] };
      byServer[serverKey].tools.push(tool.name);
    }
    return {
      virtual_mcp_server_name: selected.slug,
      description: selected.description,
      mcp_servers: byServer,
      tool_count: enabledTools.length,
      auth_required: true,
      gateway: "truefoundry-mcp-gateway",
      status: enabledTools.length ? "ready_to_deploy" : "missing_tools",
    };
  }, [selected, enabledTools]);

  const configJson = generatedConfig
    ? JSON.stringify(generatedConfig, null, 2)
    : "";

  async function copyConfig() {
    if (!configJson) return;
    try {
      await navigator.clipboard.writeText(configJson);
      toast.success("Copied TrueFoundry config to clipboard");
    } catch {
      toast.error("Couldn't copy — your browser blocked clipboard access.");
    }
  }

  const trueFoundryUrl = useMemo(() => {
    if (!selected || enabledTools.length === 0) return null;
    // Encode every enabled tool's bare name so the content script can match
    // against whichever MCP server page the user opens.
    const names = Array.from(new Set(enabledTools.map((tool) => tool.name)));
    const hash = `mcpacks=${names
      .map((n) => encodeURIComponent(n))
      .join(",")}`;
    return `${TRUEFOUNDRY_GATEWAY_URL}?id=${TRUEFOUNDRY_MCP_SERVER_ID}&mcp-server-tab=tools#${hash}`;
  }, [selected, enabledTools]);

  function openInTrueFoundry() {
    if (!trueFoundryUrl) {
      toast.info("Enable at least one tool before opening.");
      return;
    }
    window.open(trueFoundryUrl, "_blank", "noopener,noreferrer");
    toast.success("Opening TrueFoundry…", {
      description: "Install the marketplace extension to auto-tick tools.",
    });
  }

  return (
    <>
      <section
        id="hero"
        className="relative isolate overflow-hidden border-b border-white/5"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(120,_119,_198,_0.18),_transparent_60%)]" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-24 sm:py-32">
          <div className="flex flex-col items-start gap-6">
            <Badge
              variant="outline"
              className="border-white/10 bg-white/5 text-xs text-white/70 backdrop-blur"
            >
              <Sparkles className="size-3" />
              Built on the TrueFoundry MCP Gateway
            </Badge>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Pick the tools your agent gets — not the whole MCP.
            </h1>
            <p className="max-w-2xl text-balance text-base text-white/60 sm:text-lg">
              Curated tool packs across the MCPs you already use. Toggle each
              tool, enforce least-privilege, and route it all through the
              TrueFoundry MCP Gateway.
            </p>
          </div>

          <div className="flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-2xl shadow-black/40 backdrop-blur sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-xl bg-black/40 px-3">
              <Search className="size-4 shrink-0 text-white/40" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleRecommend();
                }}
                placeholder="Describe what you want to build..."
                className="h-12 border-0 bg-transparent text-base text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button
              size="lg"
              onClick={handleRecommend}
              className="h-12 gap-2 rounded-xl bg-white text-black hover:bg-white/90"
            >
              <Wand2 className="size-4" />
              Recommend a pack
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-white/40">
            <span className="text-white/30">Try:</span>
            {[
              "openclaw agent",
              "research analyst",
              "stripe + supabase",
              "customer support",
              "personal assistant",
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setQuery(suggestion);
                  const pack = recommendPack(suggestion);
                  handleSelectPack(pack);
                }}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-white/60 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section
        id="marketplace"
        className="mx-auto w-full max-w-6xl px-6 pt-16 sm:pt-24"
      >
        <div className="mb-10 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
              Marketplace
            </span>
            <Separator className="flex-1 bg-white/5" />
          </div>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            Curated tool packs, ready to govern
          </h2>
          <p className="max-w-2xl text-white/60">
            Every pack is a hand-picked set of tools across multiple MCPs. Drop
            one in, refine the surface area, and route it through TrueFoundry.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PACKS.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              active={selectedId === pack.id}
              highlighted={highlightId === pack.id}
              onSelect={() => handleSelectPack(pack)}
            />
          ))}
        </div>
      </section>

      <section
        id="customize"
        className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24"
      >
        <div className="mb-10 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-white/40">
              Customize
            </span>
            <Separator className="flex-1 bg-white/5" />
          </div>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            {selected ? `Refine ${selected.name}` : "Refine your stack"}
          </h2>
          <p className="max-w-2xl text-white/60">
            {selected
              ? selected.description
              : "Pick a pack above to start narrowing down the tools your agent gets."}
          </p>
          {selected ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/50">
              <Badge
                variant="outline"
                className="border-white/10 bg-white/5 font-mono text-white/70"
              >
                {enabledTools.length} of {tools.length} tools enabled
              </Badge>
              <Badge
                variant="outline"
                className="border-white/10 bg-white/5 font-mono text-white/70"
              >
                {countServers(enabledTools)} MCP server
                {countServers(enabledTools) === 1 ? "" : "s"}
              </Badge>
            </div>
          ) : null}
        </div>

        {selected ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Card className="border-white/10 bg-white/[0.02] lg:col-span-3">
              <CardHeader className="pb-4">
                <CardTitle className="text-white">Tool selection</CardTitle>
                <CardDescription className="text-white/50">
                  Each tool is a single MCP action. Toggle off whatever your
                  agent shouldn't call.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {grouped.map(({ server, tools: serverTools }) => {
                  const enabledCount = serverTools.filter(
                    (tool) => tool.enabled,
                  ).length;
                  const allEnabled = enabledCount === serverTools.length;
                  return (
                    <div
                      key={server.id}
                      className="rounded-2xl border border-white/5 bg-black/20"
                    >
                      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex size-7 items-center justify-center rounded-md border border-white/10 bg-white/5 font-mono text-[11px] uppercase tracking-wide text-white/70">
                            {server.id.slice(0, 2)}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-medium text-white">
                              {server.name}
                            </span>
                            <span className="font-mono text-[11px] text-white/40">
                              {enabledCount}/{serverTools.length} tools enabled
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleServer(server.id, !allEnabled)}
                          className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/60 hover:border-white/20 hover:text-white"
                        >
                          {allEnabled ? "Disable all" : "Enable all"}
                        </button>
                      </div>
                      <div className="flex flex-col">
                        {serverTools.map((tool, idx) => (
                          <ToolRow
                            key={tool.id}
                            tool={tool}
                            isLast={idx === serverTools.length - 1}
                            onToggle={() => toggleTool(tool.id)}
                            onRemove={
                              tool.custom ? () => removeTool(tool.id) : undefined
                            }
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                  <Input
                    value={customTool}
                    onChange={(event) => setCustomTool(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addCustomTool();
                    }}
                    placeholder="Add a tool — e.g. github.archive_repo"
                    className="border-white/10 bg-black/40 font-mono text-white placeholder:text-white/30"
                  />
                  <Button
                    type="button"
                    onClick={addCustomTool}
                    className="gap-2 bg-white text-black hover:bg-white/90"
                  >
                    <Plus className="size-4" />
                    Add tool
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.02] lg:col-span-2">
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
                <div className="flex flex-col">
                  <CardTitle className="text-white">Gateway config</CardTitle>
                  <CardDescription className="text-white/50">
                    Drop this into your TrueFoundry MCP Gateway.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={copyConfig}
                  className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Copy className="size-3.5" />
                  Copy
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[420px] overflow-auto rounded-xl border border-white/5 bg-black/60 p-4 font-mono text-xs leading-relaxed text-emerald-200/90">
{configJson}
                </pre>
                <Button
                  type="button"
                  onClick={openInTrueFoundry}
                  className="mt-4 w-full gap-2 bg-white text-black hover:bg-white/90"
                >
                  <ExternalLink className="size-4" />
                  Open in TrueFoundry
                </Button>
                <Button
                  type="button"
                  onClick={copyConfig}
                  variant="outline"
                  className="mt-2 w-full gap-2 border-white/15 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white"
                >
                  <Copy className="size-4" />
                  Copy TrueFoundry Config
                </Button>
                <p className="mt-3 text-center text-[11px] text-white/40">
                  Install the{" "}
                  <span className="font-mono text-white/60">extension/</span>{" "}
                  Chrome extension to auto-tick these tools on TrueFoundry.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-dashed border-white/10 bg-white/[0.02]">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="rounded-full border border-white/10 bg-white/5 p-3">
                <ArrowRight className="size-5 text-white/60" />
              </div>
              <p className="font-medium text-white">No pack selected yet</p>
              <p className="max-w-md text-sm text-white/50">
                Pick one of the starter packs above, or describe what you want
                to build and we'll match you to the closest fit.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </>
  );
}

function ToolRow({
  tool,
  isLast,
  onToggle,
  onRemove,
}: {
  tool: ToolState;
  isLast: boolean;
  onToggle: () => void;
  onRemove?: () => void;
}) {
  const risk = RISK_STYLES[tool.risk];
  return (
    <div
      className={`flex items-start justify-between gap-3 px-4 py-3 transition hover:bg-white/[0.02] ${
        isLast ? "" : "border-b border-white/5"
      } ${tool.enabled ? "" : "opacity-60"}`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-white">{tool.name}</span>
          <Badge
            variant="outline"
            className={`gap-1 border bg-transparent text-[10px] font-medium uppercase tracking-wide ${risk.className}`}
          >
            {tool.risk === "destructive" ? (
              <ShieldAlert className="size-2.5" />
            ) : null}
            {risk.label}
          </Badge>
          {tool.custom ? (
            <Badge
              variant="outline"
              className="border-white/15 bg-transparent text-[10px] font-normal uppercase tracking-wide text-white/50"
            >
              custom
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-white/50">{tool.description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <Switch
          checked={tool.enabled}
          onCheckedChange={onToggle}
          aria-label={`Toggle ${tool.id}`}
        />
        {onRemove ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 text-white/40 hover:bg-white/10 hover:text-white"
            onClick={onRemove}
            aria-label={`Remove ${tool.id}`}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function PackCard({
  pack,
  active,
  highlighted,
  onSelect,
}: {
  pack: Pack;
  active: boolean;
  highlighted: boolean;
  onSelect: () => void;
}) {
  const grouped = groupToolsByServer(pack.tools);
  const toolCount = pack.tools.length;
  const serverCount = grouped.length;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group relative flex w-full flex-col gap-5 overflow-hidden rounded-2xl border bg-white/[0.02] p-6 text-left transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04] ${
        active ? "border-white/30 bg-white/[0.05]" : "border-white/10"
      } ${highlighted ? "ring-1 ring-white/20" : ""}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-br ${pack.accent} opacity-50 blur-3xl transition group-hover:opacity-80`}
      />
      {pack.recommended ? (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200">
          <Sparkles className="size-2.5" />
          Recommended
        </span>
      ) : null}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 pr-20">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-white/40">
            {pack.slug}
          </span>
          <h3 className="text-xl font-semibold text-white">{pack.name}</h3>
        </div>
        {active ? (
          <span className="inline-flex size-7 items-center justify-center rounded-full border border-white/15 bg-white text-black">
            <Check className="size-3.5" />
          </span>
        ) : (
          <ArrowRight className="size-4 translate-x-0 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white" />
        )}
      </div>
      <p className="relative text-sm text-white/60">{pack.tagline}</p>
      <div className="relative flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wide text-white/40">
          {toolCount} tools · {serverCount} MCP
          {serverCount === 1 ? "" : "s"}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {grouped.map(({ server, tools: serverTools }) => (
            <Badge
              key={server.id}
              variant="outline"
              className="border-white/10 bg-white/5 font-normal text-white/70"
            >
              {server.name}
              <span className="ml-1 text-white/40">{serverTools.length}</span>
            </Badge>
          ))}
        </div>
      </div>
      <div className="relative mt-auto inline-flex items-center gap-2 text-sm font-medium text-white/80 group-hover:text-white">
        Use pack
        <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

