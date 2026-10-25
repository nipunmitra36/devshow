import type { Ref } from "react";
import { formatNumber, periodLabel, plural } from "@/lib/format";
import type {
  Achievement,
  CommitItem,
  ContributionCalendar,
  ContributionDay,
  DevStats,
  GitHubUser,
  RepoActivity,
} from "@/lib/types";

export const SHARE_PRESETS = {
  square: { label: "Square", hint: "Instagram · LinkedIn", w: 1080, h: 1080 },
  portrait: { label: "Portrait", hint: "Instagram feed", w: 1080, h: 1350 },
  landscape: { label: "Landscape", hint: "X · LinkedIn · Facebook", w: 1200, h: 630 },
} as const;

export type SharePreset = keyof typeof SHARE_PRESETS;

export interface ShareData {
  user: GitHubUser;
  year: number | null;
  stats: DevStats;
  calendar: ContributionCalendar | null;
  topRepos: RepoActivity[];
  /** Used by the full PDF report only. */
  recentCommits: CommitItem[] | null;
  achievements: Achievement[] | null;
}

const HEAT = ["#161b22", "#0e4429", "#006d32", "#26a641", "#4ae168"];

/** Same-origin avatar via the Next.js image optimizer, so canvas export isn't blocked by CORS. */
const avatarSrc = (url: string) => `/_next/image?url=${encodeURIComponent(url)}&w=384&q=75`;

/** Sunday-first week columns, keeping only the most recent `count` weeks. */
export function lastWeeks(days: ContributionDay[], count: number): (ContributionDay | null)[][] {
  if (!days.length) return [];
  const weeks: (ContributionDay | null)[][] = [];
  let week: (ContributionDay | null)[] = Array(new Date(`${days[0].date}T00:00:00Z`).getUTCDay()).fill(null);
  for (const d of days) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);
  return weeks.slice(-count);
}

function statItems(stats: DevStats) {
  return [
    { label: "Total commits", value: stats.totalCommits === null ? "—" : formatNumber(stats.totalCommits) },
    { label: "Active days", value: formatNumber(stats.activeDays) },
    { label: "Repositories", value: formatNumber(stats.repositories) },
    { label: "Longest streak", value: plural(stats.longestStreak, "day") },
  ];
}

export function ShareCard({ data, preset, ref }: { data: ShareData; preset: SharePreset; ref?: Ref<HTMLDivElement> }) {
  const { w, h } = SHARE_PRESETS[preset];
  const landscape = preset === "landscape";
  const portrait = preset === "portrait";

  const pad = landscape ? 56 : 72;
  const inner = w - pad * 2;
  // Every size shows the whole period (trailing year or selected year), so counts match across sizes.
  const weeksCount = 53;
  const gap = landscape ? 4 : 3;
  const weeks = lastWeeks(data.calendar?.days ?? [], weeksCount);
  const cell = Math.floor((inner - (weeksCount - 1) * gap) / weeksCount);
  const shownTotal = data.calendar?.total ?? 0;
  const unit = data.calendar?.source === "recent-commits" ? "commit" : "contribution";

  const { user, stats } = data;
  const name = user.name ?? user.login;

  return (
    <div
      ref={ref}
      data-theme="dark"
      className="relative flex flex-col justify-between overflow-hidden font-sans text-fg"
      style={{
        width: w,
        height: h,
        padding: pad,
        background:
          "radial-gradient(900px 520px at 85% -10%, rgba(46,160,67,0.28), transparent 70%), radial-gradient(700px 400px at -10% 110%, rgba(46,160,67,0.12), transparent 70%), #050607",
      }}
    >
      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
          maskImage: "linear-gradient(to bottom, black, transparent 75%)",
          WebkitMaskImage: "linear-gradient(to bottom, black, transparent 75%)",
        }}
      />

      {/* Brand bar */}
      <div className="relative flex items-center justify-between" style={{ fontSize: landscape ? 20 : 26 }}>
        <BrandMark size={landscape ? 30 : 40} />
        <span className="font-mono text-fg-muted">github.com/{user.login}</span>
      </div>

      {/* Identity */}
      <div className="relative flex items-center" style={{ gap: landscape ? 24 : 36 }}>
        {/* A plain same-origin <img> (not next/image) so the export can inline it. */}
        <img
          src={avatarSrc(user.avatarUrl)}
          alt=""
          width={landscape ? 96 : 148}
          height={landscape ? 96 : 148}
          crossOrigin="anonymous"
          style={{
            width: landscape ? 96 : 148,
            height: landscape ? 96 : 148,
            borderRadius: landscape ? 22 : 34,
            border: "2px solid rgba(255,255,255,0.14)",
            objectFit: "cover",
          }}
        />
        <div className="min-w-0 flex-1">
          <div
            className="truncate font-semibold"
            style={{ fontSize: landscape ? 42 : 62, lineHeight: 1.1, letterSpacing: "-0.03em" }}
          >
            {name}
          </div>
          <div className="font-mono text-accent" style={{ fontSize: landscape ? 22 : 30, marginTop: 6 }}>
            @{user.login}
          </div>
          {portrait && user.bio && (
            <div
              className="text-fg-muted"
              style={{
                fontSize: 26,
                lineHeight: 1.4,
                marginTop: 14,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {user.bio}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="relative grid grid-cols-4" style={{ gap: landscape ? 14 : 16 }}>
        {statItems(stats).map((s, i) => (
          <div
            key={s.label}
            style={{
              padding: landscape ? "16px 20px" : "22px 24px",
              borderRadius: landscape ? 16 : 22,
              background: i === 0 ? "linear-gradient(135deg, rgba(63,220,106,0.16), rgba(255,255,255,0.03))" : "rgba(255,255,255,0.035)",
              border: `1px solid ${i === 0 ? "rgba(63,220,106,0.35)" : "rgba(255,255,255,0.09)"}`,
            }}
          >
            <div className="text-fg-muted" style={{ fontSize: landscape ? 16 : 21 }}>
              {s.label}
            </div>
            <div
              className="font-semibold tabular-nums"
              style={{ fontSize: landscape ? 34 : 46, letterSpacing: "-0.02em", marginTop: landscape ? 4 : 8 }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="relative">
        <div
          className="flex items-center justify-between text-fg-muted"
          style={{ fontSize: landscape ? 17 : 22, marginBottom: landscape ? 12 : 18 }}
        >
          <span>
            <span className="font-semibold text-fg">{formatNumber(shownTotal)}</span>{" "}
            {unit}s in {periodLabel(data.year)}
          </span>
          <span className="flex items-center" style={{ gap: landscape ? 5 : 6 }}>
            Less
            {HEAT.map((c) => (
              <span key={c} style={{ width: landscape ? 13 : 18, height: landscape ? 13 : 18, borderRadius: 4, background: c }} />
            ))}
            More
          </span>
        </div>
        {weeks.length ? (
          <div className="flex justify-between" style={{ gap }}>
            {weeks.map((week, col) => (
              <div key={col} className="flex flex-col" style={{ gap }}>
                {week.map((d, row) => (
                  <span
                    key={row}
                    style={{
                      width: cell,
                      height: cell,
                      borderRadius: 3,
                      background: d ? HEAT[d.level] : "transparent",
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div
            className="grid place-items-center text-fg-subtle"
            style={{ height: 7 * cell + 6 * gap, borderRadius: 16, border: "1px dashed rgba(255,255,255,0.12)", fontSize: 22 }}
          >
            No public contributions yet
          </div>
        )}
      </div>

      {/* Top repositories (portrait only) */}
      {portrait && data.topRepos.length > 0 && (
        <div className="relative flex flex-col" style={{ gap: 12 }}>
          <div className="text-fg-muted" style={{ fontSize: 22 }}>
            Top repositories
          </div>
          {data.topRepos.slice(0, 3).map((r) => (
            <div
              key={r.repo}
              className="flex items-center justify-between"
              style={{
                fontSize: 26,
                padding: "16px 22px",
                borderRadius: 18,
                background: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              <span className="truncate font-medium">{r.repo.split("/")[1]}</span>
              <span className="shrink-0 tabular-nums text-fg-muted" style={{ marginLeft: 24 }}>
                {plural(r.commits, "commit")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {!landscape && (
        <div className="relative flex items-center justify-end text-fg-subtle" style={{ fontSize: 22 }}>
          <span className="font-semibold text-fg-muted">DevShow</span>
        </div>
      )}
    </div>
  );
}

function BrandMark({ size }: { size: number }) {
  const order = [2, 4, 1, 3, 1, 4, 1, 2, 3];
  return (
    <span className="inline-flex items-center font-semibold" style={{ gap: size * 0.35, letterSpacing: "-0.02em" }}>
      <span
        className="grid grid-cols-3"
        style={{
          width: size,
          height: size,
          padding: size * 0.18,
          gap: size * 0.07,
          borderRadius: size * 0.28,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {order.map((l, i) => (
          <span key={i} style={{ borderRadius: 2, background: HEAT[l] }} />
        ))}
      </span>
      DevShow
    </span>
  );
}
