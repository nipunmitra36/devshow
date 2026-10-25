import { CalendarIcon, CommitIcon, FlameIcon } from "@/components/icons";
import { ProfileForm } from "@/components/profile-form";
import { IconTile, TopHighlight, delay } from "@/components/ui";

const FEATURES = [
  {
    Icon: CalendarIcon,
    title: "Contribution heatmap",
    body: "A full year of activity at a glance, in GitHub's familiar green.",
  },
  {
    Icon: CommitIcon,
    title: "Commit timeline",
    body: "Recent commits with repository, message, date and SHA, linked to GitHub.",
  },
  {
    Icon: FlameIcon,
    title: "Streaks & stats",
    body: "Total commits, active days, longest streak and your busiest repositories.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="mx-auto flex max-w-2xl flex-col items-center pb-16 pt-16 text-center sm:pt-24">
        <h1
          style={delay(1)}
          className="text-gradient animate-fade-up text-5xl font-semibold tracking-tighter sm:text-7xl"
        >
          DevShow
        </h1>
        <p style={delay(2)} className="animate-fade-up mt-4 max-w-xl text-balance text-lg text-fg-muted sm:text-xl">
          Turn your GitHub activity into a beautiful developer profile.
        </p>

        <div style={delay(3)} className="animate-fade-up mt-10 w-full text-left">
          <ProfileForm variant="hero" />
        </div>
      </section>

      <HeatmapPreview />

      <section aria-label="Features" className="grid gap-4 pb-24 pt-12 sm:grid-cols-3">
        {FEATURES.map(({ Icon, title, body }, i) => (
          <div
            key={title}
            style={delay(i + 5)}
            className="card-premium animate-fade-up group relative overflow-hidden rounded-2xl p-5"
          >
            <TopHighlight />
            <span
              aria-hidden
              className="pointer-events-none absolute -top-16 left-1/2 h-32 w-3/4 -translate-x-1/2 rounded-full bg-accent/15 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
            />
            <IconTile icon={Icon} tone="accent" />
            <h2 className="mt-4 font-semibold text-fg">{title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-fg-subtle">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

/** Decorative, deterministic heatmap so the landing page previews the product. */
function HeatmapPreview() {
  const weeks = 53;
  const levels = Array.from({ length: weeks * 7 }, (_, i) => {
    const wave = Math.sin(i / 23) + Math.sin(i / 7.3) * 0.6 + ((i * 2654435761) % 97) / 60;
    return Math.max(0, Math.min(4, Math.round(wave + 0.4)));
  });
  const cls = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"];

  return (
    <div aria-hidden style={delay(4)} className="animate-fade-up relative mx-auto max-w-5xl">
      <div className="glass overflow-hidden rounded-2xl border border-line p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between text-xs text-fg-subtle">
          <span>
            <span className="font-semibold text-fg">1,248</span> contributions in the last year
          </span>
          <span className="hidden sm:inline">Longest streak · 21 days</span>
        </div>
        <div className="flex justify-center gap-[3px] overflow-hidden">
          {Array.from({ length: weeks }, (_, w) => (
            <div key={w} className="grid shrink-0 grid-rows-7 gap-[3px]">
              {levels.slice(w * 7, w * 7 + 7).map((l, d) => (
                <span key={d} className={`size-[11px] rounded-[3px] sm:size-3 ${cls[l]}`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-16 rounded-b-2xl bg-linear-to-t from-canvas to-transparent" />
    </div>
  );
}
