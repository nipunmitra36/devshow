import { Skeleton } from "@/components/ui";

export default function LoadingProfile() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pt-8" aria-busy="true">
      <p className="sr-only" role="status">
        Loading developer profile…
      </p>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="hidden h-10 w-80 rounded-xl sm:block" />
      </div>

      <div className="flex flex-col gap-4 lg:gap-5">
        {/* Profile */}
        <div className="glass flex flex-col gap-6 rounded-2xl border border-line p-5 sm:p-7 md:flex-row md:items-center">
          <Skeleton className="size-20 rounded-2xl sm:size-28" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-2/3 max-w-sm" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-14 w-72 rounded-xl" />
            <Skeleton className="ml-auto h-9 w-40 rounded-xl" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="glass space-y-4 rounded-2xl border border-line p-4 sm:p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div className="glass rounded-2xl border border-line">
          <div className="border-b border-line px-5 py-4 sm:px-6">
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex justify-end gap-[3px] overflow-hidden px-5 py-6 sm:px-6">
            {Array.from({ length: 53 }, (_, w) => (
              <div key={w} className="grid shrink-0 grid-rows-7 gap-[3px]">
                {Array.from({ length: 7 }, (_, d) => (
                  <span
                    key={d}
                    className="animate-shimmer size-[11px] rounded-[3px] bg-tint/[0.06] lg:size-[13px]"
                    style={{ animationDelay: `${(w % 12) * 70}ms` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Commits + repos */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5">
          <div className="glass rounded-2xl border border-line">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="divide-y divide-line">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 sm:px-6">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="hidden h-4 w-20 sm:block" />
                </div>
              ))}
            </div>
          </div>
          <div className="glass h-fit rounded-2xl border border-line">
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="space-y-5 px-5 py-5 sm:px-6">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-1 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
