
"use client";

import type { ElementType } from "react";

type IconProps = {
  icon: ElementType;
  size?: number;
  className?: string;
  strokeWidth?: number;
};

export default function UIIcon({
  icon: Icon,
  size = 20,
  className,
  strokeWidth = 1.8,
}: IconProps) {
  return (
    <Icon
      size={size}
      className={className}
      strokeWidth={strokeWidth}
      aria-hidden="true"
    />
  );
}
