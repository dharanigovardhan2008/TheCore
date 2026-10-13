'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Briefcase,
  Building,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  Info,
  Camera,
  Upload,
} from 'lucide-react';
import { updateUserProfile } from '../actions';

const DEFAULT_PROFESSIONS = [
  'Software Developer',
  'Student',
  'Indie Hacker / Founder',
  'UI/UX Designer',
  'Freelancer',
  'Product Manager',
  'Other',
];

interface ProfileClientProps {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    profession: string | null;
    workplace: string | null;
    plan: string;
    isPro: boolean;
    planExpiresAt: string | null;
    createdAt?: string;
  };
}

// Inline simplified avatar picker for cleaner integration
const DEFAULT_AVATARS = Array.from({ length: 20 }, (_, i) => `/avatars/avatar-${String(i + 1).padStart(2, '0')}.png`);

export default function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl || null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const initialIsDefaultProf = DEFAULT_PROFESSIONS.includes(user.profession || '');
  const [profession, setProfession] = useState<string>(
    user.profession
      ? initialIsDefaultProf
        ? user.profession
        : 'Other'
      : 'Software Developer'
  );
  const [customProfession, setCustomProfession] = useState<string>(
    user.profession && !initialIsDefaultProf ? user.profession : ''
  );
  const [workplace, setWorkplace] = useState(user.workplace || '');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isProfileIncomplete = !user.avatarUrl || !user.profession || !user.workplace;

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const finalProfession =
      profession === 'Other'
        ? customProfession.trim() || 'Other'
        : profession || 'Software Developer';

    try {
      await updateUserProfile({
        displayName: name.trim(),
        avatarUrl,
        profession: finalProfession,
        workplace: workplace.trim(),
      });

      setSuccessMsg('Profile saved successfully');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const currentAvatar = avatarUrl || DEFAULT_AVATARS[0];

  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Back Navigation */}
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        Settings
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight mb-2">
          Personal Details
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Manage your profile information and avatar
        </p>
      </div>

      {/* Profile Incomplete Notice */}
      {isProfileIncomplete && (
        <div className="mb-6 p-4 rounded-[20px] bg-blue-50 border border-blue-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-0.5">Complete your profile</h4>
            <p className="text-sm text-blue-700">
              Add your avatar, profession, and workplace to personalize your account
            </p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-[20px] bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium text-emerald-900">{successMsg}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-[20px] bg-red-50 border border-red-200 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-sm font-medium text-red-900">{errorMsg}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-[28px] border border-[var(--border-light)] shadow-sm">
        <div className="p-8 space-y-8">
          {/* Avatar Section */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-4">
              Profile Picture
            </label>

            <div className="flex items-start gap-6">
              {/* Avatar Preview */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-[var(--border-light)]">
                  {currentAvatar ? (
                    <img
                      src={currentAvatar}
                      alt="Profile avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                      {name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 p-2 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleCustomUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>

              {/* Avatar Actions */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAvatarModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Choose Avatar
                  </button>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Uploading...' : 'Upload Photo'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleCustomUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>

                <p className="text-xs text-[var(--text-secondary)]">
                  Choose from 20 premium 3D avatars or upload your own image (max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--border-light)]" />

          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-3 rounded-full border border-[var(--border-light)] bg-[#F4FAF7] text-[var(--text-primary)] text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
              placeholder="Alex Rivera"
            />
          </div>

          {/* Email (Read-Only) */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                disabled
                value={user.email}
                className="w-full px-5 py-3 rounded-full border border-[var(--border-light)] bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
                <Shield className="w-3 h-3" />
                Verified
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">
              Managed by your authentication provider
            </p>
          </div>

          {/* Profession */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">
              Profession
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {DEFAULT_PROFESSIONS.map((prof) => (
                <button
                  key={prof}
                  type="button"
                  onClick={() => setProfession(prof)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    profession === prof
                      ? 'bg-blue-600 text-white shadow-sm'
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
                className="w-full px-5 py-3 rounded-full border border-[var(--border-light)] bg-[#F4FAF7] text-[var(--text-primary)] text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                placeholder="Specify your profession"
              />
            )}
          </div>

          {/* Workplace */}
          <div>
            <label htmlFor="workplace" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              Workplace / Organization
            </label>
            <input
              id="workplace"
              type="text"
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
              className="w-full px-5 py-3 rounded-full border border-[var(--border-light)] bg-[#F4FAF7] text-[var(--text-primary)] text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
              placeholder="Google, MIT, Freelancer, Stealth Startup..."
            />
          </div>
        </div>

        {/* Form Footer */}
        <div className="px-8 py-5 border-t border-[var(--border-light)] bg-[#F4FAF7]/50 rounded-b-[28px] flex items-center justify-between">
          <span className="text-xs text-[var(--text-secondary)]">
            Changes save to your account
          </span>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-3xl w-full bg-white rounded-[28px] shadow-2xl border border-[var(--border-light)] max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--border-light)] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Choose Your Avatar
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                  20 premium 3D character avatars available
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-3">
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
                    className={`relative aspect-square rounded-[18px] overflow-hidden border-2 transition-all ${
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
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border-light)] bg-[#F4FAF7]/50 flex items-center justify-between rounded-b-[28px]">
              <span className="text-xs text-[var(--text-secondary)]">
                20 premium avatars available
              </span>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-5 py-2 rounded-full text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
