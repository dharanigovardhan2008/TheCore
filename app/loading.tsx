import React from "react";
import LoadingOrb from "@/components/ui/LoadingOrb";

export default function RootLoading() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 bg-[#F8F7FF] animate-in fade-in duration-300">
      <div className="p-8 sm:p-10 rounded-[28px] bg-white/80 backdrop-blur-2xl border border-slate-200/80 shadow-[0_20px_50px_rgba(70,80,160,0.08)] flex flex-col items-center text-center max-w-sm w-full space-y-4">
        <LoadingOrb
          state="listening"
          size={64}
          label="TheCore"
          sublabel="Loading your workspace..."
        />
        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="w-full h-full bg-indigo-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
