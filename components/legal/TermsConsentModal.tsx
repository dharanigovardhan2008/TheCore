'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { acceptTerms } from '@/app/dashboard/actions';
import { CURRENT_TERMS_VERSION } from '@/lib/legal';

interface TermsConsentModalProps {
  showConsent: boolean;
}

export default function TermsConsentModal({ showConsent }: TermsConsentModalProps) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(showConsent);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await acceptTerms(CURRENT_TERMS_VERSION);
      if (result?.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setError(result?.message || 'Could not save your acceptance. Please try again.');
      }
    } catch {
      setError('Could not save your acceptance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-[var(--radius-shell)] shadow-[var(--shadow-shell-soft)]">
        <h2 className="text-xl font-bold text-content mb-4">Terms & Privacy Policy</h2>
        <p className="text-content-secondary mb-6 text-sm">
          Please review and accept our <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Privacy Policy</a> to continue using TheCore.
        </p>
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full py-3 bg-accent-primary text-white rounded-[var(--radius-btn)] font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
        >
          {loading ? "Saving acceptance..." : "I Accept"}
        </button>
      </div>
    </div>
  );
}
