"use client";

import React, { useEffect, useState } from "react";
import { ThinkingOrb, type OrbState, type OrbSize } from "thinking-orbs";

export interface LoadingOrbProps {
  state?: OrbState;
  size?: OrbSize;
  color?: string;
  label?: string;
  sublabel?: string;
  className?: string;
}

export default function LoadingOrb({
  state = "listening",
  size = 64,
  color,
  label,
  sublabel,
  className = "",
}: LoadingOrbProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center ${label ? "gap-3" : ""} ${className}`}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {mounted ? (
          <ThinkingOrb state={state} size={size} color={color} />
        ) : (
          <div
            className="rounded-full bg-indigo-500/10 animate-pulse"
            style={{ width: size, height: size }}
          />
        )}
      </div>
      {label && (
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800 tracking-tight">{label}</p>
          {sublabel && (
            <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Full viewport/container centered loading screen with ThinkingOrb right in the middle
 */
export function CenteredLoader({
  minHeight = "min-h-[70vh]",
  size = 64,
  state = "listening",
  color,
}: {
  minHeight?: string;
  size?: OrbSize;
  state?: OrbState;
  color?: string;
}) {
  return (
    <div
      className={`w-full flex items-center justify-center animate-in fade-in duration-200 ${minHeight}`}
      role="status"
      aria-label="Loading"
    >
      <LoadingOrb state={state} size={size} color={color} />
    </div>
  );
}
