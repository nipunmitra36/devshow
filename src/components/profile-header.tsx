import Image from "next/image";
import { formatDate, formatNumber } from "@/lib/format";
import type { GitHubUser } from "@/lib/types";
import { BuildingIcon, CalendarIcon, ExternalIcon, GitHubIcon, LinkIcon, MapPinIcon, RepoIcon, UsersIcon } from "./icons";
import { Card } from "./ui";

export function ProfileHeader({ user, action }: { user: GitHubUser; action?: React.ReactNode }) {
  const blog = user.blog ? (/^https?:\/\//.test(user.blog) ? user.blog : `https://${user.blog}`) : null;

  return (
    <Card className="relative overflow-hidden p-5 sm:p-7">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
        <div className="relative shrink-0 self-start">
          <Image
            src={user.avatarUrl}
            alt={`${user.name ?? user.login}'s avatar`}
            width={112}
            height={112}
            priority
            className="size-20 rounded-2xl border border-line-strong object-cover sm:size-28"
          />
          <span className="absolute -bottom-1.5 -right-1.5 grid size-7 place-items-center rounded-lg border border-line-strong bg-canvas">
            <GitHubIcon className="size-4 text-fg" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-gradient truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {user.name ?? user.login}
          </h1>
          <p className="mt-0.5 font-mono text-sm text-accent">@{user.login}</p>
          {user.bio && <p className="mt-3 max-w-2xl text-pretty text-[15px] leading-relaxed text-fg-muted">{user.bio}</p>}

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-fg-subtle">
            {user.company && (
              <li className="flex items-center gap-1.5">
                <BuildingIcon className="size-4" />
                {user.company}
              </li>
            )}
            {user.location && (
              <li className="flex items-center gap-1.5">
                <MapPinIcon className="size-4" />
                {user.location}
              </li>
            )}
            {blog && (
              <li className="flex min-w-0 items-center gap-1.5">
                <LinkIcon className="size-4 shrink-0" />
                <a href={blog} target="_blank" rel="noreferrer nofollow" className="truncate hover:text-fg">
                  {user.blog!.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <CalendarIcon className="size-4" />
              Joined {formatDate(user.createdAt, { day: undefined })}
            </li>
          </ul>
        </div>

        <div className="flex shrink-0 flex-col gap-4 md:items-end">
          <dl className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-xl border border-line bg-tint/[0.02]">
            {[
              { label: "Repos", value: user.publicRepos, Icon: RepoIcon },
              { label: "Followers", value: user.followers, Icon: UsersIcon },
              { label: "Following", value: user.following, Icon: UsersIcon },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="px-4 py-2.5 text-center sm:px-5">
                <dt className="flex items-center justify-center gap-1 text-[11px] uppercase tracking-wider text-fg-subtle">
                  <Icon className="size-3.5" />
                  {label}
                </dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-fg">{formatNumber(value)}</dd>
              </div>
            ))}
          </dl>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <a
              href={user.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface-strong px-4 py-2 text-sm font-medium text-fg transition hover:border-accent/40 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <GitHubIcon className="size-4" />
              View on GitHub
              <ExternalIcon className="size-3.5 text-fg-subtle" />
            </a>
            {action}
          </div>
        </div>
      </div>
    </Card>
  );
}
