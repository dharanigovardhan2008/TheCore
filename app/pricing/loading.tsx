import React from "react";
import {
  Skeleton,
  SkeletonCard,
  OrbLoadingHero,
} from "@/components/ui/SkeletonCard";

export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-[#F8F7FF] py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-300">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Top ThinkingOrb Hero */}
        <OrbLoadingHero
          label="Loading pricing plans"
          sublabel="Fetching plan options, currency & billing cycles"
        />

        {/* Pricing Title & Subtitle */}
        <div className="text-center space-y-3">
          <Skeleton className="h-10 w-64 mx-auto rounded-xl" />
          <Skeleton className="h-5 w-96 max-w-full mx-auto rounded-md" />
        </div>

        {/* Billing Cycle Toggle Pill */}
        <div className="flex justify-center">
          <Skeleton className="h-12 w-64 rounded-full" />
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-4">
          {/* Free Plan Card Skeleton */}
          <SkeletonCard className="p-8 space-y-6 flex flex-col justify-between min-h-[460px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-24 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-4 w-48 rounded-md" />
              <div className="space-y-3 pt-4 border-t border-slate-100">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                    <Skeleton className="h-3.5 w-40 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-12 w-full rounded-full" />
          </SkeletonCard>

          {/* Pro Plan Card Skeleton */}
          <SkeletonCard className="p-8 space-y-6 flex flex-col justify-between min-h-[460px] border-indigo-200/60 shadow-lg">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-28 rounded-lg" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-10 w-36 rounded-lg" />
              <Skeleton className="h-4 w-56 rounded-md" />
              <div className="space-y-3 pt-4 border-t border-slate-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                    <Skeleton className="h-3.5 w-48 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-12 w-full rounded-full" />
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}
