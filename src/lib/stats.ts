import type { CommitItem, ContributionDay, ContributionLevel, RepoActivity } from "./types";

export function computeStreaks(days: ContributionDay[]) {
  let longest = 0;
  let run = 0;
  for (const day of days) {
    run = day.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  // Current streak counts back from today; an empty "today" doesn't break it yet.
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++;
    else if (i === days.length - 1) continue;
    else break;
  }
  return { longest, current };
}

export function findBestDay(days: ContributionDay[]): ContributionDay | null {
  let best: ContributionDay | null = null;
  for (const d of days) if (d.count > 0 && (!best || d.count > best.count)) best = d;
  return best;
}

/** Quartile-based levels, used when the source doesn't provide them. */
export function assignLevels(counts: { date: string; count: number }[]): ContributionDay[] {
  const nonZero = counts.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  const q = (p: number) => nonZero[Math.min(nonZero.length - 1, Math.floor(p * nonZero.length))] ?? 0;
  const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
  return counts.map(({ date, count }) => {
    let level: ContributionLevel = 0;
    if (count > 0) level = count <= q1 ? 1 : count <= q2 ? 2 : count <= q3 ? 3 : 4;
    return { date, count, level };
  });
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Every date from the Sunday ~52 weeks ago through today (UTC), oldest first. */
export function lastYearDates(today = new Date()): string[] {
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const cursor = new Date(end);
  cursor.setUTCDate(cursor.getUTCDate() - 364);
  cursor.setUTCDate(cursor.getUTCDate() - cursor.getUTCDay());
  const out: string[] = [];
  for (; cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) out.push(toISODate(cursor));
  return out;
}

/** Fallback calendar built from whatever commits we have. */
export function calendarFromCommits(commits: CommitItem[], dates = lastYearDates()): ContributionDay[] {
  const byDate = new Map<string, number>();
  for (const c of commits) {
    const key = c.date.slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + 1);
  }
  return assignLevels(dates.map((date) => ({ date, count: byDate.get(date) ?? 0 })));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Contribution totals per calendar month, oldest first. */
export function monthlyTotals(days: ContributionDay[]) {
  const buckets: { key: string; label: string; year: string; total: number }[] = [];
  for (const d of days) {
    const key = d.date.slice(0, 7);
    let last = buckets[buckets.length - 1];
    if (!last || last.key !== key) {
      last = { key, label: MONTHS[Number(key.slice(5)) - 1], year: key.slice(0, 4), total: 0 };
      buckets.push(last);
    }
    last.total += d.count;
  }
  return buckets;
}

export function reposFromCommits(commits: CommitItem[]): RepoActivity[] {
  const map = new Map<string, RepoActivity>();
  for (const c of commits) {
    const entry = map.get(c.repo) ?? { repo: c.repo, url: c.repoUrl, commits: 0 };
    entry.commits++;
    map.set(c.repo, entry);
  }
  return [...map.values()].sort((a, b) => b.commits - a.commits);
}
