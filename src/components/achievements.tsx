import Image from "next/image";
import type { Achievement } from "@/lib/types";
import { TrophyIcon } from "./icons";
import { Card, CardHeader, delay } from "./ui";

const TIER_PILL: Record<Achievement["tier"], string> = {
  default: "",
  bronze: "bg-[#f2d3b5] text-[#6b3d16] ring-[#c9865a]/50",
  silver: "bg-[#e3e8ee] text-[#3a434d] ring-[#9aa5b1]/60",
  gold: "bg-[#f8e3a1] text-[#6a4a00] ring-[#d4a72c]/60",
};

export function Achievements({ achievements, username }: { achievements: Achievement[] | null; username: string }) {
  const profileUrl = `https://github.com/${username}?tab=achievements`;

  return (
    <Card style={delay(6)} className="h-fit">
      <CardHeader
        icon={TrophyIcon}
        title="Achievements"
        description={achievements?.length ? `${achievements.length} earned on GitHub` : undefined}
        action={
          achievements?.length ? (
            <a
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium text-fg-muted transition hover:text-accent"
            >
              View all
            </a>
          ) : undefined
        }
      />

      {!achievements ? (
        <p className="px-6 py-10 text-center text-sm text-fg-subtle">Achievements couldn&apos;t be loaded from GitHub right now.</p>
      ) : achievements.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="font-medium text-fg">No achievements yet</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-fg-subtle">
            Badges like Pull Shark and Quickdraw appear here once they&apos;re earned on GitHub.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-3 gap-2 p-4 sm:p-5">
          {achievements.map((a) => (
            <li key={a.slug}>
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                title={a.description ?? a.name}
                className="group/badge flex h-full flex-col items-center rounded-xl px-1.5 pb-3 pt-2 text-center transition hover:bg-tint/[0.04] focus-visible:bg-tint/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                <span className="relative">
                  <Image
                    src={a.image}
                    alt=""
                    width={72}
                    height={72}
                    className="size-16 drop-shadow-[0_6px_14px_rgb(0_0_0/0.35)] transition-transform duration-300 group-hover/badge:-translate-y-0.5 group-hover/badge:scale-105 sm:size-[72px]"
                  />
                  {a.count !== null && (
                    <span
                      className={`absolute -bottom-0.5 -right-1.5 rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums ring-1 ${TIER_PILL[a.tier]}`}
                    >
                      x{a.count}
                    </span>
                  )}
                </span>
                <span className="mt-2 text-[13px] font-semibold leading-tight text-fg">{a.name}</span>
                {a.description && (
                  <span className="mt-1 line-clamp-2 text-[11px] leading-snug text-fg-subtle">{a.description}</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
