import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivitySection } from "@/components/activity-section";
import { AlertIcon, ArrowLeftIcon } from "@/components/icons";
import { ProfileForm } from "@/components/profile-form";
import { ProfileHeader } from "@/components/profile-header";
import { RecentCommits } from "@/components/recent-commits";
import { ShareButton } from "@/components/share-dialog";
import { StatCards } from "@/components/stat-cards";
import { TopRepos } from "@/components/top-repos";
import { Achievements } from "@/components/achievements";
import { ErrorState } from "@/components/states";
import { GitHubError, getDevShowProfile } from "@/lib/github";
import { isValidUsername, parseYear } from "@/lib/parse-github-url";

type Props = {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ year?: string | string[] }>;
};

export const revalidate = 1800;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { username } = await params;
  if (!isValidUsername(username)) return { title: "Invalid profile" };
  try {
    const { user, stats } = await getDevShowProfile(username, parseYear((await searchParams).year));
    const name = user.name ?? user.login;
    const description =
      user.bio ??
      `${name}'s GitHub activity on DevShow${stats.totalCommits ? ` — ${stats.totalCommits.toLocaleString("en-US")} commits` : ""}.`;
    return {
      title: `${name} (@${user.login})`,
      description,
      alternates: { canonical: `/github/${user.login}` },
      openGraph: {
        type: "profile",
        title: `${name} (@${user.login}) · DevShow`,
        description,
        images: [{ url: user.avatarUrl, width: 460, height: 460, alt: name }],
      },
      twitter: { card: "summary", title: `${name} · DevShow`, description, images: [user.avatarUrl] },
    };
  } catch {
    return { title: `@${username}`, robots: { index: false } };
  }
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = await params;
  if (!isValidUsername(username)) notFound();

  let profile;
  try {
    profile = await getDevShowProfile(username, parseYear((await searchParams).year));
  } catch (err) {
    if (err instanceof GitHubError && (err.kind === "not-found" || err.kind === "invalid")) notFound();
    if (err instanceof GitHubError && err.kind === "rate-limited") {
      return (
        <Shell username={username}>
          <ErrorState
            title="GitHub rate limit reached"
            body={`DevShow has hit GitHub's API limit${
              err.resetAt ? ` until ${new Date(err.resetAt).toUTCString().slice(17, 22)} UTC` : ""
            }. Please try again shortly.`}
            retry
          />
        </Shell>
      );
    }
    return (
      <Shell username={username}>
        <ErrorState title="Couldn't reach GitHub" body="Something went wrong loading this profile. Please try again." retry />
      </Shell>
    );
  }

  const {
    user,
    year,
    availableYears,
    calendar,
    recentCommits,
    topRepos,
    topReposScope,
    achievements,
    stats,
    warnings,
  } = profile;

  return (
    <Shell username={user.login}>
      <div className="flex flex-col gap-4 lg:gap-5">
        <ProfileHeader user={user} action={<ShareButton data={{ user, year, stats, calendar, topRepos, recentCommits, achievements }} />} />

        {warnings.length > 0 && (
          <div role="status" className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/[0.06] px-4 py-3 text-sm text-warning">
            <AlertIcon className="mt-0.5 size-4 shrink-0" />
            <ul>
              {warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        <StatCards stats={stats} calendarDays={calendar?.days.length ?? 0} year={year} />
        <ActivitySection calendar={calendar} stats={stats} username={user.login} year={year} years={availableYears} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5">
          <RecentCommits commits={recentCommits} />
          <div className="flex flex-col gap-4 lg:gap-5">
            <Achievements achievements={achievements} username={user.login} />
            <TopRepos repos={topRepos} scope={topReposScope} year={year} />
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ username, children }: { username: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pt-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm text-fg-muted transition hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <ArrowLeftIcon className="size-4" />
          New search
        </Link>
        <ProfileForm key={username} variant="compact" defaultValue={`https://github.com/${username}`} />
      </div>
      {children}
    </div>
  );
}
