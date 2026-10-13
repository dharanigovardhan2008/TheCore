"use client";

import React from "react";
import LoadingOrb from "./LoadingOrb";

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`animate-pulse bg-slate-200/70 dark:bg-slate-700/40 rounded-lg ${className}`}
    />
  );
}

export function SkeletonCard({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`glass rounded-[var(--radius-card)] shadow-[var(--shadow-soft)] border border-slate-200/60 p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="glass rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-soft)] border border-slate-200/60 flex flex-col justify-between min-h-[200px]">
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </div>
          <Skeleton className="w-6 h-6 rounded-full shrink-0" />
        </div>
        <div className="space-y-2 mb-4">
          <Skeleton className="h-3 w-full rounded-md" />
          <Skeleton className="h-3 w-4/5 rounded-md" />
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass rounded-[var(--radius-card)] p-4 sm:p-5 shadow-[var(--shadow-soft)] border border-slate-200/60 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
      <div className="space-y-1.5 flex-1 min-w-0">
        <Skeleton className="h-5 w-12 rounded-md" />
        <Skeleton className="h-3 w-20 rounded-md" />
      </div>
    </div>
  );
}

export function PageHeaderSkeleton({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div className="space-y-2">
        {title ? (
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
            {title}
          </h1>
        ) : (
          <Skeleton className="h-8 w-48 rounded-xl" />
        )}
        {subtitle ? (
          <p className="text-sm text-slate-500">{subtitle}</p>
        ) : (
          <Skeleton className="h-4 w-64 rounded-md" />
        )}
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
    </div>
  );
}

export function OrbLoadingHero({
  label = "Loading page...",
  sublabel = "Preparing your workspace",
}: {
  label?: string;
  sublabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      <div className="p-4 rounded-3xl bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center">
        <LoadingOrb state="listening" size={64} label={label} sublabel={sublabel} />
      </div>
    </div>
  );
}
