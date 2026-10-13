import React from "react";
import {
  Skeleton,
  SkeletonCard,
  OrbLoadingHero,
} from "@/components/ui/SkeletonCard";

export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      {/* Top ThinkingOrb Hero */}
      <OrbLoadingHero
        label="Loading admin portal"
        sublabel="Aggregating platform metrics, users & revenue data"
      />

      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="w-10 h-10 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-3 w-36 rounded-md" />
          </SkeletonCard>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard className="p-6 space-y-4 min-h-[300px]">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </SkeletonCard>

        <SkeletonCard className="p-6 space-y-4 min-h-[300px]">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}
