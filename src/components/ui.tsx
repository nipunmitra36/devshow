import type { ComponentType, ReactNode, SVGProps } from "react";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export function Card({
  children,
  className = "",
  style,
  accent = false,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Green-tinted emphasis variant. */
  accent?: boolean;
}) {
  return (
    <section
      style={style}
      className={`${accent ? "card-premium-accent" : "card-premium"} animate-fade-up relative rounded-2xl ${className}`}
    >
      <TopHighlight />
      {children}
    </section>
  );
}

/** Hairline of light along the top edge of a card. */
export function TopHighlight({ accent = false }: { accent?: boolean }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-x-8 -top-px h-px bg-linear-to-r from-transparent to-transparent ${
        accent ? "via-accent/70" : "via-tint/25"
      }`}
    />
  );
}

/**
 * Rounded tile that frames an icon. `accent` is always green; `neutral` turns green when an
 * ancestor with the `group` class is hovered.
 */
export function IconTile({
  icon: Icon,
  tone = "neutral",
  size = "md",
}: {
  icon: Icon;
  tone?: "accent" | "neutral";
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-8 rounded-lg" : "size-10 rounded-xl";
  const glyph = size === "sm" ? "size-4" : "size-5";
  const toneClass =
    tone === "accent"
      ? "bg-linear-to-b from-accent/25 to-accent/5 text-accent ring-accent/35 shadow-[0_6px_20px_-6px] shadow-accent/45"
      : "bg-linear-to-b from-tint/10 to-tint/[0.02] text-fg-muted ring-tint/12 group-hover:from-accent/20 group-hover:to-accent/5 group-hover:text-accent group-hover:ring-accent/30";

  return (
    <span
      aria-hidden
      className={`relative grid shrink-0 place-items-center ring-1 ring-inset transition-colors duration-200 ${box} ${toneClass}`}
    >
      {/* inner top sheen */}
      <span className="pointer-events-none absolute inset-x-1.5 top-px h-px rounded-full bg-linear-to-r from-transparent via-tint/30 to-transparent" />
      <Icon className={glyph} />
    </span>
  );
}

export function CardHeader({
  title,
  description,
  action,
  id,
  icon,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  id?: string;
  icon?: Icon;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-center gap-3">
        {icon && <IconTile icon={icon} size="sm" />}
        <div>
          <h2 id={id} className="text-[15px] font-semibold tracking-tight text-fg">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-fg-subtle">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-shimmer rounded-md bg-tint/[0.06] ${className}`} />;
}

/** Stagger helper for entrance animations. */
export const delay = (i: number) => ({ animationDelay: `${i * 60}ms` });
