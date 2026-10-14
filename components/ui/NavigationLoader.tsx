'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoadingOrb from '@/components/ui/LoadingOrb';

export default function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear loading state as soon as pathname or search params update
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsLoading(false);
  }, [pathname, searchParams]);

  // Global listener for internal navigation links
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      // Find the closest anchor tag
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Ignore external links, mailto, tel, hashes, new tabs, downloads, or modifier keys
      if (
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        target.target === '_blank' ||
        target.hasAttribute('download') ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      try {
        const url = new URL(href, window.location.href);
        // Only trigger for same-origin navigation to a different path
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }
      } catch {
        return;
      }

      // User clicked another page/link: trigger loading animation
      if (timerRef.current) clearTimeout(timerRef.current);

      // Start loading animation from the next second (180ms delay prevents flash for instant cached pages)
      timerRef.current = setTimeout(() => {
        setIsLoading(true);
      }, 180);
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/25 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="status"
      aria-label="Loading page"
    >
      <div className="p-6 rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl flex flex-col items-center text-center max-w-xs w-full animate-in zoom-in-95 duration-150">
        <LoadingOrb state="listening" size={64} withContainer={false} />
        <p className="text-sm font-semibold text-slate-800 mt-3.5 tracking-tight">
          Loading...
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          Preparing your workspace
        </p>
      </div>
    </div>
  );
}
