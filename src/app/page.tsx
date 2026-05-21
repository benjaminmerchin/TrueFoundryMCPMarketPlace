import Link from "next/link";

import { Marketplace } from "@/components/marketplace";

function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.26 5.68.42.36.79 1.05.79 2.13v3.16c0 .3.21.66.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#070708] text-white">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#070708]/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-lg border border-white/15 bg-white text-black font-mono text-xs font-bold">
              M
            </span>
            <span className="font-semibold tracking-tight">MCPacks</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm text-white/60">
            <a
              href="#marketplace"
              className="hidden rounded-md px-2 py-1 hover:text-white sm:inline"
            >
              Marketplace
            </a>
            <a
              href="#customize"
              className="hidden rounded-md px-2 py-1 hover:text-white sm:inline"
            >
              Customize
            </a>
            <a
              href="https://www.truefoundry.com"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-md px-2 py-1 hover:text-white sm:inline"
            >
              TrueFoundry ↗
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="inline-flex size-8 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-white/70 hover:text-white"
            >
              <GithubMark className="size-4" />
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Marketplace />
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 text-sm text-white/40 sm:flex-row sm:items-center">
          <span>
            Built for the TrueFoundry Production Agents · MCP Mini Hack
          </span>
          <span className="font-mono text-xs">
            mcpacks · v0.1 · hackathon edition
          </span>
        </div>
      </footer>
    </div>
  );
}
