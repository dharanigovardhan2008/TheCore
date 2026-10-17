'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CircleCheck, ArrowRight } from 'lucide-react'
import { formatMoney, type Currency } from '@/lib/currency'

export type ProPrices = { monthInr: number; yearInr: number; monthUsd: number; yearUsd: number }

function List({ items, light }: { items: string[]; light?: boolean }) {
  return (
    <ul className="mt-6 space-y-3">
      {items.map((t) => (
        <li key={t} className={`flex items-center gap-3 text-[15px] ${light ? 'text-white' : 'text-slate-800'}`}>
          <CircleCheck className={`h-5 w-5 shrink-0 ${light ? 'text-white/90' : 'text-blue-600'}`} strokeWidth={1.75} />{t}
        </li>
      ))}
    </ul>
  )
}

export default function PricingSection({ signedIn, initialCurrency, prices }: { signedIn: boolean; initialCurrency: Currency; prices: ProPrices }) {
  const [cur, setCur] = useState<Currency>(initialCurrency)
  const usd = cur === 'USD'
  const month = usd ? prices.monthUsd : prices.monthInr
  const year = usd ? prices.yearUsd : prices.yearInr
  const perMonth = usd ? (year / 12).toFixed(2) : String(Math.round(year / 12))
  const save = month > 0 ? Math.max(0, Math.round((1 - year / (month * 12)) * 100)) : 0
  const href = (c: string) => (signedIn ? '/pricing' : `/signup?plan=pro&cycle=${c}`)
  const card = 'rounded-[2rem] border border-slate-200 bg-white p-9 shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-1'

  return (
    <section id="pricing" className="scroll-mt-20 bg-[#fafbff] px-5 py-24 text-center sm:px-8">
      <h2 className="text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl">
        Start free.<br /><span className="text-blue-600">Upgrade when ready.</span>
      </h2>
      <p className="mx-auto mt-6 max-w-xl text-lg text-slate-500">
        Begin with the Free plan. Unlock unlimited projects with Pro starting at {formatMoney(month, cur)}/month or {formatMoney(year, cur)}/year.
      </p>
      <div role="group" aria-label="Currency" className="mx-auto mt-6 inline-flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
        {(['INR', 'USD'] as const).map((c) => (
          <button key={c} type="button" aria-pressed={cur === c} onClick={() => setCur(c)}
            className={`min-h-9 rounded-full px-4 transition ${cur === c ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {c === 'INR' ? '₹ INR' : '$ USD'}
          </button>
        ))}
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl items-center gap-6 text-left md:grid-cols-3">
        <div className={card}>
          <h3 className="text-2xl font-bold text-slate-900">Free</h3>
          <p className="mt-3 text-sm text-slate-500">Perfect for getting started</p>
          <p className="mt-8 text-5xl font-extrabold text-slate-900">{usd ? '$' : '₹'}0 <span className="text-base font-normal text-slate-500">/forever</span></p>
          <List items={['Up to 3 projects', 'AES-256-GCM encryption', 'Full data export']} />
          <Link href={signedIn ? '/dashboard' : '/signup'} className="mt-8 block rounded-full border border-slate-200 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50">Start free</Link>
        </div>

        <div className="relative rounded-[2rem] bg-[#5B72E4] p-9 pb-12 text-white shadow-[0_24px_60px_rgba(91,114,228,0.35)] transition hover:-translate-y-1 md:py-12">
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-xs font-bold tracking-wide text-indigo-600 shadow">BEST VALUE</span>
          <h3 className="text-2xl font-bold">Pro Annual</h3>
          <p className="mt-3 text-sm text-white/85">Save {save}% with yearly billing</p>
          <p className="mt-8 text-5xl font-extrabold">{formatMoney(year, cur)} <span className="text-base font-normal text-white/85">/year</span></p>
          <p className="mt-1 text-sm text-white/70">~{usd ? '$' : '₹'}{perMonth}/month</p>
          <List items={['Unlimited projects', 'Priority support', 'All Free features']} light />
          <Link href={href('year')} className="mt-8 block rounded-full bg-white py-3 text-center text-sm font-semibold text-indigo-600 hover:bg-indigo-50">Get Pro Annual</Link>
        </div>

        <div className={card}>
          <h3 className="text-2xl font-bold text-slate-900">Pro Monthly</h3>
          <p className="mt-3 text-sm text-slate-500">Flexible monthly billing</p>
          <p className="mt-8 text-5xl font-extrabold text-slate-900">{formatMoney(month, cur)} <span className="text-base font-normal text-slate-500">/month</span></p>
          <List items={['Unlimited projects', 'Priority support', 'No auto-renewal']} />
          <Link href={href('month')} className="mt-8 block rounded-full border border-slate-200 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50">Get Pro Monthly</Link>
        </div>
      </div>

      <Link href="/pricing" className="mt-12 inline-flex items-center gap-2 text-[15px] font-semibold text-blue-600 transition-all hover:gap-3">
        View detailed pricing and features <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  )
}