import React from "react";
import Link from "next/link";
import Image from "next/image";

interface BrandProps {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  compact?: boolean;
  inverse?: boolean;
  showText?: boolean;
}

/**
 * Brand component
 * Displays the real app logo from /logo.png with the "TheCore" wordmark.
 */
export default function Brand({
  className = "",
  href = "/",
  size = "md",
  compact = false,
  inverse = false,
  showText = true,
}: BrandProps) {
  const effectiveSize = compact ? "sm" : size;
  const sizeConfig = {
    sm: { img: 28, text: "text-lg", gap: "gap-2" },
    md: { img: 34, text: "text-xl", gap: "gap-2.5" },
    lg: { img: 42, text: "text-2xl", gap: "gap-3" },
  }[effectiveSize];

  const content = (
    <span
      className={`inline-flex items-center ${sizeConfig.gap} ${className}`}
    >
      <span className="relative flex shrink-0 items-center justify-center">
        <Image
          src="/logo.png"
          alt="TheCore Logo"
          width={sizeConfig.img}
          height={sizeConfig.img}
          priority
          className="object-contain drop-shadow-sm select-none"
        />
      </span>
      {showText && (
        <span
          className={`font-semibold tracking-[-0.04em] transition-colors ${sizeConfig.text} ${
            inverse ? "text-white" : "text-[var(--text-primary,#101828)]"
          }`}
        >
          TheCore
        </span>
      )}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex items-center select-none">
      {content}
    </Link>
  );
}
