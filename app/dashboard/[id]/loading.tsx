import React from "react";
import {
  Skeleton,
  SkeletonCard,
  OrbLoadingHero,
} from "@/components/ui/SkeletonCard";

export default function ProjectDetailLoading() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300 pb-20">
      {/* Top ThinkingOrb Hero */}
      <OrbLoadingHero
        label="Loading project details"
        sublabel="Decrypting linked services, tasks & project notes"
      />

      {/* Project Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-48 rounded-xl" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Main Grid: Details & Side info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Overview & Services & Notes */}
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard className="p-6 sm:p-8 space-y-4">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          </SkeletonCard>

          <SkeletonCard className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-slate-100 bg-white/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28 rounded-md" />
                      <Skeleton className="h-3 w-40 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>

        {/* Right column: To-dos & Vault */}
        <div className="space-y-6">
          <SkeletonCard className="p-6 space-y-4 min-h-[300px]">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24 rounded-lg" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
            <div className="space-y-3 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 py-1.5">
                  <Skeleton className="w-4 h-4 rounded-md shrink-0" />
                  <Skeleton className="h-3.5 w-full rounded-md" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}
