'use client';

import { Check } from 'lucide-react';
import { ReactNode } from 'react';

interface PricingCardProps {
  name: string;
  description: string;
  price: string | number;
  period?: string;
  features: string[];
  badge?: string;
  isFeatured?: boolean;
  ctaLabel: string;
  ctaAction: () => void;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  secondaryLabel?: string;
  className?: string;
}

export default function PricingCard({
  name,
  description,
  price,
  period,
  features,
  badge,
  isFeatured = false,
  ctaLabel,
  ctaAction,
  ctaDisabled = false,
  ctaLoading = false,
  secondaryLabel,
  className = '',
}: PricingCardProps) {
  if (isFeatured) {
    return (
      <article
        className={`relative flex flex-col rounded-[28px] bg-[#5B72E6] p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 lg:scale-[1.03] ${className}`}
      >
        {badge && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold uppercase bg-white text-[#5B72E6] shadow-sm whitespace-nowrap">
            {badge}
          </div>
        )}

        <div className="mb-6 mt-2">
          <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
          <p className="text-sm text-white/80 leading-relaxed min-h-[44px]">
            {description}
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-white">
              {typeof price === 'number' ? `₹${price}` : price}
            </span>
            {period && (
              <span className="text-base text-white/70">
                {period}
              </span>
            )}
          </div>
          {secondaryLabel && (
            <p className="text-sm text-white/60 mt-2">
              {secondaryLabel}
            </p>
          )}
        </div>

        <div className="h-px w-full bg-white/20 mb-6" />

        <ul className="space-y-3.5 mb-8 flex-1">
          {features.map((feat, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-white">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-white stroke-[2.5]" />
              </div>
              <span className="font-medium">{feat}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={ctaAction}
          disabled={ctaDisabled || ctaLoading}
          className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-white/95 text-[#5B72E6] font-semibold text-sm shadow-sm transition-all duration-250 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {ctaLoading ? 'Loading...' : ctaLabel}
        </button>
      </article>
    );
  }

  return (
    <article
      className={`relative flex flex-col rounded-[28px] bg-white border border-[#DCE9E3] p-8 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-slate-300 ${className}`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm whitespace-nowrap">
          {badge}
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-[#172B2A] mb-2">{name}</h3>
        <p className="text-sm text-[#647570] leading-relaxed min-h-[44px]">
          {description}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-[#172B2A]">
            {typeof price === 'number' ? `₹${price}` : price}
          </span>
          {period && (
            <span className="text-base text-[#647570]">
              {period}
            </span>
          )}
        </div>
        {secondaryLabel && (
          <p className="text-sm text-[#8E9F9A] mt-2">
            {secondaryLabel}
          </p>
        )}
      </div>

      <div className="h-px w-full bg-[#DCE9E3] mb-6" />

      <ul className="space-y-3.5 mb-8 flex-1">
        {features.map((feat, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-[#172B2A]">
            <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-blue-600 stroke-[2.5]" />
            </div>
            <span>{feat}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={ctaAction}
        disabled={ctaDisabled || ctaLoading}
        className="w-full py-3.5 px-6 rounded-full bg-[#F4FAF7] hover:bg-[#EBF5F0] text-[#172B2A] font-semibold text-sm border border-[#DCE9E3] transition-all duration-250 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {ctaLoading ? 'Loading...' : ctaLabel}
      </button>
    </article>
  );
}
