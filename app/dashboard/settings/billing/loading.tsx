import React from "react";
import {
  Skeleton,
  SkeletonCard,
  OrbLoadingHero,
} from "@/components/ui/SkeletonCard";

export default function BillingLoading() {
  return (
    <div className="max-w-5xl mx-auto pb-16 animate-in fade-in duration-300 space-y-8">
      {/* Top ThinkingOrb Hero */}
      <OrbLoadingHero
        label="Loading billing & subscription"
        sublabel="Checking subscription tier, quotas & billing invoices"
      />

      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
      </div>

      {/* Subscription Status Card Skeleton */}
      <SkeletonCard className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>

        {/* Quotas & Limits Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-white/50 border border-slate-100 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-4 w-12 rounded-md" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="p-4 rounded-2xl bg-white/50 border border-slate-100 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>
      </SkeletonCard>

      {/* Payment History / Invoices Skeleton */}
      <SkeletonCard className="p-6 sm:p-8 space-y-4">
        <Skeleton className="h-5 w-40 rounded-lg mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-100 bg-white/40 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-36 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  );
}
