"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AlertIcon, SearchIcon } from "./icons";

export function ErrorState({
  title,
  body,
  retry,
  onRetry,
  variant = "error",
}: {
  title: string;
  body: string;
  retry?: boolean;
  onRetry?: () => void;
  variant?: "error" | "not-found";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const Icon = variant === "not-found" ? SearchIcon : AlertIcon;

  return (
    <div role={variant === "error" ? "alert" : undefined} className="glass animate-fade-up mx-auto max-w-lg rounded-2xl border border-line px-6 py-12 text-center">
      <span
        className={`mx-auto grid size-12 place-items-center rounded-xl border ${
          variant === "error" ? "border-danger/30 bg-danger/10 text-danger" : "border-line-strong bg-surface-strong text-fg-muted"
        }`}
      >
        <Icon className="size-5" />
      </span>
      <h1 className="mt-5 text-lg font-semibold text-fg">{title}</h1>
      <p className="mt-1.5 text-sm text-fg-muted">{body}</p>
      <div className="mt-6 flex justify-center gap-2">
        {retry && (
          <button
            type="button"
            disabled={pending}
            onClick={() => (onRetry ? onRetry() : startTransition(() => router.refresh()))}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-canvas transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-70"
          >
            {pending ? "Retrying…" : "Try again"}
          </button>
        )}
        <Link
          href="/"
          className="rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-fg transition hover:bg-tint/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          Search another profile
        </Link>
      </div>
    </div>
  );
}
