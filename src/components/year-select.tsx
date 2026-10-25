"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";

/** Year picker for the contribution calendar. The selection lives in the URL (`?year=2024`). */
export function YearSelect({
  username,
  years,
  value,
}: {
  username: string;
  years: number[];
  value: number | null;
}) {
  const id = useId();
  const router = useRouter();
  const ref = useRef<HTMLSelectElement>(null);
  const [selected, setSelected] = useState(value === null ? "" : String(value));
  const [pending, startTransition] = useTransition();

  // Dim the surrounding card while the new year loads.
  useEffect(() => {
    ref.current?.closest("section")?.toggleAttribute("data-pending", pending);
  }, [pending]);

  return (
    <div className="relative inline-flex w-full items-center sm:w-auto">
      <label htmlFor={id} className="sr-only">
        Contribution year
      </label>
      <select
        ref={ref}
        id={id}
        value={selected}
        onChange={(e) => {
          const next = e.target.value;
          setSelected(next);
          startTransition(() => router.push(`/github/${username}${next ? `?year=${next}` : ""}`, { scroll: false }));
        }}
        className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-line-strong bg-surface-strong pl-3 pr-9 text-sm font-medium text-fg transition hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:w-44"
      >
        <option value="">Last 12 months</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-3 text-fg-subtle">
        {pending ? (
          <span className="block size-3.5 animate-spin rounded-full border-2 border-fg-subtle/30 border-t-fg-muted" />
        ) : (
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="sr-only" aria-live="polite">
        {pending ? "Loading contributions…" : ""}
      </span>
    </div>
  );
}
