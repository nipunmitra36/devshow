import Link from "next/link";
import { GitHubIcon } from "./icons";
import { ThemeToggle } from "./theme-toggle";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span aria-hidden className="grid size-7 grid-cols-3 gap-[2px] rounded-lg border border-line bg-surface-strong p-[5px]">
        {["bg-heat-2", "bg-heat-4", "bg-heat-1", "bg-heat-3", "bg-heat-1", "bg-heat-4", "bg-heat-1", "bg-heat-2", "bg-heat-3"].map(
          (c, i) => (
            <span key={i} className={`rounded-[1.5px] ${c}`} />
          ),
        )}
      </span>
      DevShow
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-canvas/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="rounded-md text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
          <Logo />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-fg-muted transition hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <GitHubIcon className="size-4" />
            <span className="hidden md:inline">Powered by GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-fg-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} <span className="font-medium text-fg-muted">Theme Toptal</span>. All rights
          reserved.
        </p>
        <p>
          Developed by{" "}
          <a
            href="https://github.com/nipunmitra36"
            target="_blank"
            rel="noreferrer"
            className="rounded-sm font-medium text-fg-muted transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            Nipun Mitra
          </a>
        </p>
      </div>
    </footer>
  );
}
