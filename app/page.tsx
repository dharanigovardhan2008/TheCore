import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Command,
  Download,
  KeyRound,
  ListChecks,
  Lock,
  Mail,
  Search,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import Brand from "@/components/ui/Brand";
import { createClient } from "@/utils/supabase/server";
import { PLANS } from "@/lib/plans-display";
import PricingSection from "./PricingSection";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thecore.indevs.in";
const OWNER_NAME = "Dharani"; // confirm: shown in the founder note and must match your legal pages

const title = "TheCore: track your projects, hosting platforms and .env files";
const description =
  "Keep every side project's hosting platforms, login emails, to-dos and encrypted .env files in one place. Free for 3 projects.";

const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: { title, description, url: siteUrl, siteName: "TheCore", type: "website" },
  twitter: { card: "summary_large_image", title, description },
  ...(google || bing
    ? {
        verification: {
          ...(google ? { google } : {}),
          ...(bing ? { other: { "msvalidate.01": bing } } : {}),
        },
      }
    : {}),
};

const questions = [
  ["Which host is this project on?", "Every project lists its platforms: frontend, backend, database and domain."],
  ["Which of my 10 emails did I sign up with?", "Each platform stores the login email you used, so you never guess again."],
  ["What was left to do?", "Per-project to-dos with priority and due dates."],
  ["What was in that .env?", "Saved encrypted, in your browser, behind a master password."],
];

const steps = [
  ["Add a project", "Name it, set its status and add the repo and live links."],
  ["Record where it lives", "Add each platform and the email you logged in with."],
  ["Lock the .env, list the to-dos", "Paste your .env files and note what is left."],
];

const faqs = [
  ["What is TheCore?", "TheCore is a place to keep, for each of your side projects, where it is hosted, which email you used to log in, what is left to do, and its encrypted .env files."],
  ["Is it free?", `Yes. The Free plan lets you keep up to ${PLANS.free.projects} projects for free, forever. Pro removes the limits.`],
  ["Is Pro a subscription?", "No. Pro is a prepaid pass for 1 month or 12 months. It does not renew automatically, so you are never charged by surprise."],
  ["What happens when Pro ends?", "Your data stays. You can still view and export everything, but you cannot add items above the Free limits until you upgrade again."],
  ["Do you store my hosting passwords?", "No. TheCore only stores platform names and the email you used. Keep passwords in a password manager."],
  ["Can you read my .env files?", "No. They are encrypted in your browser before they are saved. We cannot read them, and we cannot recover your master password if you lose it."],
  ["Is everything end-to-end encrypted?", "No, only the .env files are. Project names, platforms, login emails, notes and to-dos are stored normally so the app can search and show them."],
  ["Can I export or delete my data?", "Yes. You can export everything as JSON and delete your account from Settings."],
  ["Can I get a refund?", "See the Refund Policy for the rules."],
];

const sampleProjects = [
  { name: "Seatsync", status: "Deployed", dot: "bg-emerald-500", platform: "Vercel", email: "work@gmail.com", todos: 2 },
  { name: "Academe", status: "Deployed", dot: "bg-emerald-500", platform: "Render", email: "acad.dev@gmail.com", todos: 1 },
  { name: "Pocket Ledger", status: "In progress", dot: "bg-blue-500", platform: "Netlify", email: "side.projects@gmail.com", todos: 3 },
];

function SampleDashboard() {
  return (
    <figure className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/5 sm:p-5">
        <p className="px-1 pb-3 text-sm font-semibold text-slate-900">Projects</p>
        <ul className="space-y-3">
          {sampleProjects.map((p) => (
            <li key={p.name} className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-900">{p.name}</span>
                <span className="flex items-center gap-2 text-sm text-slate-600">
                  <span className={`h-2 w-2 rounded-full ${p.dot}`} aria-hidden />
                  {p.status}
                </span>
              </div>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                <Mail size={15} className="shrink-0 text-blue-600" aria-hidden />
                <span className="truncate">
                  <span className="font-medium">{p.platform}</span> with {p.email}
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-500">{p.todos} open to-dos</p>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-3 text-center text-sm text-slate-500">Sample data</figcaption>
    </figure>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const signedIn = Boolean(user);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "TheCore",
        url: siteUrl,
        description,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        offers: [
          { "@type": "Offer", name: "Free", price: "0", priceCurrency: "INR" },
          { "@type": "Offer", name: "Pro, 1 month", price: String(PLANS.pro.monthlyInr), priceCurrency: "INR" },
          { "@type": "Offer", name: "Pro, 12 months", price: String(PLANS.pro.yearlyInr), priceCurrency: "INR" },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  const primary = signedIn ? "/dashboard" : "/signup";
  const primaryLabel = signedIn ? "Open dashboard" : "Start free";
  const btn =
    "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold transition active:scale-[0.98]";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#pricing" className="hover:text-slate-900">Pricing</a>
            <a href="#faq" className="hover:text-slate-900">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            {!signedIn && (
              <Link href="/login" className="inline-flex h-11 items-center px-3 text-sm font-medium text-slate-700 hover:text-slate-900">
                Log in
              </Link>
            )}
            <Link href={primary} className={`${btn} h-11 bg-blue-600 px-5 text-sm text-white hover:bg-blue-700`}>
              {primaryLabel}
            </Link>
          </div>
        </nav>
      </header>

      <main className={`bg-white text-slate-900 ${signedIn ? "" : "pb-20 md:pb-0"}`}>
        {/* Hero */}
        <section className="px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1 className="max-w-2xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Forgot which email you used for Vercel?
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                TheCore keeps every project&apos;s hosting platforms, login emails, to-dos and encrypted
                .env files in one place.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href={primary} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>
                  {primaryLabel} <ArrowRight size={18} aria-hidden />
                </Link>
                <a href="#pricing" className={`${btn} border border-slate-300 text-slate-900 hover:bg-slate-50`}>
                  See pricing
                </a>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Free for {PLANS.free.projects} projects. No card needed.
              </p>
            </div>
            <SampleDashboard />
          </div>
        </section>

        {/* Problem */}
        <section className="bg-slate-50 px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Six months later, you remember none of it.
            </h2>
            <dl className="mt-12 grid gap-x-12 gap-y-8 sm:grid-cols-2">
              {questions.map(([q, a]) => (
                <div key={q} className="border-t border-slate-300 pt-5">
                  <dt className="text-lg font-semibold">{q}</dt>
                  <dd className="mt-2 text-slate-600">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Steps */}
        <section className="px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Set up a project in a minute.
            </h2>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map(([t, d], i) => (
                <li key={t} className="rounded-3xl border border-slate-200 p-7">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-xl font-semibold">{t}</h3>
                  <p className="mt-2 text-slate-600">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 bg-slate-50 px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Everything a project needs to be found again.
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                { icon: Mail, t: "Platforms and login emails", d: "Frontend, backend, database, domain, or a custom type you name. Each with the email you used.", span: "md:col-span-2" },
                { icon: Lock, t: "Encrypted .env vault", d: "Several files per project, locked with a master password. Auto-locks after 10 minutes.", span: "" },
                { icon: ListChecks, t: "To-dos per project", d: "Priority and due dates, plus one page for everything.", span: "" },
                { icon: Users, t: "Accounts view", d: "See which projects and platforms sit under each email.", span: "" },
                { icon: Search, t: "Search and filters", d: "Find by name, platform, email, status or tech.", span: "" },
                { icon: Command, t: "Command palette", d: "Press Ctrl or Cmd + K to jump anywhere.", span: "" },
                { icon: Download, t: "Export and import", d: "Take your data with you as JSON, any time.", span: "" },
                { icon: Smartphone, t: "Phone, tablet and desktop", d: "Built to be used on any screen.", span: "md:col-span-2" },
              ].map(({ icon: Icon, t, d, span }) => (
                <div key={t} className={`rounded-3xl bg-white p-7 ${span}`}>
                  <Icon size={24} className="text-blue-600" aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold">{t}</h3>
                  <p className="mt-2 text-slate-600">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-3">
              <ShieldCheck size={28} className="text-blue-600" aria-hidden />
              <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">What we protect, and what we don&apos;t.</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 p-7">
                <h3 className="flex items-center gap-2 text-lg font-semibold"><KeyRound size={20} className="text-blue-600" aria-hidden />Encrypted in your browser</h3>
                <p className="mt-2 text-slate-600">Your .env files. We cannot read them, and we cannot recover a lost master password.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 p-7">
                <h3 className="text-lg font-semibold">Stored normally</h3>
                <p className="mt-2 text-slate-600">Project names, platforms, login emails, notes and to-dos, so the app can search and show them.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 p-7">
                <h3 className="text-lg font-semibold">Never stored</h3>
                <p className="mt-2 text-slate-600">Hosting account passwords, plain-text .env contents and your master password.</p>
              </div>
            </div>
            <p className="mt-6 text-slate-600">
              Read the full details in the{" "}
              <Link href="/privacy" className="font-medium text-blue-700 underline underline-offset-2">Privacy Policy</Link> and{" "}
              <Link href="/terms" className="font-medium text-blue-700 underline underline-offset-2">Terms</Link>.
            </p>
          </div>
        </section>

        <PricingSection signedIn={signedIn} />

        {/* Founder note */}
        <section className="bg-slate-50 px-5 py-20 sm:px-8">
          <figure className="mx-auto max-w-2xl">
            <blockquote className="text-xl leading-9 text-slate-800">
              I built TheCore because I kept losing track of my own projects: which host they were on, which of
              my many emails I had used, and what I still had to fix.
            </blockquote>
            <figcaption className="mt-4 text-slate-600">{OWNER_NAME}, founder</figcaption>
          </figure>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">Questions, answered.</h2>
            <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
              {faqs.map(([q, a]) => (
                <details key={q} className="group py-5">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown size={20} className="shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="mt-3 max-w-2xl text-slate-600">
                    {a}
                    {q === "Can I get a refund?" && (
                      <>
                        {" "}
                        <Link href="/refund-policy" className="font-medium text-blue-700 underline underline-offset-2">Read the refund policy</Link>.
                      </>
                    )}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final call to action */}
        <section className="px-5 pb-24 sm:px-8">
          <div className="mx-auto max-w-6xl rounded-3xl bg-slate-900 px-6 py-16 text-center text-white sm:px-12">
            <h2 className="mx-auto max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Stop searching old emails. Start tracking projects.
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={primary} className={`${btn} bg-white text-slate-900 hover:bg-slate-100`}>
                {primaryLabel}
              </Link>
              <a href="#pricing" className={`${btn} border border-white/30 text-white hover:bg-white/10`}>
                See pricing
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <Brand compact />
            <p className="mt-3 max-w-xs text-sm text-slate-600">Know where every project lives.</p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm text-slate-600">
            <Link href="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-900">Terms of Service</Link>
            <Link href="/refund-policy" className="hover:text-slate-900">Refund Policy</Link>
            <Link href="/contact" className="hover:text-slate-900">Contact</Link>
            <Link href="/cookies" className="hover:text-slate-900">Cookies</Link>
            <Link href="/pricing" className="hover:text-slate-900">Pricing</Link>
          </nav>
        </div>
        <p className="mx-auto mt-10 max-w-6xl text-sm text-slate-500">
          © {new Date().getFullYear()} TheCore. Built by {OWNER_NAME}.
        </p>
      </footer>

      {!signedIn && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
          <Link href="/signup" className={`${btn} w-full bg-blue-600 text-white hover:bg-blue-700`}>
            Start free
          </Link>
        </div>
      )}
    </>
  );
}