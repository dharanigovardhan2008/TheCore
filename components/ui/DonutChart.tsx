"use client";

import React, { useEffect, useState } from "react";

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}

export default function DonutChart({ data, size = 160, thickness = 16 }: DonutChartProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const center = size / 2;
  const radius = center - thickness;
  const circumference = 2 * Math.PI * radius;
  // Increase gap for a more premium fragmented look
  const gap = total > 1 ? (circumference * 0.02) : 0; 

  let currentOffset = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="var(--bg-surface-tint)"
          strokeWidth={thickness}
        />
        
        {data.map((item, index) => {
          const ratio = item.value / total;
          const segmentLength = (ratio * circumference) - gap;
          const strokeDasharray = `${Math.max(0, segmentLength)} ${circumference}`;
          const strokeDashoffset = mounted ? -currentOffset : circumference;
          
          currentOffset += (ratio * circumference);
          
          const isHovered = hoveredIndex === index;
          const opacity = hoveredIndex === null || isHovered ? 1 : 0.3;

          return (
            <circle
              key={item.label}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={item.color}
              strokeWidth={isHovered ? thickness + 4 : thickness}
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out cursor-pointer drop-shadow-sm"
              style={{ opacity }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          );
        })}
      </svg>
    </div>
  );
}
