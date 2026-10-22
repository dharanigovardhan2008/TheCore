"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Lock, ArrowRight, Check } from 'lucide-react';

interface ProjectLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limit?: number | null;
}

const PERKS = [
  'Unlimited projects',
  'Unlimited encrypted .env files per project',
  'Multi-environment configs (.env, .env.local, .env.prod)',
];

export default function ProjectLimitModal({ isOpen, onClose, limit }: ProjectLimitModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="limit-modal-title"
    >
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <Lock className="h-6 w-6" />
        </span>
        <h2 id="limit-modal-title" className="mt-5 text-2xl font-bold tracking-tight text-slate-950">
          Project limit reached
        </h2>
        <p className="mt-2 text-[15px] text-slate-600">
          {limit
            ? `The Free plan includes up to ${limit} projects, and you have used all of them.`
            : 'You have reached the project limit of your current plan.'}{' '}
          Upgrade to Pro to keep adding projects.
        </p>

        <ul className="mt-5 space-y-2 rounded-2xl bg-slate-50 p-4 text-left text-sm text-slate-700">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <span>{perk}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/pricing"
          className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
        >
          Upgrade to Pro
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-full px-6 py-2.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          Maybe later
        </button>
      </div>
    </div>,
    document.body
  );
}
