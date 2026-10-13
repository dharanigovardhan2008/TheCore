import React from "react";
import {
  Skeleton,
  ProjectCardSkeleton,
  OrbLoadingHero,
} from "@/components/ui/SkeletonCard";

export default function ProjectsLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      {/* Top ThinkingOrb Hero */}
      <OrbLoadingHero
        label="Loading projects"
        sublabel="Retrieving your repositories, platforms & services"
      />

      {/* Header Skeleton */}
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 rounded-xl" />
          <Skeleton className="h-4 w-60 rounded-md" />
        </div>
        <Skeleton className="h-11 w-32 rounded-full" />
      </div>

      {/* Controls Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
        <Skeleton className="h-10 w-full sm:max-w-xs rounded-full" />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>

      {/* Project Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
