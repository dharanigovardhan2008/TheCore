"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Trash, User, Loader2, Check, FileText, CreditCard } from "lucide-react";
import { deleteAccount, updateProfile } from "./actions";

export default function SettingsClient({ user }: { user: { email: string, name: string } }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you absolutely sure you want to delete your account and all data? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
      window.location.href = "/";
    } catch (error) {
      console.error("Delete failed", error);
      alert("Failed to delete account.");
      setIsDeleting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name === user.name) return;
    
    setIsSaving(true);
    setSaved(false);
    try {
      await updateProfile(name);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 px-4 sm:px-0">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Settings</h1>
      </div>

      <div className="space-y-12">
        {/* Account Section */}
        <section>
          <div className="px-4 sm:px-0 mb-4 text-[13px] font-bold text-[var(--text-secondary)] uppercase tracking-wide flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile Details
          </div>
          <div className="glass rounded-[var(--radius-panel)] overflow-hidden shadow-[var(--shadow-soft)] p-6 sm:p-8">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={user.email} 
                  disabled
                  className="w-full h-12 px-4 bg-[var(--bg-page)]/50 border border-[var(--border-light)] rounded-[var(--radius-input)] text-[15px] text-[var(--text-tertiary)] cursor-not-allowed shadow-sm"
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-2">Your email address cannot be changed.</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 glass hover:bg-white/40 dark:hover:bg-black/40 border border-[var(--border-light)] rounded-[var(--radius-input)] text-[15px] text-[var(--text-primary)] focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-premium shadow-sm"
                  placeholder="Your name"
                />
              </div>

              <div className="pt-2 flex items-center gap-4">
                <button 
                  type="submit" 
                  disabled={isSaving || !name.trim() || name === user.name}
                  className="h-11 px-6 bg-gradient-to-tr from-[var(--color-primary)] to-[#818CF8] hover:scale-105 active:scale-95 text-white text-sm font-semibold rounded-[var(--radius-btn)] shadow-[0_4px_12px_rgba(79,70,229,0.3)] transition-premium disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
                
                {saved && (
                  <span className="text-sm font-medium text-green-600 flex items-center gap-1 animate-in fade-in zoom-in duration-300">
                    <Check className="w-4 h-4" />
                    Saved
                  </span>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* Subscription & Billing Section */}
        <section>
          <div className="px-4 sm:px-0 mb-4 text-[13px] font-bold text-[var(--text-secondary)] uppercase tracking-wide flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription & Billing
          </div>
          <div className="glass rounded-[var(--radius-panel)] overflow-hidden shadow-[var(--shadow-soft)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Manage Plans & Invoices</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                View your current limits, upgrade to Pro with Cashfree, or download payment receipts.
              </p>
            </div>
            <Link
              href="/dashboard/settings/billing"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
            >
              Billing Settings →
            </Link>
          </div>
        </section>

        {/* Legal Section */}
        <section>
          <div className="px-4 sm:px-0 mb-4 text-[13px] font-bold text-[var(--text-secondary)] uppercase tracking-wide flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Legal & Compliance
          </div>
          <div className="glass rounded-[var(--radius-panel)] overflow-hidden shadow-[var(--shadow-soft)] p-6 sm:p-8">
            <div className="flex flex-col gap-4">
              <Link href="/pricing" className="text-[15px] font-medium text-[var(--text-primary)] hover:text-accent-primary transition-colors flex items-center justify-between">
                Pricing & Plans
                <span className="text-[var(--text-tertiary)]">→</span>
              </Link>
              <div className="h-px w-full bg-[var(--border-light)]" />
              <Link href="/refund-policy" className="text-[15px] font-medium text-[var(--text-primary)] hover:text-accent-primary transition-colors flex items-center justify-between">
                Refund & Cancellation Policy
                <span className="text-[var(--text-tertiary)]">→</span>
              </Link>
              <div className="h-px w-full bg-[var(--border-light)]" />
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-[15px] font-medium text-[var(--text-primary)] hover:text-accent-primary transition-colors flex items-center justify-between">
                Terms of Service
                <span className="text-[var(--text-tertiary)]">→</span>
              </Link>
              <div className="h-px w-full bg-[var(--border-light)]" />
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[15px] font-medium text-[var(--text-primary)] hover:text-accent-primary transition-colors flex items-center justify-between">
                Privacy Policy
                <span className="text-[var(--text-tertiary)]">→</span>
              </Link>
              <div className="h-px w-full bg-[var(--border-light)]" />
              <Link href="/contact" className="text-[15px] font-medium text-[var(--text-primary)] hover:text-accent-primary transition-colors flex items-center justify-between">
                Contact & Support
                <span className="text-[var(--text-tertiary)]">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Danger Zone Section */}
        <section>
          <div className="px-4 sm:px-0 mb-4 text-[13px] font-bold text-red-500 uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </div>
          <div className="glass rounded-[var(--radius-panel)] overflow-hidden shadow-sm border border-red-500/20 p-6 sm:p-8 bg-red-500/5">
            <div className="flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-1">Delete Account</h3>
                <p className="text-sm text-red-600/70 dark:text-red-400/70">
                  Permanently delete your account and all associated data. This cannot be recovered. 
                  See our <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-600 dark:hover:text-red-300">Privacy Policy</Link> regarding data retention.
                </p>
              </div>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="shrink-0 h-11 px-6 bg-red-500 hover:bg-red-600 hover:scale-105 active:scale-95 text-white text-sm font-semibold rounded-[var(--radius-btn)] shadow-[0_4px_12px_rgba(239,68,68,0.3)] transition-premium disabled:opacity-50 disabled:scale-100 flex items-center gap-2 justify-center"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash className="w-4 h-4" /> Delete Account</>}
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
