'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  CheckCircle,
  AlertCircle,
  Camera,
  Upload,
  Loader2,
  Mail,
  Shield,
  X,
} from 'lucide-react';
import Link from 'next/link';
import Brand from '@/components/ui/Brand';
import LoadingOrb from '@/components/ui/LoadingOrb';
import { CURRENT_TERMS_VERSION } from '@/lib/legal';

const DEFAULT_PROFESSIONS = [
  'Software Developer',
  'Student',
  'Indie Hacker / Founder',
  'UI/UX Designer',
  'Freelancer',
  'Product Manager',
  'Other',
];

// 20 premium 3D avatars matching ProfileClient.tsx
const DEFAULT_AVATARS = Array.from({ length: 20 }, (_, i) => `/avatars/avatar-${String(i + 1).padStart(2, '0')}.png`);

export default function SignupClient() {
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(DEFAULT_AVATARS[0]);
  const [profession, setProfession] = useState<string>('Software Developer');
  const [customProfession, setCustomProfession] = useState<string>('');
  const [workplace, setWorkplace] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // UI state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Email verification state
  const [emailVerificationStep, setEmailVerificationStep] = useState<'form' | 'verify' | 'verified'>('form');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Dismiss modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (errorMsg) setErrorMsg(null);
        if (successMsg) setSuccessMsg(null);
        if (showAvatarModal) setShowAvatarModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [errorMsg, successMsg, showAvatarModal]);

  const currentAvatar = avatarUrl || DEFAULT_AVATARS[0];

  // Custom photo upload handler
  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image must be smaller than 5 MB.');
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);

    try {
      let uploadedUrl: string | null = null;
      try {
        const authRes = await fetch('/api/imagekit/auth');
        if (authRes.ok) {
          const authData = await authRes.json();
          if (!authData.error) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || '');
            formData.append('signature', authData.signature);
            formData.append('expire', authData.expire.toString());
            formData.append('token', authData.token);
            formData.append('folder', '/profile-avatars');
            formData.append('fileName', `avatar-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`);

            const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
              method: 'POST',
              body: formData,
            });

            if (uploadRes.ok) {
              const resJson = await uploadRes.json();
              if (resJson.url) {
                uploadedUrl = resJson.url;
              }
            }
          }
        }
      } catch {
        // Fallback
      }

      if (!uploadedUrl) {
        uploadedUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setAvatarUrl(uploadedUrl);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to process image.');
    } finally {
      setIsUploading(false);
    }
  };

  // Send verification code
  const handleSendVerificationCode = async () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Please enter your email address');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter a password');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      setErrorMsg('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    // Dev Mode Bypass
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock-project')) {
      setEmailVerificationStep('verify');
      setSuccessMsg('Dev mode: enter 123456 to verify.');
      setResendCooldown(60);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setEmailVerificationStep('verify');
      setResendCooldown(60);
      setSuccessMsg(`Verification code sent to ${email.trim()}`);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Code input handlers
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1);
    setVerificationCode(newCode);
    setErrorMsg(null);

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...verificationCode];

    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }

    setVerificationCode(newCode);

    if (pastedData.length === 6) {
      codeInputRefs.current[5]?.focus();
    }
  };

  // Verify OTP code
  const handleVerifyEmail = async () => {
    const code = verificationCode.join('');

    if (code.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit code');
      return;
    }

    // Dev Mode Bypass
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock-project')) {
      if (code === '123456') {
        setEmailVerificationStep('verified');
        setSuccessMsg('Email verified successfully! You can now create your account.');
        return;
      }
    }

    setVerifyLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: 'email',
      });

      if (error) throw new Error('Invalid or expired code');

      setEmailVerificationStep('verified');
      setSuccessMsg('Email verified successfully! You can now create your account.');
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Verification failed');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Final account creation submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emailVerificationStep !== 'verified') {
      await handleSendVerificationCode();
      return;
    }

    // Dev Mode Bypass
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock-project')) {
      setSuccessMsg('Dev Mode: Account created! Redirecting to dashboard...');
      setTimeout(() => router.push('/dashboard'), 1000);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const finalProfession =
        profession === 'Other'
          ? customProfession.trim() || 'Other'
          : profession || 'Software Developer';

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;

      if (currentUser) {
        const { error: updateError } = await supabase.auth.updateUser({
          password,
          data: {
            full_name: name.trim(),
            avatar_url: avatarUrl,
            profession: finalProfession,
            workplace: workplace.trim(),
          },
        });

        if (updateError) throw updateError;

        await supabase.from('profiles').upsert(
          {
            id: currentUser.id,
            display_name: name.trim(),
            avatar_url: avatarUrl,
            profession: finalProfession,
            workplace: workplace.trim(),
            terms_version: CURRENT_TERMS_VERSION,
            terms_accepted_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: name.trim(),
              avatar_url: avatarUrl,
              profession: finalProfession,
              workplace: workplace.trim(),
            },
          },
        });

        if (signUpError) throw signUpError;

        if (signUpData?.user) {
          await supabase.from('profiles').upsert(
            {
              id: signUpData.user.id,
              display_name: name.trim(),
              avatar_url: avatarUrl,
              profession: finalProfession,
              workplace: workplace.trim(),
              terms_version: CURRENT_TERMS_VERSION,
              terms_accepted_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        }
      }

      setSuccessMsg('Account created successfully! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!agreedToTerms) {
      setErrorMsg('You must agree to the Terms of Service and Privacy Policy before continuing');
      return;
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock-project')) {
      alert('[Dev Mode] Simulating Google Auth success. Going to profile settings!');
      router.push('/dashboard/settings/profile');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?signup=true&next=/dashboard/settings/profile`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Google authentication failed');
      setLoading(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(Math.max(1, b.length)))
    : '';

  return (
    <>
      {/* Full Page Loading Animation Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="p-6 rounded-[28px] bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-2xl flex flex-col items-center text-center max-w-xs w-full">
            <LoadingOrb state="connecting" size={64} withContainer={false} />
            <p className="text-sm font-semibold text-slate-800 mt-4 tracking-tight">
              Connecting...
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Please wait while we redirect you
            </p>
          </div>
        </div>
      )}
      {/* Centered Signup Card - Same max-width and sizing as Login page (max-w-md) */}
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-[28px] border border-[var(--border-light)] shadow-[var(--shadow-shell-soft)] transition-all my-auto">
        {/* Brand & Header matching Login page */}
        <div className="text-center mb-6">
          <div className="mb-4 flex justify-center">
            <Brand size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome to TheCore</h1>
          <p className="text-[var(--text-secondary)] mt-1.5 text-sm">
            Create a new account
          </p>
        </div>

        {/* Sign In / Sign Up Switcher matching Sign In page pill design */}
        <div className="flex bg-[#F4FAF7] p-1.5 rounded-full border border-[var(--border-light)] max-w-xs mx-auto mb-6 shadow-xs">
          <Link
            href="/login"
            className="flex-1 py-2 text-center text-sm font-medium rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Sign In
          </Link>
          <span className="flex-1 py-2 text-center text-sm font-semibold rounded-full bg-white text-[var(--text-primary)] shadow-xs">
            Sign Up
          </span>
        </div>

        {/* Compact Avatar Picker */}
        <div className="flex items-center gap-3.5 p-2.5 bg-[#F4FAF7] rounded-[20px] border border-[var(--border-light)] mb-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border-2 border-[var(--border-light)]">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Profile avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-lg font-bold">
                  {name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors cursor-pointer">
              <Camera className="w-3 h-3" />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleCustomUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Choose Avatar
              </button>
              <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-[var(--border-light)] transition-colors cursor-pointer">
                <Upload className="w-3 h-3" />
                {isUploading ? 'Uploading...' : 'Upload'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleCustomUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1 truncate">
              20 3D avatars or custom photo (max 5MB)
            </p>
          </div>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full border border-[var(--border-light)] bg-[#F4FAF7] text-[var(--text-primary)] text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
              placeholder="Alex Rivera"
            />
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailVerificationStep === 'verified') {
                    setEmailVerificationStep('form');
                  }
                }}
                disabled={emailVerificationStep === 'verify'}
                className="w-full px-4 py-2.5 rounded-full border border-[var(--border-light)] bg-[#F4FAF7] text-[var(--text-primary)] text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                placeholder="you@example.com"
              />
              {emailVerificationStep === 'verified' && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                  <Shield className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
          </div>

          {/* Verification Code Box (Visible in verify step) */}
          {emailVerificationStep === 'verify' && (
            <div className="p-4 rounded-[20px] bg-blue-50 border border-blue-200 flex flex-col items-center animate-in fade-in">
              <div className="text-center mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600">
                  <Mail className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-blue-900">Enter Verification Code</h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  Code sent to <span className="font-semibold text-blue-900">{maskedEmail}</span>
                </p>
              </div>

              <div className="flex justify-center gap-2 mb-3" onPaste={handleCodePaste}>
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      codeInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className="w-9 h-11 text-center text-lg font-bold bg-white border border-blue-200 rounded-xl text-[var(--text-primary)] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                    disabled={verifyLoading}
                  />
                ))}
              </div>

              <div className="space-y-2 w-full">
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={verifyLoading || verificationCode.join('').length !== 6}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold rounded-full transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
                >
                  {verifyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify Code'}
                </button>
                <div className="flex items-center justify-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={resendCooldown > 0 || verifyLoading}
                    className="text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50 font-medium"
                  >
                    {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend'}
                  </button>
                  <span className="text-blue-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailVerificationStep('form');
                      setVerificationCode(['', '', '', '', '', '']);
                    }}
                    disabled={verifyLoading}
                    className="text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Change email
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full border border-[var(--border-light)] bg-[#F4FAF7] text-[var(--text-primary)] text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                placeholder="6+ chars"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Confirm
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-full border border-[var(--border-light)] bg-[#F4FAF7] text-[var(--text-primary)] text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                placeholder="Confirm"
              />
            </div>
          </div>

          {/* Profession Selection */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
              Profession / Role
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {DEFAULT_PROFESSIONS.map((prof) => (
                <button
                  key={prof}
                  type="button"
                  onClick={() => setProfession(prof)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    profession === prof
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[#F4FAF7] hover:bg-slate-100 text-slate-700 border border-[var(--border-light)]'
                  }`}
                >
                  {prof}
                </button>
              ))}
            </div>

            {profession === 'Other' && (
              <input
                type="text"
                required
                value={customProfession}
                onChange={(e) => setCustomProfession(e.target.value)}
                className="w-full px-4 py-2 rounded-full border border-[var(--border-light)] bg-[#F4FAF7] text-[var(--text-primary)] text-xs focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors mt-1"
                placeholder="Specify your profession"
              />
            )}
          </div>

          {/* Workplace / College */}
          <div>
            <label htmlFor="workplace" className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Workplace / Organization
            </label>
            <input
              id="workplace"
              type="text"
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full border border-[var(--border-light)] bg-[#F4FAF7] text-[var(--text-primary)] text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
              placeholder="e.g. Google, MIT, Freelancer..."
            />
          </div>

          {/* Terms & Privacy Consent */}
          <div className="flex items-start gap-2 pt-0.5">
            <input
              type="checkbox"
              id="terms"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#DCE9E3] text-blue-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            />
            <label htmlFor="terms" className="text-xs text-[var(--text-secondary)] leading-tight cursor-pointer select-none">
              I agree to the{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </label>
          </div>

          {/* Primary Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-full shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {emailVerificationStep === 'form' ? 'Verifying...' : 'Creating Account...'}
                </>
              ) : emailVerificationStep === 'verified' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Create Account
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Verify &amp; Create Account
                </>
              )}
            </button>
          </div>
        </form>

        {/* Divider & Google Auth */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[var(--border-light)] w-full" />
          <span className="bg-white px-2 text-[11px] text-[var(--text-secondary)] uppercase tracking-wider absolute">
            or
          </span>
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-full border border-[var(--border-light)] bg-white hover:bg-slate-50 text-[var(--text-primary)] text-sm font-medium transition-all shadow-xs"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Footer Link */}
        <p className="text-center text-xs text-[var(--text-secondary)] mt-4">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* POPUP ERROR MODAL IN THE MIDDLE OF THE PAGE */}
      {errorMsg && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setErrorMsg(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-[24px] max-w-sm w-full p-6 text-center shadow-2xl border border-[var(--border-light)] scale-in-95 animate-in duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
              <AlertCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1.5">
              Notice
            </h3>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
              {errorMsg}
            </p>

            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="w-full py-2.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* POPUP SUCCESS MODAL IN THE MIDDLE OF THE PAGE */}
      {successMsg && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSuccessMsg(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-[24px] max-w-sm w-full p-6 text-center shadow-2xl border border-[var(--border-light)] scale-in-95 animate-in duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
              <CheckCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1.5">
              Success
            </h3>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
              {successMsg}
            </p>

            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="w-full py-2.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* 20 Avatars Modal */}
      {showAvatarModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowAvatarModal(false)}
        >
          <div
            className="max-w-2xl w-full bg-white rounded-[28px] shadow-2xl border border-[var(--border-light)] max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--border-light)] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Choose Your Avatar
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  20 premium 3D character avatars available
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
              {DEFAULT_AVATARS.map((avatar, idx) => {
                const isSelected = avatarUrl === avatar;
                return (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(avatar);
                      setShowAvatarModal(false);
                    }}
                    className={`relative aspect-square rounded-[16px] overflow-hidden border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                        : 'border-transparent hover:border-slate-300 hover:scale-105'
                    }`}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-[var(--border-light)] bg-[#F4FAF7]/50 flex items-center justify-between rounded-b-[28px]">
              <span className="text-xs text-[var(--text-secondary)]">
                20 avatars available
              </span>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
