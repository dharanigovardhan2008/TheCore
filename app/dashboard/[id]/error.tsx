"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle size={32} />
      </div>
      <h2 className="text-xl font-bold text-content mb-2">Something went wrong!</h2>
      <p className="text-content-secondary mb-8 max-w-md">
        There was an error loading the project details. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-6 py-3 bg-surface border border-surface-tint text-content font-medium rounded-[var(--radius-btn)] hover:bg-surface-tint transition-colors"
      >
        <RefreshCw size={18} />
        Retry
      </button>
    </div>
  );
}

