import React from "react";
import {
  Skeleton,
  SkeletonCard,
  OrbLoadingHero,
} from "@/components/ui/SkeletonCard";

export default function AccountsLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top ThinkingOrb Hero */}
      <OrbLoadingHero
        label="Loading accounts"
        sublabel="Aggregating hosting emails and linked platforms"
      />

      {/* Header Skeleton */}
      <div className="space-y-2 pb-2">
        <Skeleton className="h-8 w-44 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>

      {/* Account Groups Skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-48 rounded-md" />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div
                  key={j}
                  className="p-3.5 rounded-xl border border-slate-100 bg-white/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="w-7 h-7 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="h-3.5 w-24 rounded-md" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="w-5 h-5 rounded-md" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
