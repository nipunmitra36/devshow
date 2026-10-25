export interface GitHubUser {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  htmlUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
  company: string | null;
  location: string | null;
  blog: string | null;
  createdAt: string;
}

/** 0 = none, 1 = low, 2 = medium, 3 = high, 4 = very high */
export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
  level: ContributionLevel;
}

export type CalendarSource = "graphql" | "public-calendar" | "recent-commits";

/** Share of contributions by type, in whole percent (GitHub's "Activity overview"). */
export interface ContributionBreakdown {
  commits: number;
  pullRequests: number;
  issues: number;
  codeReview: number;
}

export interface ContributionCalendar {
  days: ContributionDay[];
  total: number;
  source: CalendarSource;
  /** null when GitHub doesn't expose it (e.g. the user hid "Activity overview"). */
  breakdown: ContributionBreakdown | null;
}

export interface CommitItem {
  sha: string;
  message: string;
  date: string; // ISO timestamp
  url: string;
  repo: string; // owner/name
  repoUrl: string;
}

export interface RepoActivity {
  repo: string;
  url: string;
  commits: number;
}

export interface Achievement {
  slug: string; // e.g. "pull-shark"
  name: string; // e.g. "Pull Shark"
  image: string; // badge artwork on github.githubassets.com
  tier: "default" | "bronze" | "silver" | "gold";
  /** Multiplier shown on tiered badges ("x3" → 3), or null for single-tier badges. */
  count: number | null;
  description: string | null;
  url: string;
}

export interface DevStats {
  totalCommits: number | null;
  /** "period" = the selected year, or the trailing year when none is selected. */
  totalCommitsScope: "all-time" | "period";
  activeDays: number;
  repositories: number;
  longestStreak: number;
  /** null for past years, where a "current" streak doesn't apply. */
  currentStreak: number | null;
  bestDay: ContributionDay | null;
}

export interface DevShowProfile {
  user: GitHubUser;
  /** Selected calendar year, or null for the trailing 12 months. */
  year: number | null;
  availableYears: number[];
  calendar: ContributionCalendar | null;
  recentCommits: CommitItem[] | null;
  topRepos: RepoActivity[];
  topReposScope: "period" | "recent";
  /** null when GitHub's profile page couldn't be read. */
  achievements: Achievement[] | null;
  stats: DevStats;
  warnings: string[];
  fetchedAt: string;
}
