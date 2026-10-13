import React from "react";
import {
  Skeleton,
  SkeletonCard,
  OrbLoadingHero,
} from "@/components/ui/SkeletonCard";

export default function EnvLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Top ThinkingOrb Hero */}
      <OrbLoadingHero
        label="Loading encrypted vault"
        sublabel="Verifying zero-knowledge encryption & environment files"
      />

      {/* Header Skeleton */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>

      {/* Vault Status Banner Skeleton */}
      <SkeletonCard className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 rounded-md" />
            <Skeleton className="h-3 w-72 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-9 w-24 rounded-full" />
      </SkeletonCard>

      {/* Search Input Skeleton */}
      <Skeleton className="h-10 w-full sm:max-w-md rounded-full" />

      {/* Env File Group Skeletons */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-3.5 h-3.5 rounded-full" />
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-full ml-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, j) => (
                <div
                  key={j}
                  className="p-4 rounded-2xl border border-slate-100 bg-white/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-40 rounded-md" />
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <Skeleton className="h-3 w-20 rounded-md" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
