"use client";

import React, { useEffect, useState } from "react";
import { ThinkingOrb, type OrbState, type OrbSize, type OrbTheme } from "thinking-orbs";

export interface LoadingOrbProps {
  state?: OrbState;
  size?: OrbSize;
  theme?: OrbTheme;
  color?: string;
  dotSize?: number;
  dots?: number;
  label?: string;
  sublabel?: string;
  className?: string;
  withContainer?: boolean;
}

export default function LoadingOrb({
  state = "listening",
  size = 64,
  theme = "light",
  color = "#4F46E5",
  dotSize = 1.3,
  dots = 1.1,
  label,
  sublabel,
  className = "",
  withContainer = true,
}: LoadingOrbProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const orbCanvas = (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {mounted ? (
        <ThinkingOrb
          state={state}
          size={size}
          theme={theme}
          color={color}
          dotSize={dotSize}
          dots={dots}
        />
      ) : (
        <div
          className="rounded-full bg-indigo-500/20 animate-pulse"
          style={{ width: size, height: size }}
        />
      )}
    </div>
  );

  return (
    <div className={`flex flex-col items-center justify-center ${label ? "gap-3" : ""} ${className}`}>
      {withContainer ? (
        <div className="relative flex items-center justify-center p-5 rounded-[26px] bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-[0_16px_40px_rgba(15,23,42,0.09),0_2px_8px_rgba(79,70,229,0.06)]">
          {orbCanvas}
        </div>
      ) : (
        orbCanvas
      )}
      {label && (
        <div className="text-center mt-2">
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
 * Centered loader in the middle of the screen with guaranteed high contrast and visibility
 */
export function CenteredLoader({
  minHeight = "min-h-[70vh]",
  size = 64,
  state = "listening",
  color = "#4F46E5",
  theme = "light",
  withContainer = true,
}: {
  minHeight?: string;
  size?: OrbSize;
  state?: OrbState;
  color?: string;
  theme?: OrbTheme;
  withContainer?: boolean;
}) {
  return (
    <div
      className={`w-full flex items-center justify-center animate-in fade-in duration-200 ${minHeight}`}
      role="status"
      aria-label="Loading"
    >
      <LoadingOrb
        state={state}
        size={size}
        color={color}
        theme={theme}
        withContainer={withContainer}
      />
    </div>
  );
}
