import { cache } from "react";
import { isValidUsername } from "./parse-github-url";
import {
  assignLevels,
  calendarFromCommits,
  computeStreaks,
  findBestDay,
  reposFromCommits,
  toISODate,
} from "./stats";
import type {
  Achievement,
  CommitItem,
  ContributionBreakdown,
  ContributionCalendar,
  ContributionDay,
  ContributionLevel,
  DevShowProfile,
  GitHubUser,
  RepoActivity,
} from "./types";

const API = "https://api.github.com";
/** Seconds GitHub responses stay in the Next.js data cache. */
const REVALIDATE = 60 * 30;

export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly kind: "not-found" | "rate-limited" | "invalid" | "upstream",
    public readonly status: number,
    public readonly resetAt?: string,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

const token = () => process.env.GITHUB_TOKEN?.trim() || undefined;

function headers(extra: Record<string, string> = {}): HeadersInit {
  const t = token();
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "DevShow",
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...extra,
  };
}

function assertOk(res: Response, what: string) {
  if (res.ok) return;
  if (res.status === 404) throw new GitHubError(`${what} not found.`, "not-found", 404);

  const remaining = res.headers.get("x-ratelimit-remaining");
  if (res.status === 429 || (res.status === 403 && remaining === "0")) {
    const reset = Number(res.headers.get("x-ratelimit-reset"));
    throw new GitHubError(
      "GitHub's API rate limit was reached. Please try again in a few minutes.",
      "rate-limited",
      429,
      Number.isFinite(reset) && reset > 0 ? new Date(reset * 1000).toISOString() : undefined,
    );
  }
  throw new GitHubError(`GitHub returned ${res.status} while loading ${what}.`, "upstream", 502);
}

async function getJSON<T>(url: string, what: string): Promise<T> {
  const res = await fetch(url, { headers: headers(), next: { revalidate: REVALIDATE } });
  assertOk(res, what);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

interface RestUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  company: string | null;
  location: string | null;
  blog: string | null;
  created_at: string;
  type: string;
}

async function fetchUser(username: string): Promise<GitHubUser> {
  const u = await getJSON<RestUser>(`${API}/users/${encodeURIComponent(username)}`, "GitHub user");
  return {
    login: u.login,
    name: u.name,
    avatarUrl: u.avatar_url,
    bio: u.bio,
    htmlUrl: u.html_url,
    publicRepos: u.public_repos,
    followers: u.followers,
    following: u.following,
    company: u.company,
    location: u.location,
    blog: u.blog,
    createdAt: u.created_at,
  };
}

// ---------------------------------------------------------------------------
// Commits (REST commit search: works with or without a token)
// ---------------------------------------------------------------------------

interface SearchCommitsResponse {
  total_count: number;
  items: {
    sha: string;
    html_url: string;
    commit: { message: string; author: { date: string } | null; committer: { date: string } | null };
    repository: { full_name: string; html_url: string };
  }[];
}

async function fetchCommits(username: string) {
  const q = encodeURIComponent(`author:${username}`);
  const data = await getJSON<SearchCommitsResponse>(
    `${API}/search/commits?q=${q}&sort=author-date&order=desc&per_page=100`,
    "commits",
  );
  const items: CommitItem[] = data.items.map((it) => ({
    sha: it.sha,
    message: it.commit.message,
    date: it.commit.author?.date ?? it.commit.committer?.date ?? "",
    url: it.html_url,
    repo: it.repository.full_name,
    repoUrl: it.repository.html_url,
  }));
  return { total: data.total_count, items };
}

// ---------------------------------------------------------------------------
// Contribution calendar
// ---------------------------------------------------------------------------

const LEVELS: Record<string, ContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

/** An inclusive date range (YYYY-MM-DD); `null` means GitHub's default trailing year. */
type Range = { from: string; to: string } | null;

const calendarQuery = (ranged: boolean) => /* GraphQL */ `
  query ($login: String!${ranged ? ", $from: DateTime!, $to: DateTime!" : ""}) {
    user(login: $login) {
      contributionsCollection${ranged ? "(from: $from, to: $to)" : ""} {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount contributionLevel } }
        }
        commitContributionsByRepository(maxRepositories: 8) {
          repository { nameWithOwner url }
          contributions { totalCount }
        }
      }
    }
  }
`;

interface GraphQLCalendarResponse {
  data?: {
    user: {
      contributionsCollection: {
        totalCommitContributions: number;
        totalIssueContributions: number;
        totalPullRequestContributions: number;
        totalPullRequestReviewContributions: number;
        contributionCalendar: {
          totalContributions: number;
          weeks: {
            contributionDays: { date: string; contributionCount: number; contributionLevel: string }[];
          }[];
        };
        commitContributionsByRepository: {
          repository: { nameWithOwner: string; url: string };
          contributions: { totalCount: number };
        }[];
      };
    } | null;
  };
  errors?: { message: string }[];
}

async function fetchGraphQLCalendar(username: string, range: Range) {
  const variables = range
    ? { login: username, from: `${range.from}T00:00:00Z`, to: `${range.to}T23:59:59Z` }
    : { login: username };
  const res = await fetch(`${API}/graphql`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ query: calendarQuery(!!range), variables }),
    next: { revalidate: REVALIDATE },
  });
  assertOk(res, "contribution calendar");
  const json = (await res.json()) as GraphQLCalendarResponse;
  const collection = json.data?.user?.contributionsCollection;
  if (!collection) throw new GitHubError(json.errors?.[0]?.message ?? "No calendar data.", "upstream", 502);

  const days = clip(
    collection.contributionCalendar.weeks
      .flatMap((w) => w.contributionDays)
      .map((d) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 })),
    range,
  );

  const calendar: ContributionCalendar = {
    days,
    total: days.reduce((sum, d) => sum + d.count, 0),
    source: "graphql",
    breakdown: toBreakdown({
      commits: collection.totalCommitContributions,
      pullRequests: collection.totalPullRequestContributions,
      issues: collection.totalIssueContributions,
      codeReview: collection.totalPullRequestReviewContributions,
    }),
  };
  const repos: RepoActivity[] = collection.commitContributionsByRepository.map((r) => ({
    repo: r.repository.nameWithOwner,
    url: r.repository.url,
    commits: r.contributions.totalCount,
  }));
  return { calendar, repos, commitsInPeriod: collection.totalCommitContributions };
}

/** Raw counts → whole percentages, or null when there's nothing to split. */
function toBreakdown(counts: ContributionBreakdown): ContributionBreakdown | null {
  const sum = counts.commits + counts.pullRequests + counts.issues + counts.codeReview;
  if (sum === 0) return null;
  const pct = (n: number) => Math.round((n / sum) * 100);
  return {
    commits: pct(counts.commits),
    pullRequests: pct(counts.pullRequests),
    issues: pct(counts.issues),
    codeReview: pct(counts.codeReview),
  };
}

/**
 * The public calendar fragment carries GitHub's "Activity overview" as
 * data-percentages='{"Commits":81,"Pull requests":19,"Issues":0,"Code review":0}'.
 */
function parsePublicBreakdown(html: string): ContributionBreakdown | null {
  const raw = html.match(/data-percentages="([^"]+)"/)?.[1];
  if (!raw) return null;
  try {
    const p = JSON.parse(decodeEntities(raw)) as Record<string, number>;
    const b = {
      commits: p["Commits"] ?? 0,
      pullRequests: p["Pull requests"] ?? 0,
      issues: p["Issues"] ?? 0,
      codeReview: p["Code review"] ?? 0,
    };
    return b.commits + b.pullRequests + b.issues + b.codeReview > 0 ? b : null;
  } catch {
    return null;
  }
}

/** Keep only days inside the range, and never days after today (GitHub pads the current year). */
function clip(days: ContributionDay[], range: Range): ContributionDay[] {
  const today = toISODate(new Date());
  return days.filter((d) => d.date <= today && (!range || (d.date >= range.from && d.date <= range.to)));
}

/**
 * Tokenless fallback: GitHub serves the public contribution graph as an HTML fragment.
 * Each day is a <td data-date data-level id> paired with a <tool-tip for=id> holding the count.
 */
async function fetchPublicCalendar(username: string, range: Range): Promise<ContributionCalendar> {
  const query = range ? `?from=${range.from}&to=${range.to}` : "";
  const res = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions${query}`, {
    headers: { "User-Agent": "DevShow", Accept: "text/html" },
    next: { revalidate: REVALIDATE },
  });
  assertOk(res, "contribution calendar");
  const html = await res.text();

  const counts = new Map<string, number>();
  for (const m of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = m[2].match(/^\s*([\d,]+)\s+contribution/);
    counts.set(m[1], n ? Number(n[1].replace(/,/g, "")) : 0);
  }

  const days: ContributionCalendar["days"] = [];
  for (const m of html.matchAll(/<td\b[^>]*class="[^"]*ContributionCalendar-day[^"]*"[^>]*>/g)) {
    const tag = m[0];
    const date = tag.match(/data-date="([^"]+)"/)?.[1];
    const id = tag.match(/\bid="([^"]+)"/)?.[1];
    const level = Number(tag.match(/data-level="(\d)"/)?.[1] ?? 0) as ContributionLevel;
    if (date) days.push({ date, count: (id && counts.get(id)) || 0, level });
  }
  if (days.length === 0) throw new GitHubError("Could not read the public calendar.", "upstream", 502);

  days.sort((a, b) => a.date.localeCompare(b.date));
  const inRange = clip(days, range);
  // If GitHub ever drops the tooltips, fall back to counts-free levels rather than all zeroes.
  const hasCounts = days.some((d) => d.count > 0) || days.every((d) => d.level === 0);
  const finalDays = hasCounts ? inRange : assignLevels(inRange.map((d) => ({ date: d.date, count: d.level })));
  return {
    days: finalDays,
    total: finalDays.reduce((sum, d) => sum + d.count, 0),
    source: "public-calendar",
    breakdown: parsePublicBreakdown(html),
  };
}

/** Years selectable for a user: from the year they joined through the current year. */
function yearsSince(createdAt: string): number[] {
  const first = new Date(createdAt).getUTCFullYear();
  const now = new Date().getUTCFullYear();
  return Array.from({ length: now - first + 1 }, (_, i) => now - i);
}

function rangeFor(year: number | null): Range {
  if (year === null) return null;
  const today = toISODate(new Date());
  const end = `${year}-12-31`;
  return { from: `${year}-01-01`, to: end < today ? end : today };
}

function yearDates(range: NonNullable<Range>): string[] {
  const out: string[] = [];
  const cursor = new Date(`${range.from}T00:00:00Z`);
  for (; toISODate(cursor) <= range.to; cursor.setUTCDate(cursor.getUTCDate() + 1)) out.push(toISODate(cursor));
  return out;
}

// ---------------------------------------------------------------------------
// Achievements (no API exists; read from the public profile page)
// ---------------------------------------------------------------------------

/** GitHub's own descriptions for the publicly documented achievements. */
const ACHIEVEMENT_INFO: Record<string, string> = {
  "pull-shark": "Opened pull requests that have been merged.",
  quickdraw: "Closed an issue or pull request within 5 minutes of opening.",
  yolo: "Merged a pull request without code review.",
  starstruck: "Created a repository that has many stars.",
  "pair-extraordinaire": "Coauthored commits on merged pull requests.",
  "galaxy-brain": "Answered discussions.",
  "public-sponsor": "Sponsored an open source contributor through GitHub Sponsors.",
  "heart-on-your-sleeve": "Reacted to something with a ❤️ emoji.",
  "open-sourcerer": "Had pull requests merged in multiple public repositories.",
  "arctic-code-vault-contributor": "Contributed code to repositories in the 2020 GitHub Archive Program.",
  "mars-2020-contributor": "Contributed code to repositories used in the Mars 2020 Helicopter Mission.",
};

const decodeEntities = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

async function fetchAchievements(username: string): Promise<Achievement[]> {
  const res = await fetch(`https://github.com/${encodeURIComponent(username)}?tab=achievements`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; DevShow)", Accept: "text/html" },
    next: { revalidate: REVALIDATE },
  });
  assertOk(res, "achievements");
  const html = await res.text();

  const achievements: Achievement[] = [];
  const seen = new Set<string>();
  // Each badge is rendered as `class="achievement-card ..."` followed by its image, title and tier label.
  for (const block of html.split(/class="achievement-card[\s"]/).slice(1)) {
    const image = block.match(/<img[^>]*src="([^"]+)"[^>]*class="achievement-badge-card"/)?.[1];
    const name = block.match(/<h3[^>]*>\s*([^<]+?)\s*<\/h3>/)?.[1];
    const slug = block.match(/\/achievements\/([a-z0-9-]+)\/detail/)?.[1];
    if (!image || !name || !slug || seen.has(slug)) continue;
    seen.add(slug);

    const tierMatch = block.match(/achievement-tier-label--(bronze|silver|gold)[^>]*>\s*x(\d+)/);
    achievements.push({
      slug,
      name: decodeEntities(name),
      image,
      tier: (tierMatch?.[1] as Achievement["tier"]) ?? "default",
      count: tierMatch ? Number(tierMatch[2]) : null,
      description: ACHIEVEMENT_INFO[slug] ?? null,
      url: `https://github.com/${username}?achievement=${slug}&tab=achievements`,
    });
  }
  return achievements;
}

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

async function loadProfile(username: string, year: number | null): Promise<DevShowProfile> {
  if (!isValidUsername(username)) {
    throw new GitHubError("That isn't a valid GitHub username.", "invalid", 400);
  }
  const range = rangeFor(year);

  // The user lookup decides not-found; everything else degrades gracefully.
  const [user, commitsRes, graphRes, achievementsRes] = await Promise.all([
    fetchUser(username),
    fetchCommits(username).then(ok, fail),
    token() ? fetchGraphQLCalendar(username, range).then(ok, fail) : Promise.resolve(null),
    fetchAchievements(username).then(ok, fail),
  ]);

  const warnings: string[] = [];
  let calendar: ContributionCalendar | null = graphRes?.ok ? graphRes.value.calendar : null;
  if (!calendar) {
    const pub = await fetchPublicCalendar(user.login, range).then(ok, fail);
    if (pub.ok) calendar = pub.value;
  }

  const commits = commitsRes.ok ? commitsRes.value : null;
  if (!commitsRes.ok) warnings.push(describe(commitsRes.error, "Recent commits"));

  if (!calendar && commits?.items.length) {
    const days = calendarFromCommits(commits.items, range ? yearDates(range) : undefined);
    calendar = { days, total: days.reduce((s, d) => s + d.count, 0), source: "recent-commits", breakdown: null };
    warnings.push("The contribution calendar couldn't be loaded, so the heatmap shows recent commits only.");
  } else if (!calendar) {
    warnings.push("The contribution calendar couldn't be loaded.");
  }

  const days = calendar?.days ?? [];
  const { longest, current } = computeStreaks(days);
  const graphRepos = graphRes?.ok ? graphRes.value.repos : [];
  const useGraphRepos = graphRepos.length > 0;
  const isPastYear = year !== null && year < new Date().getUTCFullYear();

  let totalCommits: number | null = commits?.total ?? null;
  let scope: "all-time" | "period" = "all-time";
  if (totalCommits === null && graphRes?.ok) {
    totalCommits = graphRes.value.commitsInPeriod;
    scope = "period";
  }

  return {
    user,
    year,
    availableYears: yearsSince(user.createdAt),
    calendar,
    recentCommits: commits?.items ?? null,
    topRepos: useGraphRepos ? graphRepos : reposFromCommits(commits?.items ?? []).slice(0, 8),
    topReposScope: useGraphRepos ? "period" : "recent",
    achievements: achievementsRes.ok ? achievementsRes.value : null,
    stats: {
      totalCommits,
      totalCommitsScope: scope,
      activeDays: days.filter((d) => d.count > 0).length,
      repositories: user.publicRepos,
      longestStreak: longest,
      // A "current" streak only means something when the period ends today.
      currentStreak: isPastYear ? null : current,
      bestDay: findBestDay(days),
    },
    warnings,
    fetchedAt: new Date().toISOString(),
  };
}

type Settled<T> = { ok: true; value: T } | { ok: false; error: unknown };
const ok = <T,>(value: T): Settled<T> => ({ ok: true, value });
const fail = (error: unknown): Settled<never> => ({ ok: false, error });

function describe(error: unknown, what: string) {
  if (error instanceof GitHubError && error.kind === "rate-limited") {
    return `${what} are temporarily unavailable: GitHub's rate limit was reached.`;
  }
  return `${what} couldn't be loaded from GitHub.`;
}

/** Deduplicated per request, so generateMetadata and the page share one fetch. */
export const getDevShowProfile = cache((username: string, year: number | null = null) =>
  loadProfile(username.toLowerCase(), year),
);
