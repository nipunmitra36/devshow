import type { ComponentType, SVGProps } from "react";
import { formatDate, formatNumber, periodLabel, plural } from "@/lib/format";
import type { DevStats } from "@/lib/types";
import { CalendarIcon, CommitIcon, FlameIcon, RepoIcon } from "./icons";
import { IconTile, TopHighlight, delay } from "./ui";

interface Stat {
  label: string;
  value: string;
  /** Small unit after the number, e.g. "days". */
  unit?: string;
  hint: string;
  /** Pill in the top-right corner. */
  badge?: string;
  /** 0–1 fill for a progress meter, with an accessible description. */
  meter?: { value: number; label: string };
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  highlight?: boolean;
}

export function StatCards({
  stats,
  calendarDays,
  year,
}: {
  stats: DevStats;
  calendarDays: number;
  year: number | null;
}) {
  const period = year === null ? "the last year" : year === new Date().getUTCFullYear() ? `${year} so far` : String(year);
  const activeShare = calendarDays ? stats.activeDays / calendarDays : 0;

  const items: Stat[] = [
    {
      label: "Total Commits",
      value: stats.totalCommits === null ? "—" : formatNumber(stats.totalCommits),
      badge: stats.totalCommitsScope === "all-time" ? "All-time" : year === null ? "12 mo" : String(year),
      hint: stats.totalCommitsScope === "all-time" ? "Public repositories, default branches" : `In ${periodLabel(year)}`,
      Icon: CommitIcon,
      highlight: true,
    },
    {
      label: "Active Days",
      value: formatNumber(stats.activeDays),
      hint: calendarDays ? `${Math.round(activeShare * 100)}% of ${period}` : `In ${periodLabel(year)}`,
      meter: calendarDays ? { value: activeShare, label: `${Math.round(activeShare * 100)}% of days active` } : undefined,
      Icon: CalendarIcon,
    },
    {
      label: "Repositories",
      value: formatNumber(stats.repositories),
      hint: "Public repositories",
      Icon: RepoIcon,
    },
    {
      label: "Longest Streak",
      value: formatNumber(stats.longestStreak),
      unit: stats.longestStreak === 1 ? "day" : "days",
      hint:
        stats.currentStreak === null
          ? `In ${year}`
          : stats.currentStreak > 0
            ? `Current streak: ${plural(stats.currentStreak, "day")}`
            : "No active streak",
      meter:
        stats.currentStreak !== null && stats.longestStreak > 0
          ? {
              value: stats.currentStreak / stats.longestStreak,
              label: `Current streak is ${stats.currentStreak} of ${stats.longestStreak} days`,
            }
          : undefined,
      Icon: FlameIcon,
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {items.map(({ label, value, unit, hint, badge, meter, Icon, highlight }, i) => (
        <div
          key={label}
          style={delay(i + 1)}
          className={`${highlight ? "card-premium-accent" : "card-premium"} animate-fade-up group relative flex flex-col overflow-hidden rounded-2xl p-4 sm:p-5`}
        >
          <TopHighlight accent={highlight} />
          {/* Hover glow */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 h-32 w-3/4 -translate-x-1/2 rounded-full bg-accent/15 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
          />

          <dt className="relative">
            <span className="flex items-start justify-between gap-2">
              <IconTile icon={Icon} tone={highlight ? "accent" : "neutral"} />
              {badge && (
                <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  {badge}
                </span>
              )}
            </span>
            <span className="mt-4 block text-[11px] font-medium uppercase tracking-[0.08em] text-fg-subtle">{label}</span>
          </dt>

          <dd className="relative mt-1.5 flex flex-1 flex-col">
            <span className="flex items-baseline gap-1.5 leading-none">
              <span className="text-[26px] font-semibold tracking-tight tabular-nums text-fg sm:text-[32px]">{value}</span>
              {unit && <span className="text-sm font-medium text-fg-subtle">{unit}</span>}
            </span>

            <span className="mt-auto block pt-4">
              {meter && (
                <span
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(Math.min(1, meter.value) * 100)}
                  aria-label={meter.label}
                  className="mb-2 block h-1.5 overflow-hidden rounded-full bg-tint/[0.07]"
                >
                  <span
                    className="block h-full rounded-full bg-linear-to-r from-heat-2 to-accent"
                    style={{ width: `${Math.max(3, Math.min(1, meter.value) * 100)}%` }}
                  />
                </span>
              )}
              <span className="block truncate text-xs text-fg-subtle">{hint}</span>
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function BestDayNote({ stats }: { stats: DevStats }) {
  if (!stats.bestDay) return null;
  return (
    <span>
      Busiest day: <span className="text-fg-muted">{formatDate(stats.bestDay.date)}</span> ({formatNumber(stats.bestDay.count)})
    </span>
  );
}
