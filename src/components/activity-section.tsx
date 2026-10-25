import { formatNumber, periodLabel, plural } from "@/lib/format";
import type { ContributionBreakdown, ContributionCalendar, DevStats } from "@/lib/types";
import { ContributionHeatmap, HeatmapLegend } from "./contribution-heatmap";
import { BestDayNote } from "./stat-cards";
import { CalendarIcon, CommitIcon, IssueIcon, PullRequestIcon, ReviewIcon } from "./icons";
import { Card, CardHeader, delay } from "./ui";
import { YearSelect } from "./year-select";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const SOURCE_NOTE: Record<ContributionCalendar["source"], string> = {
  graphql: "Commits, pull requests, issues and reviews, as counted by GitHub.",
  "public-calendar": "Commits, pull requests, issues and reviews from the public contribution graph.",
  "recent-commits": "Built from the most recent public commits only.",
};

interface Props {
  calendar: ContributionCalendar | null;
  stats: DevStats;
  username: string;
  year: number | null;
  years: number[];
}

export function ActivitySection({ calendar, stats, username, year, years }: Props) {
  const select = <YearSelect key={year ?? "rolling"} username={username} years={years} value={year} />;
  const cardClass = "transition-opacity duration-200 data-[pending]:pointer-events-none data-[pending]:opacity-50";

  if (!calendar || calendar.total === 0) {
    return (
      <Card style={delay(5)} className={cardClass}>
        <CardHeader id="activity" icon={CalendarIcon} title="Contribution activity" action={select} />
        <EmptyActivity hasCalendar={!!calendar} year={year} />
      </Card>
    );
  }

  const unit = calendar.source === "recent-commits" ? "commit" : "contribution";

  return (
    <Card style={delay(5)} className={`overflow-visible ${cardClass}`}>
      <CardHeader
        id="activity"
        icon={CalendarIcon}
        title={`${plural(calendar.total, unit)} in ${periodLabel(year)}`}
        description={SOURCE_NOTE[calendar.source]}
        action={select}
      />
      <div className="px-5 pt-5 sm:px-6">
        <ContributionHeatmap key={year ?? "rolling"} days={calendar.days} unit={unit} />
      </div>
      <div className="flex flex-col-reverse gap-3 px-5 pb-5 pt-3 text-xs text-fg-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <BestDayNote stats={stats} />
        <HeatmapLegend />
      </div>
      <div
        className={`grid border-t border-line ${calendar.breakdown ? "lg:grid-cols-[minmax(0,1fr)_320px]" : ""}`}
      >
        <MonthlyBars calendar={calendar} unit={unit} />
        {calendar.breakdown && <ActivityOverview breakdown={calendar.breakdown} year={year} />}
      </div>
    </Card>
  );
}

const OVERVIEW_ROWS = [
  { key: "commits", label: "Commits", Icon: CommitIcon },
  { key: "pullRequests", label: "Pull requests", Icon: PullRequestIcon },
  { key: "issues", label: "Issues", Icon: IssueIcon },
  { key: "codeReview", label: "Code review", Icon: ReviewIcon },
] as const;

/** GitHub's "Activity overview": the share of contributions by type, as a ranked bar list. */
function ActivityOverview({ breakdown, year }: { breakdown: ContributionBreakdown; year: number | null }) {
  const rows = [...OVERVIEW_ROWS].sort((a, b) => breakdown[b.key] - breakdown[a.key]);

  return (
    <div className="border-t border-line px-5 py-5 sm:px-6 lg:border-l lg:border-t-0">
      <h3 className="text-sm font-medium text-fg-muted">Activity overview</h3>
      <p className="mt-0.5 text-xs text-fg-subtle">Share of contributions in {periodLabel(year)}</p>
      <ul className="mt-4 space-y-3.5">
        {rows.map(({ key, label, Icon }) => {
          const value = breakdown[key];
          return (
            <li key={key} className={value === 0 ? "opacity-55" : undefined}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 text-fg">
                  <Icon className={`size-4 ${value > 0 ? "text-accent" : "text-fg-subtle"}`} />
                  {label}
                </span>
                <span className="font-semibold tabular-nums text-fg">{value}%</span>
              </div>
              <div
                role="meter"
                aria-label={`${label}: ${value}% of contributions`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={value}
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-tint/[0.07]"
              >
                <div
                  className="h-full rounded-full bg-linear-to-r from-heat-2 to-accent"
                  style={{ width: value > 0 ? `max(${value}%, 4px)` : 0 }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MonthlyBars({ calendar, unit }: { calendar: ContributionCalendar; unit: string }) {
  const buckets: { key: string; label: string; year: string; total: number }[] = [];
  for (const d of calendar.days) {
    const key = d.date.slice(0, 7);
    let last = buckets[buckets.length - 1];
    if (!last || last.key !== key) {
      last = { key, label: MONTHS[Number(key.slice(5)) - 1], year: key.slice(0, 4), total: 0 };
      buckets.push(last);
    }
    last.total += d.count;
  }
  const months = buckets.slice(-12);
  const max = Math.max(1, ...months.map((m) => m.total));

  return (
    <div className="min-w-0 px-5 py-5 sm:px-6">
      <h3 className="mb-4 text-sm font-medium text-fg-muted">Activity by month</h3>
      <div className="flex h-32 items-end gap-1.5 sm:gap-2.5" role="list" aria-label={`Monthly ${unit}s`}>
        {months.map((m) => (
          <div
            key={m.key}
            role="listitem"
            aria-label={`${m.label} ${m.year}: ${plural(m.total, unit)}`}
            className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-md border border-line-strong bg-popover px-2 py-1 text-xs text-fg opacity-0 shadow-lg transition group-hover:opacity-100">
              {formatNumber(m.total)} <span className="text-fg-muted">· {m.label} {m.year}</span>
            </span>
            <div
              className="w-full max-w-9 rounded-t-[4px] bg-heat-3 transition group-hover:bg-heat-4"
              style={{ height: m.total ? `max(${(m.total / max) * 100}%, 3px)` : "2px", opacity: m.total ? 1 : 0.25 }}
            />
            <span className="text-[10px] text-fg-subtle sm:text-[11px]">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyActivity({ hasCalendar, year }: { hasCalendar: boolean; year: number | null }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div aria-hidden className="mb-5 grid grid-cols-7 gap-1 opacity-60">
        {Array.from({ length: 21 }, (_, i) => (
          <span key={i} className="size-3 rounded-[3px] bg-heat-0 outline outline-1 outline-tint/[0.05]" />
        ))}
      </div>
      <p className="font-medium text-fg">{hasCalendar ? (year === null ? "No public contributions yet" : `No public contributions in ${year}`) : "Activity unavailable"}</p>
      <p className="mt-1 max-w-sm text-sm text-fg-subtle">
        {hasCalendar
          ? `This developer has no public contributions in ${periodLabel(year)}. Private activity isn't shown unless they've enabled it on GitHub.`
          : "We couldn't load the contribution calendar from GitHub right now. Try again in a moment."}
      </p>
    </div>
  );
}
