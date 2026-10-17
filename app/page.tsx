import Link from 'next/link'
import Image from 'next/image'
import { headers } from 'next/headers'
import { Lock, Check, Timer } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { currencyFromCountry } from '@/lib/currency'
import Reveal from '@/components/ui/Reveal'
import PricingSection from './PricingSection'

const cols = [
  ['Idea', [['Habit tracker', 'Next.js · Supabase']]],
  ['In progress', [['Client API', 'Railway · dev@outlook.com'], ['Portfolio v2', 'Vercel · work@gmail.com']]],
  ['Deployed', [['Portfolio site', 'Vercel · work@gmail.com'], ['Blog engine', 'Netlify · side@gmail.com']]],
  ['Paused', [['Chat app', 'Render · old@gmail.com']]],
] as const
const logos = [['GitHub', 'github'], ['Netlify', 'netlify'], ['Railway', 'railway'], ['Cloudflare', 'cloudflare'], ['Firebase', 'firebase'], ['Render', 'render']]
const facts = [
  ['AES-256', 'GCM encryption for every .env file, done in your browser.'],
  ['250k+', 'PBKDF2 iterations protect your master password.'],
  ['0', 'hosting passwords stored. We only record which email you used.'],
  ['10 min', 'auto-lock on the vault, with clipboard cleared after 30 seconds.'],
]
const steps = [
  ['Add your project', 'Name it, set its status and stack, and link the repo and live URL.'],
  ['Record where it lives', 'Pick the platform and the login email for the frontend, backend, database and domain.'],
  ['Lock your secrets', 'Store .env files in the encrypted vault and list what is left to do.'],
]
const faqs = [
  ['Can you read my .env files?', 'No. They are encrypted in your browser before they are saved. Without your master password, nobody can read them, including us. A lost master password cannot be recovered.'],
  ['Do you store my hosting passwords?', 'Never. TheCore only records which email you used on each platform.'],
  ['Is everything end-to-end encrypted?', 'Only the .env vault is. Project names, platforms, emails and to-dos are stored normally, protected by row-level security.'],
  ['Does Pro renew automatically?', 'No. Pro is a prepaid pass for 1 or 12 months. You are never charged again unless you buy again.'],
]
const card = 'rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/5'
const mini = 'mt-5 rounded-2xl bg-slate-50 p-4 text-sm'

export default async function Home() {
  const supabase = await createClient()
  const [{ data: { user } }, { data: cfg }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('plan_configs').select('*').eq('id', 'pro').maybeSingle(),
  ])
  const country = (await headers()).get('x-vercel-ip-country')
  const prices = {
    monthInr: cfg?.price_month_rupees ?? 99, yearInr: cfg?.price_year_rupees ?? 999,
    monthUsd: Number(cfg?.price_month_usd) || 2.99, yearUsd: Number(cfg?.price_year_usd) || 29,
  }
  const cta = user ? '/dashboard' : '/signup'
  const h2 = 'text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl'

  return (
    <main className="bg-white text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#cfe0ff] via-[#e6eeff] to-white">
        <div aria-hidden className="pointer-events-none absolute -left-24 top-48 h-56 w-96 rounded-full bg-white/80 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-24 top-24 h-64 w-[28rem] rounded-full bg-white/70 blur-3xl" />

        <nav className="relative z-10 mx-auto flex h-20 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Image src="/logo.png" alt="TheCore" width={32} height={32} priority className="h-8 w-8 rounded-lg object-contain" />TheCore
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-700 md:flex">
            <a href="#features" className="hover:text-slate-950">Features</a>
            <a href="#security" className="hover:text-slate-950">Security</a>
            <a href="#how" className="hover:text-slate-950">How it works</a>
            <a href="#pricing" className="hover:text-slate-950">Pricing</a>
            <a href="#faq" className="hover:text-slate-950">FAQ</a>
          </div>
          <div className="flex items-center gap-3 text-sm font-semibold">
            {!user && <Link href="/login" className="hidden text-slate-700 hover:text-slate-950 sm:block">Log in</Link>}
            <Link href={cta} className="rounded-full bg-slate-950 px-5 py-2.5 text-white transition hover:bg-slate-800">{user ? 'Dashboard' : 'Get started'}</Link>
          </div>
        </nav>

        <div className="relative z-10 px-5 pb-0 pt-14 text-center sm:pt-20">
          <Reveal className="mx-auto max-w-4xl">
            <h1 className="text-5xl font-extrabold leading-[1.04] tracking-tight text-slate-950 sm:text-7xl">
              Every project you built is one forgotten login <span className="text-blue-600">from gone.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-slate-600">
              Which email did you use for Vercel? Where is that .env? What was left to ship? TheCore remembers every platform, login and secret.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={cta} className="rounded-full bg-blue-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:-translate-y-0.5 hover:bg-blue-700">Start free, no card needed</Link>
              <a href="#pricing" className="rounded-full border border-slate-300 bg-white/60 px-8 py-3.5 font-semibold backdrop-blur transition hover:bg-white">See pricing</a>
            </div>
          </Reveal>

          <Reveal delay={150} className="relative mx-auto mt-16 max-w-5xl">
            <div className="relative h-[380px] overflow-hidden rounded-t-[2rem] border border-white/80 bg-white/50 p-3 shadow-2xl shadow-blue-900/10 backdrop-blur">
              <div className="h-full rounded-2xl bg-white p-5 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <p className="font-bold">Projects</p>
                  <div className="flex gap-2 text-xs font-medium"><span className="rounded-lg bg-slate-100 px-3 py-1.5">Search…</span><span className="rounded-lg bg-blue-600 px-3 py-1.5 text-white">+ New project</span></div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {cols.map(([title, items]) => (
                    <div key={title} className="rounded-xl bg-slate-50 p-3">
                      <p className="mb-3 text-xs font-semibold text-slate-500">{title}</p>
                      {items.map(([n, m]) => (
                        <div key={n} className="mb-2 rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
                          <p className="text-sm font-semibold">{n}</p><p className="mt-0.5 truncate text-[11px] text-slate-500">{m}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-14 md:flex-row">
        <p className="shrink-0 text-sm text-slate-500 md:w-56">Keep track of every platform you deploy to.</p>
        <div className="flex flex-wrap justify-center gap-3">
          {logos.map(([n, f]) => (
            <span key={f} className="flex items-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
              <Image src={`/logos/${f}.png`} alt="" width={20} height={20} className="h-5 w-5 object-contain" />{n}
            </span>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <Reveal className="text-center"><h2 className={h2}>Everything your projects need,<br />in one place.</h2><p className="mt-4 text-slate-600">Stop digging through old inboxes and dashboards.</p></Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          <Reveal><div className={`${card} h-full`}><h3 className="font-semibold">Platforms and login emails</h3><p className="mt-1 text-sm text-slate-600">See where each part of a project is hosted and which email unlocks it.</p>
            <div className={mini}>{[['Frontend', 'Vercel', 'work@gmail.com'], ['Database', 'Supabase', 'side@gmail.com'], ['Domain', 'Cloudflare', 'work@gmail.com']].map(([a, b, c]) => <div key={a} className="flex items-center justify-between border-b border-slate-200/70 py-2 last:border-0"><span className="text-xs text-slate-500">{a}</span><span className="text-xs font-semibold">{b} · {c}</span></div>)}</div></div></Reveal>
          <Reveal delay={80}><div className={`${card} h-full`}><h3 className="font-semibold">To-dos that stay with the project</h3><p className="mt-1 text-sm text-slate-600">Priorities and due dates, per project and in one global list.</p>
            <div className={mini}>{[['Add custom domain', 'High'], ['Rotate API key', 'Medium'], ['Write README', 'Low']].map(([t, p]) => <div key={t} className="flex items-center justify-between py-2"><span className="flex items-center gap-2 text-xs font-medium"><Check className="h-3.5 w-3.5 text-blue-600" />{t}</span><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">{p}</span></div>)}</div></div></Reveal>
          <Reveal delay={160}><div className={`${card} h-full`}><h3 className="font-semibold">Accounts view</h3><p className="mt-1 text-sm text-slate-600">Every login email with the projects registered under it.</p>
            <div className={mini}>{[['work@gmail.com', '5 projects'], ['side@gmail.com', '3 projects'], ['dev@outlook.com', '2 projects']].map(([e, n]) => <div key={e} className="flex items-center justify-between py-2"><span className="text-xs font-medium">{e}</span><span className="text-xs text-slate-500">{n}</span></div>)}</div></div></Reveal>
          <Reveal className="md:col-span-3"><div className={`${card} grid items-center gap-6 bg-gradient-to-br from-blue-50 to-white md:grid-cols-2`}>
            <div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white"><Lock className="h-5 w-5" /></span><h3 className="mt-5 text-2xl font-bold">The encrypted .env vault</h3><p className="mt-2 text-slate-600">Keep several .env files per project, masked by default, locked behind a master password that never leaves your device.</p></div>
            <div className="rounded-2xl bg-slate-950 p-5 font-mono text-xs text-slate-300">{['DATABASE_URL', 'STRIPE_SECRET', 'SUPABASE_KEY'].map((k) => <p key={k} className="py-1">{k}=<span className="text-blue-400">••••••••••••••••</span></p>)}<p className="mt-3 flex items-center gap-2 text-[11px] text-emerald-400"><Timer className="h-3.5 w-3.5" />Auto-locks in 10 minutes</p></div>
          </div></Reveal>
        </div>
      </section>

      <section id="security" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <Reveal className="text-center"><h2 className={h2}>Built so you can trust it.</h2><p className="mx-auto mt-4 max-w-xl text-slate-600">Real numbers, not marketing. Only the .env vault is end-to-end encrypted.</p></Reveal>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(([n, d], i) => (
            <Reveal key={n} delay={i * 80}><div className={`${card} h-full bg-gradient-to-b from-blue-50/70 to-white`}><p className="text-4xl font-extrabold text-blue-600">{n}</p><p className="mt-12 text-sm text-slate-600">{d}</p></div></Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
        <Reveal className="text-center"><h2 className={h2}>Get started in 3 easy steps.</h2></Reveal>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <Reveal><div className="flex h-full min-h-72 items-center justify-center rounded-3xl bg-gradient-to-br from-[#cfe0ff] to-blue-100 p-8">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"><p className="text-sm font-bold">New project</p>
              {['Portfolio site', 'Vercel', 'work@gmail.com'].map((v, i) => <div key={v} className="mt-3"><p className="text-[10px] font-medium text-slate-400">{['Name', 'Platform', 'Login email'][i]}</p><p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-xs">{v}</p></div>)}
              <p className="mt-4 rounded-lg bg-blue-600 py-2 text-center text-xs font-semibold text-white">Save project</p></div></div></Reveal>
          <div className="space-y-4">{steps.map(([t, d], i) => (
            <Reveal key={t} delay={i * 100}><div className={`${card} flex items-start gap-4`}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">{i + 1}</span><div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-slate-600">{d}</p></div></div></Reveal>
          ))}</div>
        </div>
      </section>

      <Reveal><PricingSection signedIn={Boolean(user)} initialCurrency={currencyFromCountry(country)} prices={prices} /></Reveal>

      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 py-24">
        <Reveal className="text-center"><h2 className={h2}>Questions, answered.</h2></Reveal>
        <div className="mt-12 space-y-3">{faqs.map(([q, a]) => (
          <details key={q} className="group rounded-2xl border border-slate-200 bg-white p-5 open:shadow-md">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{q}<span className="text-xl text-blue-600 transition group-open:rotate-45">+</span></summary>
            <p className="mt-3 text-sm text-slate-600">{a}</p>
          </details>
        ))}</div>
      </section>

      <section className="px-5 pb-24">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-500 px-6 py-16 text-center text-white">
          <h2 className="mx-auto max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">Stop searching. Start shipping.</h2>
          <p className="mx-auto mt-4 max-w-md text-blue-100">Set up your first project in under two minutes.</p>
          <Link href={cta} className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-50">Create your free account</Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 text-sm text-slate-500 sm:flex-row">
          <a href="https://opsyl.in" className="flex items-center gap-2.5 font-medium text-slate-700">
            <Image src="/opsyl.png" alt="Opsyl" width={28} height={28} className="h-7 w-7 object-contain" />A product by Opsyl
          </a>
          <div className="flex flex-wrap justify-center gap-5">
            {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Cookies', '/cookies'], ['Refunds', '/refund-policy'], ['Contact', '/contact']].map(([l, h]) => <Link key={h} href={h} className="hover:text-slate-900">{l}</Link>)}
          </div>
        </div>
      </footer>
    </main>
  )
}