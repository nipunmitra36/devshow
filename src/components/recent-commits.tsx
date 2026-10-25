"use client";

import { useState } from "react";
import { formatDate, formatDateTime } from "@/lib/format";
import type { CommitItem } from "@/lib/types";
import { CommitIcon, ExternalIcon } from "./icons";
import { Card, CardHeader, delay } from "./ui";

const PAGE = 12;

export function RecentCommits({ commits }: { commits: CommitItem[] | null }) {
  const [visible, setVisible] = useState(PAGE);

  return (
    <Card style={delay(6)} className="min-w-0">
      <CardHeader
        icon={CommitIcon}
        title="Recent commits"
        description={commits?.length ? `Latest ${commits.length} public commits on default branches` : undefined}
      />

      {!commits ? (
        <Empty title="Commits unavailable" body="GitHub didn't return commit data right now. Try again in a moment." />
      ) : commits.length === 0 ? (
        <Empty title="No public commits found" body="Commits appear here once they land on a public repository's default branch." />
      ) : (
        <>
          {/* Table on wider screens */}
          <div className="hidden md:block">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-fg-subtle">
                  <th scope="col" className="w-[30%] px-6 py-3 font-medium">Repository</th>
                  <th scope="col" className="px-3 py-3 font-medium">Message</th>
                  <th scope="col" className="w-32 px-3 py-3 font-medium">Date</th>
                  <th scope="col" className="w-28 px-6 py-3 text-right font-medium">Commit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line border-t border-line">
                {commits.slice(0, visible).map((c) => (
                  <tr key={c.sha} className="transition hover:bg-tint/[0.025]">
                    <td className="truncate px-6 py-3">
                      <a href={c.repoUrl} target="_blank" rel="noreferrer" className="font-medium text-fg hover:text-accent" title={c.repo}>
                        {c.repo.split("/")[1]}
                      </a>
                    </td>
                    <td className="truncate px-3 py-3 text-fg-muted" title={c.message}>
                      {firstLine(c.message)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-fg-subtle">
                      <time dateTime={c.date} title={formatDateTime(c.date)}>
                        {formatDate(c.date)}
                      </time>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <ShaLink commit={c} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stacked list on mobile */}
          <ul className="divide-y divide-line md:hidden">
            {commits.slice(0, visible).map((c) => (
              <li key={c.sha} className="flex gap-3 px-5 py-4">
                <CommitIcon className="mt-0.5 size-4 shrink-0 text-heat-3" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm text-fg">{firstLine(c.message)}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
                    <a href={c.repoUrl} target="_blank" rel="noreferrer" className="font-medium text-fg-muted hover:text-accent">
                      {c.repo.split("/")[1]}
                    </a>
                    <time dateTime={c.date} title={formatDateTime(c.date)}>
                      {formatDate(c.date)}
                    </time>
                    <ShaLink commit={c} />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {commits.length > PAGE && (
            <div className="border-t border-line px-5 py-3 text-center sm:px-6">
              <button
                type="button"
                onClick={() => setVisible((v) => (v >= commits.length ? PAGE : Math.min(commits.length, v + PAGE * 2)))}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-fg-muted transition hover:bg-tint/[0.04] hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                {visible >= commits.length ? "Show less" : `Show more (${commits.length - visible} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function ShaLink({ commit }: { commit: CommitItem }) {
  return (
    <a
      href={commit.url}
      target="_blank"
      rel="noreferrer"
      aria-label={`View commit ${commit.sha.slice(0, 7)} on GitHub`}
      className="inline-flex items-center gap-1 rounded-md border border-line bg-tint/[0.02] px-1.5 py-0.5 font-mono text-xs text-fg-muted transition hover:border-accent/40 hover:text-accent"
    >
      {commit.sha.slice(0, 7)}
      <ExternalIcon className="size-3" />
    </a>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-medium text-fg">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-fg-subtle">{body}</p>
    </div>
  );
}

const firstLine = (msg: string) => msg.split("\n")[0];
