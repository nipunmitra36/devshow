"use client";

import { ErrorState } from "@/components/states";

export default function ProfileError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <ErrorState
        title="Something went wrong"
        body="We couldn't load this developer profile. GitHub may be unavailable — please try again."
        retry
        onRetry={reset}
      />
    </div>
  );
}
