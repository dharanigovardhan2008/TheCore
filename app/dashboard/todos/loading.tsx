import React from "react";
import {
  Skeleton,
  SkeletonCard,
  OrbLoadingHero,
} from "@/components/ui/SkeletonCard";

export default function TodosLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      {/* Top ThinkingOrb Hero */}
      <OrbLoadingHero
        label="Loading to-dos"
        sublabel="Organizing tasks and checklists across your projects"
      />

      {/* Header Skeleton */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36 rounded-xl" />
          <Skeleton className="h-4 w-52 rounded-md" />
        </div>
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>

      {/* Quick Add Bar Skeleton */}
      <SkeletonCard className="p-3 sm:p-4 rounded-2xl flex items-center gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
        <Skeleton className="h-10 w-20 rounded-xl" />
      </SkeletonCard>

      {/* Filters Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>

      {/* Grouped To-dos Lists Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-3.5 h-3.5 rounded-full" />
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-5 w-8 rounded-full ml-auto" />
            </div>
            <div className="space-y-3 pt-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <Skeleton className="w-5 h-5 rounded-md shrink-0" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-16 rounded-full ml-auto" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  );
}
