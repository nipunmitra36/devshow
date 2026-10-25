const numberFmt = new Intl.NumberFormat("en-US");

export const formatNumber = (n: number) => numberFmt.format(n);

/** "the last year" or "2024", for sentences like "120 contributions in …". */
export const periodLabel = (year: number | null) => (year === null ? "the last year" : String(year));

export const plural =(n: number, word: string) =>
  `${formatNumber(n)} ${word}${n === 1 ? "" : "s"}`;

/**
 * Dates render in UTC so server-rendered and hydrated markup always match,
 * and so calendar days (YYYY-MM-DD) never shift by a day.
 */
export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso);
  return new Date(dateOnly ? `${iso}T00:00:00Z` : iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
    ...opts,
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}
