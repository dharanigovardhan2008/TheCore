'use client';

import React, { useState, useEffect } from 'react';
import { useVault } from '@/components/providers/VaultProvider';
import { getProfile } from '@/app/dashboard/vaultActions';
import { VaultVerifier } from '@/lib/crypto';
import { Lock, Unlock, Loader2, AlertTriangle, X } from 'lucide-react';
import CodeSlots from './CodeSlots';

interface UnlockVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UnlockVaultModal({ isOpen, onClose }: UnlockVaultModalProps) {
  const { unlock, setup } = useVault();
  const [mode, setMode] = useState<'loading' | 'unlock' | 'setup'>('loading');
  const [verifier, setVerifier] = useState<VaultVerifier | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setLoading(true);
      setMode('loading');
      
      getProfile()
        .then((profile) => {
          if (profile && profile.vault_verifier) {
            setVerifier(profile.vault_verifier);
            setMode('unlock');
          } else {
            setMode('setup');
          }
        })
        .catch(() => {
          setError('Failed to check vault status.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent, directCode?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const currentPass = directCode !== undefined ? directCode : password;

    try {
      if (mode === 'setup') {
        if (currentPass.length !== 4 || !/^\d{4}$/.test(currentPass)) {
          setError('PIN must be exactly 4 digits');
          setLoading(false);
          return;
        }
        await setup(currentPass);
        onClose();
      } else if (mode === 'unlock' && verifier) {
        const success = await unlock(currentPass, verifier);
        if (success) {
          onClose();
        } else {
          setError('Invalid 4-digit PIN');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center justify-end bg-black/50 backdrop-blur-sm sm:p-4">
      <div className="glass w-full sm:w-[540px] rounded-t-[28px] sm:rounded-[20px] shadow-[var(--shadow-shell-soft)] flex flex-col overflow-hidden relative max-h-[90dvh] sm:max-h-[90vh] mt-auto sm:mt-0 pb-[env(safe-area-inset-bottom)] sm:pb-0">
        <div className="w-9 h-1.5 bg-gray-300 rounded-full mx-auto my-3 sm:hidden" />
        
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-light)]">
          <button 
            onClick={onClose}
            type="button"
            className="text-[17px] text-[var(--color-primary)] hover:opacity-80 transition-opacity"
          >
            Cancel
          </button>
          <div className="font-semibold text-[var(--text-primary)] text-[17px]">
            {mode === 'setup' ? 'Set PIN' : 'Unlock Vault'}
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || password.length !== 4}
            type="submit"
            className="text-[17px] font-semibold text-[var(--color-primary)] hover:opacity-80 disabled:opacity-50 transition-opacity"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'setup' ? 'Save' : 'Unlock')}
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] mb-4">
              {mode === 'setup' ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
            </div>
            <p className="text-[15px] text-[var(--text-secondary)] mt-2">
              {mode === 'setup' 
                ? 'Create a 4-digit PIN to encrypt your .env files. This PIN cannot be recovered if lost.' 
                : 'Enter your 4-digit PIN to access your encrypted environment variables.'}
            </p>
          </div>

          {mode === 'loading' ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--text-tertiary)]" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-[var(--radius-btn)] text-sm flex items-start gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-3 items-center">
                {mode === 'setup' && (
                  <label className="text-[15px] font-medium text-[var(--text-secondary)]">Enter 4-Digit PIN</label>
                )}
                <CodeSlots
                  length={4}
                  value={password}
                  mask={true}
                  status={error ? 'error' : 'idle'}
                  onChange={(code: string) => {
                    setPassword(code);
                    setError(null);
                  }}
                  onComplete={(code: string) => {
                    setPassword(code);
                    setTimeout(() => handleSubmit(undefined, code), 100);
                  }}
                  accentColor="#f5f5f5"
                  inkColor="#f5f5f5"
                  slotColor="#27272a"
                  digitColor="#18181b"
                  dangerColor="#ff3b30"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


