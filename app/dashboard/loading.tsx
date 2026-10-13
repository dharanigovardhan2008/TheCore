import React from "react";
import {
  Skeleton,
  SkeletonCard,
  StatCardSkeleton,
  ProjectCardSkeleton,
  OrbLoadingHero,
} from "@/components/ui/SkeletonCard";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 pb-20 animate-in fade-in duration-300">
      {/* Top ThinkingOrb Hero */}
      <OrbLoadingHero
        label="Loading your dashboard"
        sublabel="Gathering your active projects, services & vault status"
      />

      {/* Metric Stat Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Main Grid: Chart & Activity Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card Skeleton */}
        <SkeletonCard className="lg:col-span-2 p-8 min-h-[300px] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-5 w-40 rounded-lg" />
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 py-4">
            <div className="w-48 h-48 rounded-full border-8 border-slate-100 flex items-center justify-center animate-pulse">
              <Skeleton className="w-24 h-24 rounded-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
          </div>
        </SkeletonCard>

        {/* Activity Card Skeleton */}
        <SkeletonCard className="p-8 min-h-[300px]">
          <Skeleton className="h-5 w-36 rounded-lg mb-6" />
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3.5 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/3 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>

      {/* Recent Projects Grid Skeleton */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-44 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
