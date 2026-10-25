"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { parseGitHubProfile } from "@/lib/parse-github-url";
import { AlertIcon, ArrowRightIcon, GitHubIcon } from "./icons";

export function ProfileForm({
  variant = "hero",
  defaultValue = "",
}: {
  variant?: "hero" | "compact";
  defaultValue?: string;
}) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const hero = variant === "hero";

  function go(input: string) {
    const result = parseGitHubProfile(input);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    startTransition(() => router.push(`/github/${result.username}`));
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        go(value);
      }}
      className={hero ? "w-full" : "w-full sm:w-auto"}
    >
      <label
        htmlFor={id}
        className={hero ? "mb-3 block text-sm font-medium text-fg-muted" : "sr-only"}
      >
        Enter GitHub Profile
      </label>

      <div
        className={`group flex items-center gap-2 rounded-2xl border bg-surface-strong p-1.5 transition focus-within:border-accent/50 focus-within:shadow-[0_0_0_4px_rgb(63_220_106/0.12)] ${
          error ? "border-danger/60" : "border-line-strong"
        } ${hero ? "" : "rounded-xl p-1"}`}
      >
        <GitHubIcon className={`ml-2.5 shrink-0 text-fg-subtle ${hero ? "size-5" : "size-4"}`} />
        <input
          id={id}
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="https://github.com/username"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`min-w-0 flex-1 bg-transparent font-mono text-fg placeholder:text-fg-subtle focus:outline-none ${
            hero ? "h-11 text-[15px]" : "h-8 w-56 text-sm"
          }`}
        />
        <button
          type="submit"
          disabled={pending}
          className={`inline-flex shrink-0 items-center gap-2 rounded-xl bg-accent font-semibold text-canvas transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-wait disabled:opacity-80 ${
            hero ? "h-11 px-5 text-[15px]" : "h-8 rounded-lg px-3 text-sm"
          }`}
        >
          {pending ? (
            <>
              <span className="size-4 animate-spin rounded-full border-2 border-canvas/30 border-t-canvas" aria-hidden />
              <span>{hero ? "Loading…" : "Loading"}</span>
            </>
          ) : (
            <>
              <span>{hero ? "Show Profile" : "Show"}</span>
              <ArrowRightIcon className="size-4" />
            </>
          )}
        </button>
      </div>

      <div aria-live="polite">
        {error && (
          <p id={`${id}-error`} className="mt-2.5 flex items-center gap-1.5 text-sm text-danger">
            <AlertIcon className="size-4 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
