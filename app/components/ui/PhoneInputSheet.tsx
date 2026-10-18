'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';

interface PhoneInputSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (phone: string) => Promise<void>;
  onCancel: () => void;
}

export default function PhoneInputSheet({
  isOpen,
  onOpenChange,
  onContinue,
  onCancel,
}: PhoneInputSheetProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  const validatePhone = (value: string): string | null => {
    // Strip spaces, dashes, and leading +91 or 0
    const cleaned = value
      .replace(/\s+/g, '')
      .replace(/-/g, '')
      .replace(/^\+91|^0/, '');

    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      return 'Enter a valid 10-digit Indian mobile number.';
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validatePhone(phone);
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    try {
      await onContinue(phone);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onKeyDown={handleKeyDown}>
      <div className="relative w-full max-w-md mx-4 sm:mx-0">
        {/* Bottom sheet on mobile, centered on desktop */}
        <div className="bg-[var(--bg-card)] rounded-[24px] border border-[var(--border-light)] shadow-xl w-full max-w-xs">
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Your mobile number</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Our payment partner needs a mobile number to process your payment.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="phone-input" className="text-sm font-medium text-[var(--text-secondary)] block mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="phone-input"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={phone}
                    onChange={handleChange}
                    className={`block w-[16px] rounded-[12px] border border-[var(--border-light)] bg-[var(--bg-input)] text-[var(--text-content)] placeholder:text-[var(--text-content-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] sm:text-base sm:w-full`}
                    placeholder="Enter 10-digit mobile number"
                  />
                  {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 rounded-[12px] border border-[var(--border-light)] bg-[var(--bg-button-secondary)] text-[var(--text-content-secondary)] hover:bg-[var(--bg-button-secondary-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-4 py-2 rounded-[12px] bg-[var(--primary)] text-[var(--text-on-primary)] hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Continuing...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}