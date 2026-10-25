import type { ReactNode, Ref } from "react";
import { formatDate, formatNumber, periodLabel, plural } from "@/lib/format";
import { monthlyTotals } from "@/lib/stats";
import type { CommitItem, ContributionBreakdown } from "@/lib/types";
import { lastWeeks, type ShareData } from "./share-card";

/** A4 at 96 dpi. Each page is captured to an image and placed on its own PDF page. */
export const REPORT_PAGE = { w: 794, h: 1123 } as const;

const PAD = 48;
const ROWS_AFTER_REPOS = 18;
const ROWS_PER_PAGE = 24;
const HEAT = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"];

/** Same-origin proxy so images can be inlined into the export without CORS errors. */
const proxied = (url: string, w: 64 | 128 | 256) => `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`;

/** Split commits into page-sized chunks: a short first chunk (shares a page with top repos), then full pages. */
function paginate(commits: CommitItem[], firstRows: number): CommitItem[][] {
  const pages: CommitItem[][] = [];
  let i = 0;
  let size = firstRows;
  while (i < commits.length) {
    pages.push(commits.slice(i, i + size));
    i += size;
    size = ROWS_PER_PAGE;
  }
  return pages;
}

/**
 * The full multi-page PDF report. Rendered off-screen in the light theme (print-friendly) only
 * while a PDF is being generated; every direct child with `data-report-page` becomes one PDF page.
 */
export function ReportPages({ data, ref }: { data: ShareData; ref?: Ref<HTMLDivElement> }) {
  const commits = data.recentCommits ?? [];
  const hasRepos = data.topRepos.length > 0;
  const commitPages = paginate(commits, hasRepos ? ROWS_AFTER_REPOS : ROWS_PER_PAGE);
  const totalPages = 1 + Math.max(1, commitPages.length);
  // Rendered only in the browser at export time, so the viewer's local date is correct here.
  const generated = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div ref={ref} data-theme="light" className="flex flex-col gap-6 font-sans text-fg">
      <Page n={1} total={totalPages} data={data} generated={generated}>
        <Overview data={data} />
      </Page>

      {(commitPages.length ? commitPages : [[]]).map((rows, i) => (
        <Page key={i} n={i + 2} total={totalPages} data={data} generated={generated}>
          {i === 0 && hasRepos && <TopRepos data={data} />}
          <CommitTable
            rows={rows}
            title={i === 0 ? "Recent commits" : "Recent commits (continued)"}
            empty={!data.recentCommits ? "Commits couldn't be loaded from GitHub." : "No public commits found."}
          />
        </Page>
      ))}
    </div>
  );
}

function Page({
  n,
  total,
  data,
  generated,
  children,
}: {
  n: number;
  total: number;
  data: ShareData;
  generated: string;
  children: ReactNode;
}) {
  return (
    <div
      data-report-page
      className="relative flex flex-col overflow-hidden bg-white"
      style={{ width: REPORT_PAGE.w, height: REPORT_PAGE.h, padding: PAD }}
    >
      {/* Brand strip */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-heat-2 via-heat-3 to-heat-4" />
      <header className="flex items-center justify-between border-b border-line pb-3 text-[11px] text-fg-subtle">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-fg">
          <span className="grid size-5 grid-cols-3 gap-[1.5px] rounded-[5px] bg-[#0b0f12] p-[3px]">
            {[2, 4, 1, 3, 1, 4, 1, 2, 3].map((l, i) => (
              <span key={i} className="rounded-[1px]" style={{ background: ["", "#0e4429", "#006d32", "#26a641", "#4ae168"][l] }} />
            ))}
          </span>
          DevShow
          <span className="font-normal text-fg-subtle">· Developer report</span>
        </span>
        <span>
          {data.user.name ?? data.user.login} · Generated {generated}
        </span>
      </header>

      <main className="mt-6 flex min-h-0 flex-1 flex-col gap-6">{children}</main>

      <footer className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[10px] text-fg-subtle">
        <span>github.com/{data.user.login} · Public data from the GitHub API</span>
        <span className="tabular-nums">
          Page {n} of {total}
        </span>
      </footer>
    </div>
  );
}

function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fg">{children}</h2>
      {aside && <span className="text-[11px] text-fg-subtle">{aside}</span>}
    </div>
  );
}

const box = "rounded-xl border border-line bg-[#fbfcfd]";

function Overview({ data }: { data: ShareData }) {
  const { user, stats, calendar, year } = data;
  const name = user.name ?? user.login;
  const days = calendar?.days ?? [];
  const unit = calendar?.source === "recent-commits" ? "commit" : "contribution";
  const activePct = days.length ? Math.round((stats.activeDays / days.length) * 100) : 0;

  const statItems = [
    {
      label: "Total commits",
      value: stats.totalCommits === null ? "—" : formatNumber(stats.totalCommits),
      hint: stats.totalCommitsScope === "all-time" ? "All-time, public repositories" : `In ${periodLabel(year)}`,
    },
    { label: "Active days", value: formatNumber(stats.activeDays), hint: `${activePct}% of ${periodLabel(year)}` },
    { label: "Repositories", value: formatNumber(stats.repositories), hint: "Public repositories" },
    {
      label: "Longest streak",
      value: plural(stats.longestStreak, "day"),
      hint: stats.currentStreak === null ? `In ${year}` : `Current: ${plural(stats.currentStreak, "day")}`,
    },
  ];

  return (
    <>
      {/* Profile */}
      <section className="flex items-center gap-5">
        <img
          src={proxied(user.avatarUrl, 256)}
          alt=""
          width={88}
          height={88}
          className="size-[88px] rounded-2xl border border-line object-cover"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[28px] font-semibold leading-tight tracking-tight">{name}</h1>
          <p className="font-mono text-[13px] text-accent">@{user.login}</p>
          {user.bio && <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-fg-muted">{user.bio}</p>}
          <p className="mt-1.5 text-[11px] text-fg-subtle">
            {[user.company, user.location, `Joined ${formatDate(user.createdAt, { day: undefined })}`]
              .filter(Boolean)
              .join("  ·  ")}
          </p>
        </div>
        <dl className={`grid shrink-0 grid-cols-3 divide-x divide-line text-center ${box}`}>
          {[
            ["Repos", user.publicRepos],
            ["Followers", user.followers],
            ["Following", user.following],
          ].map(([label, value]) => (
            <div key={label} className="px-3.5 py-2">
              <dt className="text-[9px] uppercase tracking-wider text-fg-subtle">{label}</dt>
              <dd className="text-[15px] font-semibold tabular-nums">{formatNumber(value as number)}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-4 gap-3">
        {statItems.map((s, i) => (
          <div
            key={s.label}
            className={`rounded-xl border px-4 py-3 ${i === 0 ? "border-accent/40 bg-accent/[0.06]" : "border-line bg-[#fbfcfd]"}`}
          >
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-fg-subtle">{s.label}</div>
            <div className="mt-1 text-[22px] font-semibold tabular-nums leading-tight">{s.value}</div>
            <div className="mt-0.5 truncate text-[10px] text-fg-subtle">{s.hint}</div>
          </div>
        ))}
      </section>

      {/* Heatmap */}
      <section>
        <SectionTitle aside={`${formatNumber(calendar?.total ?? 0)} ${unit}s in ${periodLabel(year)}`}>
          Contribution activity
        </SectionTitle>
        <div className={`${box} p-4`}>
          {days.length ? <Heatmap data={data} /> : <p className="py-6 text-center text-[12px] text-fg-subtle">No activity data.</p>}
        </div>
      </section>

      {/* Monthly + overview */}
      <section className="grid grid-cols-[minmax(0,1fr)_230px] gap-3">
        <div>
          <SectionTitle>Activity by month</SectionTitle>
          <div className={`${box} p-4`}>
            <MonthlyBars data={data} />
          </div>
        </div>
        <div>
          <SectionTitle>Activity overview</SectionTitle>
          <div className={`${box} h-[calc(100%-30px)] p-4`}>
            {calendar?.breakdown ? (
              <Breakdown b={calendar.breakdown} />
            ) : (
              <p className="text-[11px] text-fg-subtle">Not shared on this GitHub profile.</p>
            )}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section>
        <SectionTitle aside={data.achievements?.length ? `${data.achievements.length} earned` : undefined}>
          Achievements
        </SectionTitle>
        <div className={`${box} flex flex-wrap gap-x-6 gap-y-3 px-4 py-3`}>
          {data.achievements?.length ? (
            data.achievements.map((a) => (
              <div key={a.slug} className="flex w-[200px] items-center gap-3">
                <img src={proxied(a.image, 128)} alt="" width={44} height={44} className="size-11" />
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold">
                    {a.name}
                    {a.count !== null && <span className="ml-1 text-fg-subtle">x{a.count}</span>}
                  </div>
                  {a.description && <div className="line-clamp-2 text-[10px] leading-snug text-fg-subtle">{a.description}</div>}
                </div>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-fg-subtle">
              {data.achievements ? "No achievements yet." : "Achievements couldn't be loaded."}
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function Heatmap({ data }: { data: ShareData }) {
  const weeks = lastWeeks(data.calendar?.days ?? [], 53);
  const cell = 10;
  const gap = 2;
  let prevMonth = -1;
  const labels = weeks.map((w) => {
    const first = w.find(Boolean);
    const m = first ? Number(first.date.slice(5, 7)) - 1 : -1;
    const show = m !== prevMonth && m >= 0;
    prevMonth = m;
    return show ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m] : "";
  });

  return (
    <div className="flex flex-col items-center">
      <div className="flex" style={{ gap }}>
        {labels.map((l, i) => (
          <span key={i} className="relative h-3.5 text-[9px] text-fg-subtle" style={{ width: cell }}>
            <span className="absolute left-0 top-0 whitespace-nowrap">{l}</span>
          </span>
        ))}
      </div>
      <div className="flex" style={{ gap }}>
        {weeks.map((w, c) => (
          <div key={c} className="flex flex-col" style={{ gap }}>
            {w.map((d, r) => (
              <span
                key={r}
                className={d ? HEAT[d.level] : ""}
                style={{ width: cell, height: cell, borderRadius: 2.5 }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex w-full items-center justify-between text-[10px] text-fg-subtle">
        <span>
          {data.stats.bestDay
            ? `Busiest day: ${formatDate(data.stats.bestDay.date)} (${formatNumber(data.stats.bestDay.count)})`
            : ""}
        </span>
        <span className="flex items-center gap-1">
          Less
          {HEAT.map((c) => (
            <span key={c} className={`size-2.5 rounded-[2px] ${c}`} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}

function MonthlyBars({ data }: { data: ShareData }) {
  const months = monthlyTotals(data.calendar?.days ?? []).slice(-12);
  const max = Math.max(1, ...months.map((m) => m.total));
  return (
    <div className="flex h-[118px] items-end gap-2">
      {months.map((m) => (
        <div key={m.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[9px] tabular-nums text-fg-muted">{m.total || ""}</span>
          <div
            className="w-full rounded-t-[3px] bg-heat-3"
            style={{ height: m.total ? `${Math.max(3, (m.total / max) * 82)}px` : 2, opacity: m.total ? 1 : 0.3 }}
          />
          <span className="text-[9px] text-fg-subtle">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

function Breakdown({ b }: { b: ContributionBreakdown }) {
  const rows = [
    ["Commits", b.commits],
    ["Pull requests", b.pullRequests],
    ["Issues", b.issues],
    ["Code review", b.codeReview],
  ] as const;
  return (
    <ul className="space-y-2.5">
      {[...rows]
        .sort((x, y) => y[1] - x[1])
        .map(([label, value]) => (
          <li key={label}>
            <div className="flex justify-between text-[11px]">
              <span>{label}</span>
              <span className="font-semibold tabular-nums">{value}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-heat-0">
              <div className="h-full rounded-full bg-heat-3" style={{ width: `${value}%` }} />
            </div>
          </li>
        ))}
    </ul>
  );
}

function TopRepos({ data }: { data: ShareData }) {
  const repos = data.topRepos.slice(0, 8);
  const max = Math.max(1, ...repos.map((r) => r.commits));
  return (
    <section>
      <SectionTitle aside="By commits">Top repositories</SectionTitle>
      <div className={`${box} grid grid-cols-2 gap-x-6 gap-y-2.5 px-4 py-3`}>
        {repos.map((r) => (
          <div key={r.repo}>
            <div className="flex justify-between gap-3 text-[11px]">
              <span className="truncate">
                <span className="text-fg-subtle">{r.repo.split("/")[0]}/</span>
                <span className="font-semibold">{r.repo.split("/")[1]}</span>
              </span>
              <span className="shrink-0 tabular-nums text-fg-muted">{plural(r.commits, "commit")}</span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-heat-0">
              <div className="h-full rounded-full bg-heat-3" style={{ width: `${(r.commits / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CommitTable({ rows, title, empty }: { rows: CommitItem[]; title: string; empty: string }) {
  return (
    <section className="min-h-0">
      <SectionTitle>{title}</SectionTitle>
      {rows.length === 0 ? (
        <p className={`${box} px-4 py-6 text-center text-[12px] text-fg-subtle`}>{empty}</p>
      ) : (
        <table className={`w-full table-fixed overflow-hidden text-[11px] ${box}`} style={{ borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr className="text-left text-[9px] uppercase tracking-wider text-fg-subtle">
              <th className="w-[88px] px-3 py-2 font-medium">Date</th>
              <th className="w-[150px] px-2 py-2 font-medium">Repository</th>
              <th className="px-2 py-2 font-medium">Message</th>
              <th className="w-[70px] px-3 py-2 text-right font-medium">Commit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.sha} className="border-t border-line">
                <td className="whitespace-nowrap border-t border-line px-3 py-[9px] text-fg-muted">{formatDate(c.date)}</td>
                <td className="truncate border-t border-line px-2 py-[9px] font-semibold">{c.repo.split("/")[1]}</td>
                <td className="truncate border-t border-line px-2 py-[9px] text-fg-muted">{c.message.split("\n")[0]}</td>
                <td className="border-t border-line px-3 py-[9px] text-right font-mono text-[10px] text-fg-subtle">
                  {c.sha.slice(0, 7)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
