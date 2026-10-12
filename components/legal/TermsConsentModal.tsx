'use client';

import React, { useState } from 'react';
import { acceptTerms } from '@/app/dashboard/actions';
import { LEGAL_VERSION } from '@/lib/legal';

export default function TermsConsentModal({ currentVersion }: { currentVersion: string | null }) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(currentVersion !== LEGAL_VERSION);

  if (!isOpen) return null;

  const handleAccept = async () => {
    setLoading(true);
    try {
      await acceptTerms(LEGAL_VERSION);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to accept terms', err);
      alert('Failed to accept terms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface p-8 rounded-[var(--radius-shell)] shadow-[var(--shadow-shell-soft)]">
        <h2 className="text-xl font-bold text-content mb-4">Updated Terms & Privacy Policy</h2>
        <p className="text-content-secondary mb-6 text-sm">
          We&apos;ve updated our <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Privacy Policy</a>. 
          Please review and accept them to continue using TheCore.
        </p>
        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full py-3 bg-accent-primary text-white rounded-[var(--radius-btn)] font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-700"
        >
          {loading ? "Accepting..." : "I Accept"}
        </button>
      </div>
    </div>
  );
}
