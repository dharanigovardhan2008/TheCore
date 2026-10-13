'use client';

import { useState, useRef, useEffect } from 'react';
import { Mail, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export default function EmailVerification({ email, onVerified, onBack }: EmailVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];

    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }

    setCode(newCode);

    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus();
    } else if (pastedData.length > 0) {
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');

    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use Supabase's built-in email OTP verification
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'email',
      });

      if (verifyError) {
        throw new Error(verifyError.message || 'Invalid or expired code');
      }

      onVerified();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    setError(null);

    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      const { error: resendError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (resendError) {
        throw new Error(resendError.message || 'Failed to resend code');
      }

      setResendCooldown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(b.length));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-content mb-2">Verify your email</h2>
        <p className="text-sm text-content-secondary">
          We sent a 6-digit code to <span className="font-medium text-content">{maskedEmail}</span>
        </p>
      </div>

      {/* 6-Digit Code Input */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleCodeChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-14 text-center text-xl font-bold bg-surface-tint border-2 border-[#DCE9E3] rounded-xl text-content focus:border-blue-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
            disabled={loading}
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || code.join('').length !== 6}
          className="w-full py-3 bg-accent-primary text-white rounded-[var(--radius-btn)] font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Email'
          )}
        </button>

        <div className="flex items-center justify-center gap-4 text-sm">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
            className="text-content-secondary hover:text-accent-primary transition-colors disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>
          <span className="text-content-hint">•</span>
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="text-content-secondary hover:text-accent-primary transition-colors disabled:opacity-50"
          >
            Change email
          </button>
        </div>
      </div>
    </div>
  );
}
