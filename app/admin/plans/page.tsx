import { PLANS } from '@/lib/plans';
import { Check, ShieldCheck, Layers, FileCode, IndianRupee } from 'lucide-react';

export default function AdminPlansPage() {
  const free = PLANS.free;
  const pro = PLANS.pro;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plans & Limits Configuration</h1>
        <p className="text-sm text-[var(--text-content-secondary)] mt-1">
          Authoritative plan limits and Cashfree pricing definitions from <code className="font-mono text-xs bg-[var(--bg-grouped)] px-1.5 py-0.5 rounded">lib/plans.ts</code>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Plan Card */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--separator)] shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{free.name}</h2>
              <p className="text-xs text-[var(--text-content-secondary)] mt-0.5">{free.description}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--bg-grouped)] text-[var(--text-content-secondary)] border border-[var(--separator)]">
              {free.badge}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-content-secondary)] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Max Projects
              </span>
              <span className="font-bold">{free.limits.maxProjects}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-content-secondary)] flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" /> Max .env Files per Project
              </span>
              <span className="font-bold">{free.limits.maxEnvFilesPerProject}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-content-secondary)] flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5" /> Price
              </span>
              <span className="font-bold">₹0 (Free Forever)</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase text-[var(--text-content-secondary)] mb-3">
              Included Features
            </h3>
            <ul className="space-y-2 text-xs">
              {free.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-[var(--text-content-secondary)]">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pro Plan Card */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border-2 border-blue-500/50 shadow-md space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{pro.name}</h2>
              <p className="text-xs text-[var(--text-content-secondary)] mt-0.5">{pro.description}</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {pro.badge}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)] space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-content-secondary)] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Max Projects
              </span>
              <span className="font-bold text-blue-500">Unlimited (Infinity)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-content-secondary)] flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" /> Max .env Files per Project
              </span>
              <span className="font-bold text-blue-500">Unlimited (Infinity)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-content-secondary)] flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5" /> Monthly Price
              </span>
              <span className="font-bold">₹{pro.pricing?.month.amountInRupees} ({pro.pricing?.month.amountInPaise} paise)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-content-secondary)] flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5" /> Annual Price
              </span>
              <span className="font-bold">₹{pro.pricing?.year.amountInRupees} ({pro.pricing?.year.amountInPaise} paise)</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase text-[var(--text-content-secondary)] mb-3">
              Included Features
            </h3>
            <ul className="space-y-2 text-xs">
              {pro.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-[var(--text-content)]">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--separator)] text-xs text-[var(--text-content-secondary)] flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>Plan limits and prices are strictly validated on the server. Modifying client requests cannot bypass database restrictions.</span>
      </div>
    </div>
  );
}

