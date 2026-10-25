import { periodLabel, plural } from "@/lib/format";
import type { RepoActivity } from "@/lib/types";
import { RepoIcon } from "./icons";
import { Card, CardHeader, delay } from "./ui";

export function TopRepos({
  repos,
  scope,
  year,
}: {
  repos: RepoActivity[];
  scope: "period" | "recent";
  year: number | null;
}) {
  const max = Math.max(1, ...repos.map((r) => r.commits));

  return (
    <Card style={delay(7)} className="h-fit">
      <CardHeader
        icon={RepoIcon}
        title="Top repositories"
        description={scope === "period" ? `By commits in ${periodLabel(year)}` : "By recent commits"}
      />
      {repos.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-fg-subtle">No repository activity to show.</p>
      ) : (
        <ol className="divide-y divide-line">
          {repos.map((r) => {
            const [owner, name] = r.repo.split("/");
            return (
              <li key={r.repo}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block px-5 py-3.5 transition hover:bg-tint/[0.025] focus-visible:bg-tint/[0.04] focus-visible:outline-none sm:px-6"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <RepoIcon className="size-4 shrink-0 text-fg-subtle" />
                      <span className="truncate">
                        <span className="text-fg-subtle">{owner}/</span>
                        <span className="font-medium text-fg group-hover:text-accent">{name}</span>
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums text-fg-muted">{plural(r.commits, "commit")}</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-tint/[0.05]">
                    <div className="h-full rounded-full bg-heat-3" style={{ width: `${(r.commits / max) * 100}%` }} />
                  </div>
                </a>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
