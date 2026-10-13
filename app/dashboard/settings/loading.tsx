import React from "react";
import {
  Skeleton,
  SkeletonCard,
  OrbLoadingHero,
} from "@/components/ui/SkeletonCard";

export default function SettingsLoading() {
  return (
    <div className="max-w-3xl mx-auto pb-12 animate-in fade-in duration-300 space-y-6">
      {/* Top ThinkingOrb Hero */}
      <OrbLoadingHero
        label="Loading settings"
        sublabel="Loading your preferences, profile & security"
      />

      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-4 sm:px-0">
        <Skeleton className="h-8 w-36 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>

      {/* Profile Card Skeleton */}
      <SkeletonCard className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3 w-48 rounded-md" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </SkeletonCard>

      {/* Plan & Subscription Card Skeleton */}
      <SkeletonCard className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-3 w-56 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </SkeletonCard>

      {/* Danger Zone Skeleton */}
      <SkeletonCard className="p-6 sm:p-8 border-rose-100 space-y-4">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="h-3 w-full rounded-md" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </SkeletonCard>
    </div>
  );
}
