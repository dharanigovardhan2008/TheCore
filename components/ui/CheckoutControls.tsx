'use client';

import { useState } from 'react';
import type { Currency } from '@/lib/currency';

/** Pay-in currency switch. India = INR (Cashfree), everyone else = USD (Polar). The server re-validates the choice. */
export function CurrencySwitch({
  value,
  onChange,
  allowInr,
}: {
  value: Currency;
  onChange: (c: Currency) => void;
  allowInr: boolean;
}) {
  return (
    <div role="group" aria-label="Pay in currency" className="mx-auto mb-8 inline-flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
      {(['INR', 'USD'] as const).map((c) => {
        const disabled = c === 'INR' && !allowInr;
        return (
          <button
            key={c}
            type="button"
            disabled={disabled}
            aria-pressed={value === c}
            onClick={() => onChange(c)}
            className={`min-h-9 rounded-full px-4 transition ${
              value === c ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            {c === 'INR' ? '₹ INR' : '$ USD'}
          </button>
        );
      })}
    </div>
  );
}

/** Cashfree needs a real mobile number. Collected only when paying in INR. */
export function PhonePrompt({
  onSubmit,
  onCancel,
}: {
  onSubmit: (phone: string) => void;
  onCancel: () => void;
}) {
  const [phone, setPhone] = useState('');
  const valid = /^[6-9]\d{9}$/.test(phone);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Mobile number">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Mobile number</h3>
        <p className="mt-1 text-sm text-slate-500">Required by our Indian payment provider to pay in INR (UPI, cards, NetBanking).</p>
        <input
          type="tel"
          inputMode="numeric"
          autoFocus
          maxLength={10}
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
          placeholder="10-digit mobile number"
          className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onSubmit(phone)}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
