"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { DownloadIcon, ShareIcon, XIcon } from "./icons";
import { REPORT_PAGE, ReportPages } from "./report";
import { SHARE_PRESETS, ShareCard, type ShareData, type SharePreset } from "./share-card";

type Format = "png" | "jpg" | "pdf";

const FORMATS: { id: Format; label: string; hint: string }[] = [
  { id: "png", label: "PNG", hint: "Social card · lossless" },
  { id: "jpg", label: "JPG", hint: "Social card · smaller file" },
  { id: "pdf", label: "PDF report", hint: "Full profile, all data · A4" },
];

// If an image can't be fetched, export without it rather than failing.
const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

const BACKGROUND = "#050607";
const PREVIEW_MAX_H = 460;

export function ShareButton({ data }: { data: ShareData }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          dialogRef.current?.showModal();
        }}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-canvas transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        <ShareIcon className="size-4" />
        Share
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="share-title"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}
        className="m-auto w-[min(100vw-2rem,980px)] max-w-none rounded-2xl border border-line-strong bg-elevated p-0 text-fg shadow-2xl shadow-black/60 backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        {open && <ShareDialogBody data={data} onClose={() => dialogRef.current?.close()} />}
      </dialog>
    </>
  );
}

function ShareDialogBody({ data, onClose }: { data: ShareData; onClose: () => void }) {
  const [preset, setPreset] = useState<SharePreset>("square");
  const [busy, setBusy] = useState<Format | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [scale, setScale] = useState(0.4);
  const previewRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const warmedUp = useRef(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const [reportMounted, setReportMounted] = useState(false);

  const { w, h } = SHARE_PRESETS[preset];

  // Fit the full-size card into the preview area.
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const fit = () => setScale(Math.min(el.clientWidth / w, PREVIEW_MAX_H / h, 1));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [w, h]);

  /** Mounts the off-screen A4 report, captures each page at 2x and assembles a multi-page PDF. */
  async function saveReport(filename: string) {
    flushSync(() => setReportMounted(true));
    try {
      const root = reportRef.current;
      if (!root) throw new Error("Report did not render");
      await Promise.all(
        [...root.querySelectorAll("img")].map((img) =>
          img.complete ? img.decode().catch(() => {}) : new Promise((r) => (img.onload = img.onerror = r)),
        ),
      );

      const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      const pageOptions = {
        width: REPORT_PAGE.w,
        height: REPORT_PAGE.h,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: false,
        // Every image goes through /_next/image?url=…; without this, html-to-image's cache treats them as one URL.
        includeQueryParams: true,
        imagePlaceholder: TRANSPARENT_PIXEL,
      };
      const pages = [...root.querySelectorAll<HTMLElement>("[data-report-page]")];
      // Prime fonts and images once so the first page doesn't render without them.
      await toJpeg(pages[0], { ...pageOptions, pixelRatio: 0.1 });

      const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait", compress: true });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      pdf.setProperties({
        title: `${data.user.name ?? data.user.login} — DevShow developer report`,
        subject: "GitHub profile and contribution report",
        author: data.user.name ?? data.user.login,
        creator: "DevShow",
      });

      for (const [i, page] of pages.entries()) {
        setMessage({ kind: "ok", text: `Rendering page ${i + 1} of ${pages.length}…` });
        // JPEG keeps a 2x, multi-page report at a few MB instead of tens.
        const img = await toJpeg(page, { ...pageOptions, quality: 0.92 });
        if (i > 0) pdf.addPage();
        pdf.addImage(img, "JPEG", 0, 0, pw, ph, undefined, "FAST");
        // Make the profile link in the footer clickable.
        pdf.link(0, ph - 40, pw / 2, 40, { url: data.user.htmlUrl });
      }
      pdf.save(filename);
    } finally {
      setReportMounted(false);
    }
  }

  async function download(format: Format) {
    const node = cardRef.current;
    if (!node || busy) return;
    setBusy(format);
    setMessage(null);

    try {
      await document.fonts.ready;
      await Promise.all(
        [...node.querySelectorAll("img")].map((img) =>
          img.complete ? img.decode().catch(() => {}) : new Promise((r) => (img.onload = img.onerror = r)),
        ),
      );

      const { toPng, toJpeg } = await import("html-to-image");
      const options = {
        width: w,
        height: h,
        // Export at the preset's exact size; the PDF embeds a 2x image so it stays sharp when zoomed.
        pixelRatio: format === "pdf" ? 2 : 1,
        backgroundColor: BACKGROUND,
        cacheBust: false,
        includeQueryParams: true,
        // If the avatar can't be fetched, export without it rather than failing.
        imagePlaceholder: TRANSPARENT_PIXEL,
      };

      // html-to-image can miss fonts/images on the very first pass; a throwaway render primes them.
      if (!warmedUp.current) {
        await toPng(node, { ...options, pixelRatio: 0.1 });
        warmedUp.current = true;
      }

      let filename: string;
      if (format === "png") {
        filename = `devshow-${data.user.login}-${preset}.png`;
        save(await toPng(node, options), filename);
      } else if (format === "jpg") {
        filename = `devshow-${data.user.login}-${preset}.jpg`;
        save(await toJpeg(node, { ...options, quality: 0.95 }), filename);
      } else {
        filename = `devshow-${data.user.login}-report.pdf`;
        await saveReport(filename);
      }
      setMessage({ kind: "ok", text: `Saved ${filename}` });
    } catch (err) {
      console.error("[devshow] export failed", err);
      setMessage({ kind: "error", text: "Couldn't create the file. Please try again." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h2 id="share-title" className="text-[15px] font-semibold tracking-tight">
            Share your profile
          </h2>
          <p className="mt-0.5 text-sm text-fg-subtle">Download a ready-to-post image for social media.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-8 place-items-center rounded-lg text-fg-muted transition hover:bg-tint/6 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_260px]">
        {/* Preview */}
        <div
          ref={previewRef}
          className="flex min-w-0 items-center justify-center rounded-xl border border-line bg-[repeating-conic-gradient(rgb(127_127_127/0.1)_0_25%,transparent_0_50%)] bg-size-[20px_20px] p-0"
          style={{ minHeight: Math.min(PREVIEW_MAX_H, h * scale) }}
        >
          <div className="overflow-hidden rounded-lg shadow-2xl shadow-black/50" style={{ width: w * scale, height: h * scale }}>
            <div style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <ShareCard ref={cardRef} data={data} preset={preset} />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-6">
          <fieldset>
            <legend className="mb-2.5 text-sm font-medium text-fg-muted">Size</legend>
            <div className="flex flex-col gap-2">
              {(Object.keys(SHARE_PRESETS) as SharePreset[]).map((id) => {
                const p = SHARE_PRESETS[id];
                const selected = preset === id;
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition has-focus-visible:ring-2 has-focus-visible:ring-accent/60 ${
                      selected ? "border-accent/50 bg-accent/10" : "border-line hover:border-line-strong"
                    }`}
                  >
                    <input
                      type="radio"
                      name="share-size"
                      value={id}
                      checked={selected}
                      onChange={() => setPreset(id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={`shrink-0 rounded-[3px] border ${selected ? "border-accent" : "border-fg-subtle"}`}
                      style={{ width: (p.w / p.h) * 16, height: 16 }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2 text-sm font-medium text-fg">
                        {p.label}
                        <span className="font-mono text-[11px] font-normal text-fg-subtle">
                          {p.w}×{p.h}
                        </span>
                      </span>
                      <span className="block text-xs text-fg-subtle">{p.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            <p className="mb-2.5 text-sm font-medium text-fg-muted">Download</p>
            <div className="flex flex-col gap-2">
              {FORMATS.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => download(f.id)}
                  disabled={busy !== null}
                  aria-busy={busy === f.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-wait disabled:opacity-60 ${
                    i === 0
                      ? "bg-accent text-canvas hover:bg-accent-hover"
                      : "border border-line-strong bg-surface-strong text-fg hover:border-accent/40"
                  }`}
                >
                  {busy === f.id ? (
                    <span
                      aria-hidden
                      className={`size-4 animate-spin rounded-full border-2 ${
                        i === 0 ? "border-canvas/30 border-t-canvas" : "border-fg/20 border-t-fg"
                      }`}
                    />
                  ) : (
                    <DownloadIcon className="size-4" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">Download {f.label}</span>
                    <span className={`block text-xs ${i === 0 ? "text-canvas/70" : "text-fg-subtle"}`}>{f.hint}</span>
                  </span>
                </button>
              ))}
            </div>
            <p aria-live="polite" className={`mt-3 min-h-5 text-xs ${message?.kind === "error" ? "text-danger" : "text-fg-subtle"}`}>
              {busy && !message ? `Creating ${busy.toUpperCase()}…` : message?.text}
            </p>
          </div>
        </div>
      </div>

      {/* Off-screen A4 pages, mounted only while the PDF report is being generated. */}
      {reportMounted && (
        <div aria-hidden className="pointer-events-none fixed top-0 -left-[10000px]" style={{ width: REPORT_PAGE.w }}>
          <ReportPages ref={reportRef} data={data} />
        </div>
      )}
    </div>
  );
}

function save(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
