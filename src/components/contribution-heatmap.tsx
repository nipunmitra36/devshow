"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate, plural } from "@/lib/format";
import type { ContributionDay } from "@/lib/types";

const LEVEL_CLASS = ["bg-heat-0", "bg-heat-1", "bg-heat-2", "bg-heat-3", "bg-heat-4"] as const;
export const LEVEL_LABELS = ["No activity", "Low", "Medium", "High", "Very high"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const weekday = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();
const month = (iso: string) => Number(iso.slice(5, 7)) - 1;

interface Props {
  days: ContributionDay[];
  unit: "contribution" | "commit";
}

export function ContributionHeatmap({ days, unit }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);

  // Lay days out in Sunday-first week columns, padding the first week.
  const { weeks, monthLabels } = useMemo(() => {
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = Array(days.length ? weekday(days[0].date) : 0).fill(null);
    days.forEach((_, i) => {
      week.push(i);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    });
    if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);

    const monthLabels: { col: number; label: string }[] = [];
    let prev = -1;
    weeks.forEach((w, col) => {
      const first = w.find((i) => i !== null);
      if (first == null) return;
      const m = month(days[first].date);
      if (m !== prev) {
        // Drop a label that would collide with the next one.
        if (monthLabels.length && col - monthLabels[monthLabels.length - 1].col < 3) monthLabels.pop();
        monthLabels.push({ col, label: MONTHS[m] });
        prev = m;
      }
    });
    return { weeks, monthLabels };
  }, [days]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth; // most recent activity first on small screens
  }, []);

  function showTip(index: number, cell: HTMLElement | null) {
    setActive(index);
    const wrap = wrapRef.current;
    if (!cell || !wrap) return;
    const c = cell.getBoundingClientRect();
    const w = wrap.getBoundingClientRect();
    setTip({ x: c.left - w.left + c.width / 2, y: c.top - w.top });
  }

  function cellFor(index: number) {
    return scrollRef.current?.querySelector<HTMLElement>(`[data-i="${index}"]`) ?? null;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const delta = { ArrowLeft: -7, ArrowRight: 7, ArrowUp: -1, ArrowDown: 1, Home: -Infinity, End: Infinity }[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    const from = active ?? days.length - 1;
    const next = Math.max(0, Math.min(days.length - 1, from + delta));
    const cell = cellFor(next);
    cell?.scrollIntoView({ block: "nearest", inline: "nearest" });
    showTip(next, cell);
  }

  const activeDay = active !== null ? days[active] : null;
  const total = days.reduce((s, d) => s + d.count, 0);

  return (
    <div
      ref={wrapRef}
      className="relative [--cell:11px] [--gap:3px] [--step:calc(var(--cell)+var(--gap))] lg:[--cell:14px] lg:[--gap:4px]"
    >
      <div
        ref={scrollRef}
        tabIndex={0}
        role="group"
        aria-label={`${plural(total, unit)} heatmap from ${formatDate(days[0].date)} to ${formatDate(
          days[days.length - 1].date,
        )}. Use arrow keys to inspect individual days.`}
        onKeyDown={onKeyDown}
        onFocus={() => active === null && showTip(days.length - 1, cellFor(days.length - 1))}
        onBlur={() => {
          setActive(null);
          setTip(null);
        }}
        onMouseLeave={() => {
          setActive(null);
          setTip(null);
        }}
        className="scrollbar-thin overflow-x-auto rounded-lg pb-2 outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      >
        <div className="mx-auto grid w-max grid-cols-[auto_1fr] gap-x-2">
          <div />
          <div className="relative h-5 text-[11px] text-fg-subtle" aria-hidden>
            {monthLabels.map(({ col, label }) => (
              <span key={`${col}-${label}`} className="absolute top-0" style={{ left: `calc(${col} * var(--step))` }}>
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-rows-7 gap-[var(--gap)] text-[11px] leading-none text-fg-subtle" aria-hidden>
            {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
              <span key={i} className="flex h-[var(--cell)] items-center">
                {d}
              </span>
            ))}
          </div>

          <div
            className="flex gap-[var(--gap)]"
            onMouseOver={(e) => {
              const el = (e.target as HTMLElement).closest<HTMLElement>("[data-i]");
              if (el) showTip(Number(el.dataset.i), el);
            }}
          >
            {weeks.map((week, col) => (
              <div key={col} className="grid grid-rows-7 gap-[var(--gap)]">
                {week.map((i, row) =>
                  i === null ? (
                    <span key={row} className="size-[var(--cell)]" />
                  ) : (
                    <span
                      key={row}
                      data-i={i}
                      className={`size-[var(--cell)] rounded-[3px] outline-offset-1 transition-[transform,outline-color] duration-150 ${
                        LEVEL_CLASS[days[i].level]
                      } ${
                        active === i
                          ? "scale-125 outline outline-2 outline-fg/80"
                          : "outline outline-1 outline-tint/[0.04] hover:scale-125"
                      }`}
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeDay && tip && (
        <div
          role="status"
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-line-strong bg-popover/95 px-2.5 py-1.5 text-xs shadow-xl shadow-black/40 backdrop-blur"
          style={{ left: tip.x, top: tip.y - 8 }}
        >
          <span className="font-semibold text-fg">
            {activeDay.count === 0 ? `No ${unit}s` : plural(activeDay.count, unit)}
          </span>
          <span className="text-fg-muted"> on {formatDate(activeDay.date, { weekday: "short" })}</span>
        </div>
      )}
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-fg-subtle">
      <span>Less</span>
      {LEVEL_CLASS.map((c, i) => (
        <span key={c} title={LEVEL_LABELS[i]} className={`size-[11px] rounded-[3px] outline outline-1 outline-tint/[0.04] ${c}`}>
          <span className="sr-only">{LEVEL_LABELS[i]}</span>
        </span>
      ))}
      <span>More</span>
    </div>
  );
}
