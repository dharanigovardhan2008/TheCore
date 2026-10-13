import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import Brand from "@/components/ui/Brand";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/dashboard/settings/actions";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thecore.indevs.in';

export const metadata: Metadata = {
  title: "TheCore: track your projects, hosting platforms and .env files",
  description: "TheCore is your personal vault for developer side projects. Securely track your hosting platforms, databases, and encrypt your .env files in one place.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TheCore: track your projects, hosting platforms and .env files",
    description: "TheCore is your personal vault for developer side projects. Securely track your hosting platforms, databases, and encrypt your .env files in one place.",
    url: siteUrl,
    siteName: "TheCore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TheCore: track your projects, hosting platforms and .env files",
    description: "TheCore is your personal vault for developer side projects. Securely track your hosting platforms, databases, and encrypt your .env files in one place.",
  },
  verification: {
    google: "google-site-verification-token",
    other: {
      "msvalidate.01": "bing-site-verification-token",
    },
  },
};
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  Command,
  Database,
  FileText,
  Fingerprint,
  Globe,
  Clock,
  LayoutDashboard,
  LockKeyhole,
  MousePointer2,
  Check,
  Plus,
  Shield,
  LogOut,
  FolderKanban,
  CheckSquare,
  Layers,
  Zap,
  Smartphone,
  Palette,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Start with a space.",
    description:
      "Create a home for the projects, resources, and tools you use every day.",
    icon: LayoutDashboard,
  },
  {
    number: "02",
    title: "Bring it together.",
    description:
      "Keep your digital essentials organized and easier to access.",
    icon: FolderKanban,
  },
  {
    number: "03",
    title: "Move forward.",
    description:
      "Spend less energy managing your space and more time making progress.",
    icon: MousePointer2,
  },
];

const faqs = [
  {
    question: "What is TheCore?",
    answer:
      "TheCore is a digital workspace designed to bring projects, resources, and useful tools together in a clean, organized experience.",
  },
  {
    question: "How do I get started?",
    answer:
      "Select Get started to open the sign-in page. The features available to you depend on your account and the current application implementation.",
  },
  {
    question: "Can I use TheCore on mobile?",
    answer:
      "This landing page is responsive and designed for desktop, tablet, and mobile screens.",
  },
  {
    question: "Is TheCore free?",
    answer:
      "TheCore is free during its Early Access period. Any future pricing changes should be communicated clearly before paid access begins.",
  },
  {
    question: "Where can I learn about privacy?",
    answer:
      "Visit the Privacy Policy, Terms of Service, and Cookie Policy linked in the footer.",
  },
];

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-2 text-xs font-medium tracking-wide text-blue-700 shadow-sm">
      <span className="h-2 w-2 rounded-full bg-blue-600" />
      {children}
    </div>
  );
}

/*
 * This is a decorative product preview.
 * The actual dashboard opens at /dashboard.
 */
function WorkspacePreview() {
  const navigationItems = [
    { icon: LayoutDashboard, label: "Overview" },
    { icon: FolderKanban, label: "Projects" },
    { icon: FileText, label: "Resources" },
    { icon: CheckSquare, label: "Tasks" },
  ];

  const quickLinks = [
    { icon: Database, label: "Digital resources" },
    { icon: CheckSquare, label: "Tasks and notes" },
    { icon: Globe, label: "Useful links" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[570px]">
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[60px] bg-blue-100/60 blur-[65px]" />

      <div className="relative rounded-[30px] border border-slate-200/90 bg-white p-2 shadow-[0_35px_100px_-45px_rgba(15,23,42,0.25)] sm:p-3">
        <div className="overflow-hidden rounded-[23px] border border-slate-100 bg-white">
          <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4 sm:px-5">
            <Brand compact />

            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-200" />
              <span className="h-2 w-2 rounded-full bg-slate-200" />
              <span className="h-2 w-2 rounded-full bg-slate-200" />
            </div>
          </div>

          <div className="grid min-h-[390px] grid-cols-[55px_1fr] sm:grid-cols-[145px_1fr]">
            <aside className="border-r border-slate-100 bg-slate-50/70 p-2 sm:p-3">
              <p className="mb-4 hidden px-2 pt-2 text-[9px] font-semibold tracking-[0.16em] text-slate-400 sm:block">
                WORKSPACE
              </p>

              {navigationItems.map(({ icon: Icon, label }, index) => (
                <div
                  key={label}
                  className={`mb-1 flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 sm:justify-start sm:px-2.5 ${
                    index === 0
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-500"
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden text-[11px] font-medium sm:inline">
                    {label}
                  </span>
                </div>
              ))}
            </aside>

            <div className="min-w-0 p-3.5 sm:p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-medium text-slate-400">
                    YOUR WORKSPACE
                  </p>

                  <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.04em] text-slate-950 sm:text-2xl">
                    A little more focus.
                  </h3>

                  <p className="mt-2 text-[10px] leading-5 text-slate-500 sm:text-xs">
                    Everything starts here.
                  </p>
                </div>

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-blue-700">
                  D
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-7 sm:gap-3">
                <div className="rounded-2xl border border-slate-200 p-3 sm:p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FolderKanban size={17} />
                  </div>

                  <p className="mt-3 text-[10px] text-slate-500 sm:text-xs">
                    Your projects
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">
                    All in one place
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-3 sm:p-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={17} />
                  </div>

                  <p className="mt-3 text-[10px] text-slate-500 sm:text-xs">
                    Your workflow
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">
                    Clear and simple
                  </p>
                </div>
              </div>

              <div className="mt-3.5 rounded-2xl border border-slate-200 p-3.5 sm:mt-4 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 sm:text-sm">
                    Quick access
                  </span>
                  <ArrowUpRight size={15} className="text-slate-400" />
                </div>

                <div className="mt-3 space-y-2">
                  {quickLinks.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2.5 rounded-xl bg-slate-50/90 p-2.5 sm:gap-3 sm:p-3"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-600">
                        <Icon size={14} />
                      </span>

                      <span className="text-[10px] font-medium text-slate-700 sm:text-xs">
                        {label}
                      </span>

                      <ArrowRight
                        size={13}
                        className="ml-auto text-slate-400"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-center text-[9px] text-slate-400">
                Product preview
              </p>

              <Link
                href="/dashboard"
                className="mt-3 flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Open actual dashboard <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-2 top-[20%] hidden items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl shadow-slate-900/[0.06] sm:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Palette size={18} />
        </span>

        <div>
          <p className="text-xs font-semibold text-slate-900">
            Thoughtfully designed
          </p>
          <p className="mt-1 text-[10px] text-slate-500">
            Less clutter, more clarity
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "name": "TheCore",
        "url": siteUrl,
        "description": "TheCore is your personal vault for developer side projects. Securely track your hosting platforms, databases, and encrypt your .env files in one place.",
        "applicationCategory": "DeveloperApplication",
        "operatingSystem": "All",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map((faq) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen w-full overflow-x-clip bg-white text-slate-950 antialiased">
      {/* Floating Pill Navigation */}
      <header className="sticky top-4 sm:top-6 z-50 px-4 sm:px-6 w-full flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-700">
        <nav className="pointer-events-auto flex h-14 max-w-5xl w-full items-center justify-between px-4 sm:px-6 rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)]">
          <Brand />

          <div className="hidden items-center gap-7 md:flex text-[13px] font-medium text-slate-600">
            <a href="#features" className="nav-link transition-all duration-200 hover:text-blue-600">Features</a>
            <a href="#experience" className="nav-link transition-all duration-200 hover:text-blue-600">Experience</a>
            <Link href="/pricing" className="nav-link transition-all duration-200 hover:text-blue-600">Pricing</Link>
            <a href="#faq" className="nav-link transition-all duration-200 hover:text-blue-600">FAQs</a>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="group inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full bg-blue-600 px-3.5 sm:px-5 text-xs sm:text-[13px] font-semibold text-white shadow-sm shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30"
                >
                  Dashboard <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 px-3 sm:px-4 text-xs sm:text-[13px] font-semibold text-slate-700 hover:text-rose-600 shadow-2xs transition-all duration-300 active:scale-95 cursor-pointer"
                  >
                    <LogOut size={14} className="text-rose-500" />
                    <span className="hidden sm:inline">Log out</span>
                  </button>
                </form>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden text-[13px] font-medium text-slate-600 transition-all duration-200 hover:text-blue-700 sm:inline-flex px-2 py-1"
                >
                  Log in
                </Link>

                <Link
                  href="/signup"
                  className="group inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full bg-blue-600 px-4 sm:px-5 text-xs sm:text-[13px] font-semibold text-white shadow-sm shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30"
                >
                  Get started free <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative isolate bg-white overflow-hidden">
        {/* Refined ambient background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-140px] h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-100/60 via-sky-50/40 to-transparent blur-[120px]" />
          <div className="absolute right-[-80px] top-[320px] h-80 w-80 rounded-full bg-gradient-to-l from-blue-50/50 to-transparent blur-[100px]" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 pt-20 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:px-10 lg:pb-32 lg:pt-28">
          <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Eyebrow>The digital workspace, refined</Eyebrow>
            </div>

            <h1 className="mt-8 max-w-2xl text-[3.5rem] font-semibold leading-[0.95] tracking-[-0.08em] text-slate-950 sm:text-7xl lg:text-[5.5rem] animate-in fade-in slide-in-from-bottom-6 duration-800 fill-mode-backwards" style={{ animationDelay: '150ms' }}>
              Make space
              <br />
              for what
              <br />
              <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 bg-clip-text text-transparent">
                matters.
              </span>
            </h1>

            <p className="mt-8 max-w-lg text-lg leading-[1.7] text-slate-600 sm:text-xl sm:leading-[1.7] animate-in fade-in slide-in-from-bottom-6 duration-800 fill-mode-backwards" style={{ animationDelay: '300ms' }}>
              Meet TheCore. A calmer way to bring your projects, resources,
              and digital essentials together — with less clutter and more
              clarity.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row animate-in fade-in slide-in-from-bottom-6 duration-800 fill-mode-backwards" style={{ animationDelay: '450ms' }}>
              <Link
                href="/dashboard"
                className="group inline-flex h-[52px] items-center justify-center gap-2.5 rounded-full bg-blue-600 px-7 text-[15px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(37,99,235,0.7)] transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-[0_16px_40px_-12px_rgba(37,99,235,0.8)] active:scale-[0.98]"
              >
                Enter TheCore <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#features"
                className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-full border-2 border-slate-200 bg-white px-7 text-[15px] font-semibold text-slate-700 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                Explore features
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-backwards" style={{ animationDelay: '600ms' }}>
              <span className="inline-flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-blue-600" strokeWidth={2.5} />
                <span className="font-medium">Thoughtful design</span>
              </span>
              <span className="inline-flex items-center gap-2.5">
                <CheckCircle2 size={16} className="text-blue-600" strokeWidth={2.5} />
                <span className="font-medium">Free during Early Access</span>
              </span>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-right-8 duration-1000 fill-mode-backwards" style={{ animationDelay: '200ms' }}>
            <WorkspacePreview />
          </div>
        </div>
      </section>

      {/* Brand statement */}
      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 py-12 text-center sm:px-8 md:flex-row md:text-left lg:px-10">
          <p className="text-base font-medium tracking-tight text-slate-600 sm:text-lg">
            A little less digital noise.{" "}
            <span className="text-slate-900 font-semibold">
              A lot more room to think.
            </span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500">
            <span className="flex items-center gap-2.5">
              <Layers size={16} className="text-blue-600" strokeWidth={2.5} />
              <span>Organized</span>
            </span>
            <span className="flex items-center gap-2.5">
              <Zap size={16} className="text-blue-600" strokeWidth={2.5} />
              <span>Focused</span>
            </span>
            <span className="flex items-center gap-2.5">
              <Smartphone size={16} className="text-blue-600" strokeWidth={2.5} />
              <span>Responsive</span>
            </span>
          </div>
        </div>
      </section>

      {/* Features - Premium Product Showcase */}
      <section
        id="features"
        className="scroll-mt-24 bg-white px-5 py-24 sm:px-8 sm:py-32 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          {/* Section Heading */}
          <div className="mx-auto max-w-3xl text-center mb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <h2 className="text-5xl sm:text-6xl lg:text-[4rem] font-semibold leading-[1.1] tracking-[-0.06em] text-slate-950 mb-6">
              Simple on purpose.
              <br />
              <span className="text-slate-400">Powerful in practice.</span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-8 text-slate-500">
              Every detail has a purpose. Keep your projects, platforms, tasks, and environment files organized in one considered workspace.
            </p>
          </div>

          {/* Feature Showcases - Editorial Layout */}
          <div className="space-y-20">

            {/* A. Everything Connected - Wide Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-in fade-in slide-in-from-bottom-8 duration-800 fill-mode-backwards">
              <div className="order-2 lg:order-1">
                <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950 mb-4">
                  Your projects, all in one place.
                </h3>
                <p className="text-lg leading-8 text-slate-500 mb-6">
                  Track every detail that matters. Repository links, deployment URLs, technology stack, and project status — organized in cards that actually help you work.
                </p>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-blue-600" />
                    <span>Project overview with live status tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-blue-600" />
                    <span>Repository and deployment links at your fingertips</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-blue-600" />
                    <span>Visual tech stack indicators</span>
                  </li>
                </ul>
              </div>

              <div className="order-1 lg:order-2">
                {/* Product Preview - Project Card */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 to-purple-100/40 rounded-[32px] blur-3xl" />
                  <div className="relative glass rounded-[28px] p-6 shadow-xl border border-slate-200/80 hover:shadow-2xl transition-all duration-500">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm flex items-center justify-center font-bold text-lg text-white">
                          TC
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-slate-950">TheCore Platform</h4>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Deployed
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                      Developer project vault with encrypted environment management and platform tracking.
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-6">
                      <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">Next.js</div>
                      <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">Supabase</div>
                      <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">Vercel</div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Globe size={14} />
                        thecore.indevs.in
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        Updated 2 days ago
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* B. Faster Workflow - Medium Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-in fade-in slide-in-from-bottom-8 duration-800 fill-mode-backwards" style={{ animationDelay: '100ms' }}>
              <div>
                {/* Product Preview - Task List */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/40 to-teal-100/40 rounded-[32px] blur-3xl" />
                  <div className="relative glass rounded-[28px] p-6 shadow-xl border border-slate-200/80 hover:shadow-2xl transition-all duration-500">
                    <h4 className="text-lg font-bold text-slate-950 mb-4">To-do list</h4>

                    <div className="space-y-3">
                      {[
                        { text: 'Update API documentation', done: true, priority: 'med' },
                        { text: 'Fix authentication flow', done: false, priority: 'high' },
                        { text: 'Deploy staging environment', done: false, priority: 'med' },
                      ].map((todo, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white/80 hover:bg-white border border-slate-200 rounded-2xl transition-all">
                          <div className={`w-[22px] h-[22px] rounded-lg border-2 flex items-center justify-center transition-all ${
                            todo.done
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-slate-300'
                          }`}>
                            {todo.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                          <span className={`text-sm flex-1 ${
                            todo.done ? 'text-slate-400 line-through' : 'text-slate-900 font-medium'
                          }`}>
                            {todo.text}
                          </span>
                          {todo.priority === 'high' && !todo.done && (
                            <span className="px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-[10px] font-bold text-red-700 uppercase">High</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <button className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 transition-colors flex items-center justify-center gap-2">
                        <Plus size={16} />
                        Add task
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950 mb-4">
                  Less searching. More building.
                </h3>
                <p className="text-lg leading-8 text-slate-500 mb-6">
                  Keep your workflow focused with task management built into every project. Track progress, set priorities, and stay organized without switching tools.
                </p>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-blue-600" />
                    <span>Project-specific task lists</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-blue-600" />
                    <span>Priority levels and due dates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-blue-600" />
                    <span>Quick add without context switching</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* C. Environment Organized - Wide Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center animate-in fade-in slide-in-from-bottom-8 duration-800 fill-mode-backwards" style={{ animationDelay: '200ms' }}>
              <div className="order-2 lg:order-1">
                <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950 mb-4">
                  Keep every environment in order.
                </h3>
                <p className="text-lg leading-8 text-slate-500 mb-6">
                  Zero-knowledge encrypted vault for your environment variables. Manage .env, .env.local, and .env.prod files with client-side AES-256-GCM encryption.
                </p>
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-blue-600" />
                    <span>AES-256-GCM client-side encryption</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-blue-600" />
                    <span>Multiple environment configurations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-blue-600" />
                    <span>Secure key derivation with PBKDF2</span>
                  </li>
                </ul>
              </div>

              <div className="order-1 lg:order-2">
                {/* Product Preview - Environment Vault */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/40 to-blue-100/40 rounded-[32px] blur-3xl" />
                  <div className="relative glass rounded-[28px] p-6 shadow-xl border border-slate-200/80 hover:shadow-2xl transition-all duration-500">
                    <div className="flex items-center justify-between mb-5">
                      <h4 className="text-lg font-bold text-slate-950">Environment Vault</h4>
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <LockKeyhole size={12} />
                        Encrypted
                      </span>
                    </div>

                    <div className="space-y-3 mb-4">
                      {[
                        { name: '.env', vars: 8, color: 'blue' },
                        { name: '.env.local', vars: 12, color: 'purple' },
                        { name: '.env.prod', vars: 15, color: 'emerald' },
                      ].map((env, i) => (
                        <div key={i} className="p-4 bg-white/80 border border-slate-200 rounded-2xl hover:border-slate-300 transition-all">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                env.color === 'blue' ? 'bg-blue-500' :
                                env.color === 'purple' ? 'bg-purple-500' :
                                'bg-emerald-500'
                              }`} />
                              <span className="font-mono text-sm font-semibold text-slate-900">{env.name}</span>
                            </div>
                            <span className="text-xs text-slate-500">{env.vars} variables</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Database size={12} />
                            <span>Last synced 5 min ago</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <Shield size={14} className="text-emerald-600" />
                      <span>Zero-knowledge architecture • Keys never leave your device</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* D. Platforms Without Clutter - Compact Showcase */}
            <div className="max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-8 duration-800 fill-mode-backwards" style={{ animationDelay: '300ms' }}>
              <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950 mb-4">
                Your tools. One workspace.
              </h3>
              <p className="text-lg leading-8 text-slate-500 mb-8 max-w-2xl mx-auto">
                Connect your platforms, databases, and hosting services. Keep account details, API endpoints, and deployment info organized per project.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
                {[
                  { name: 'Vercel', icon: '▲' },
                  { name: 'Supabase', icon: 'S' },
                  { name: 'GitHub', icon: 'GH' },
                  { name: 'Railway', icon: 'R' },
                ].map((platform, i) => (
                  <div key={i} className="glass rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300">
                    <div className="text-2xl font-bold text-slate-900 mb-2">{platform.icon}</div>
                    <div className="text-sm font-medium text-slate-600">{platform.name}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Overview */}
      <section
        id="pricing"
        className="scroll-mt-24 border-y border-slate-100 bg-slate-50/60 px-5 py-24 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
            <Eyebrow>Simple, transparent pricing</Eyebrow>

            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-6xl">
              Start free.
              <br />
              <span className="text-blue-600">Upgrade when ready.</span>
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-slate-500">
              Begin with the Free plan. Unlock unlimited projects with Pro starting at ₹99/month or ₹999/year.
            </p>
          </div>

          <div className="mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-800 fill-mode-backwards" style={{ animationDelay: '200ms' }}>

            {/* Free Plan Card */}
            <div className="rounded-[28px] border border-[#DCE9E3] bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="mb-5">
                <h3 className="text-xl font-bold text-[#172B2A] mb-2">Free</h3>
                <p className="text-xs text-[#647570] leading-relaxed">
                  Perfect for getting started
                </p>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#172B2A]">₹0</span>
                  <span className="text-sm text-[#647570]">/forever</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6 text-sm text-[#172B2A]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-600" />
                  <span>Up to 3 projects</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-600" />
                  <span>AES-256-GCM encryption</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-600" />
                  <span>Full data export</span>
                </li>
              </ul>
            </div>

            {/* Pro Annual Card - Featured */}
            <div className="rounded-[28px] bg-[#5B72E6] p-7 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 md:scale-[1.05] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold uppercase bg-white text-[#5B72E6] shadow-sm whitespace-nowrap">
                Best Value
              </div>

              <div className="mb-5 mt-2">
                <h3 className="text-xl font-bold text-white mb-2">Pro Annual</h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Save 16% with yearly billing
                </p>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">₹999</span>
                  <span className="text-sm text-white/70">/year</span>
                </div>
                <p className="text-xs text-white/60 mt-1">~₹83/month</p>
              </div>

              <ul className="space-y-2.5 mb-6 text-sm text-white">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-white" />
                  <span>Unlimited projects</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-white" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-white" />
                  <span>All Free features</span>
                </li>
              </ul>
            </div>

            {/* Pro Monthly Card */}
            <div className="rounded-[28px] border border-[#DCE9E3] bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="mb-5">
                <h3 className="text-xl font-bold text-[#172B2A] mb-2">Pro Monthly</h3>
                <p className="text-xs text-[#647570] leading-relaxed">
                  Flexible monthly billing
                </p>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#172B2A]">₹99</span>
                  <span className="text-sm text-[#647570]">/month</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6 text-sm text-[#172B2A]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-600" />
                  <span>Unlimited projects</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-600" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-600" />
                  <span>Cancel anytime</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="text-center mt-10">
            <Link
              href="/pricing"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View detailed pricing and features
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section
        id="experience"
        className="scroll-mt-24 border-b border-slate-100 bg-white px-5 py-24 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl items-start gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div className="lg:sticky lg:top-32 animate-in fade-in slide-in-from-left-6 duration-800">
            <Eyebrow>A more natural workflow</Eyebrow>

            <h2 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.06em] text-slate-950 sm:text-5xl">
              Your space.
              <br />
              Your rhythm.
            </h2>

            <p className="mt-5 max-w-md text-base leading-8 text-slate-500">
              Great tools should feel natural. TheCore is designed around a
              simple idea: the less time you spend managing your space, the
              more time you have to use it.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <Command size={21} className="text-blue-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Meet TheCore
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Your digital space, refined.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {steps.map(({ number, title, description, icon: Icon }, index) => (
              <article
                key={number}
                className="group rounded-[26px] border border-slate-200/80 bg-white p-6 transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/[0.035] hover:-translate-y-0.5 sm:p-8 animate-in fade-in slide-in-from-right-6 duration-700 fill-mode-backwards"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-start gap-5 sm:gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110">
                    <Icon size={21} strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-slate-400">
                      STEP {number}
                    </div>

                    <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                      {title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      {description}
                    </p>
                  </div>

                  <ArrowUpRight
                    size={18}
                    className="shrink-0 text-slate-300 transition-all duration-300 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="bg-white px-5 py-24 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-12 rounded-[32px] border border-slate-200/80 bg-white p-7 sm:p-10 lg:grid-cols-2 lg:gap-20 lg:p-14 transition-all duration-500 hover:shadow-xl hover:shadow-slate-950/5 animate-in fade-in slide-in-from-bottom-8 duration-800">
          <div>
            <Eyebrow>Clarity matters</Eyebrow>

            <h2 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.06em] text-slate-950 sm:text-5xl">
              Trust begins
              <br />
              with <span className="text-blue-600">transparency.</span>
            </h2>

            <p className="mt-5 max-w-lg text-base leading-8 text-slate-500">
              Find the policies behind your experience and understand the
              information published by your application.
            </p>

            <Link
              href="/privacy"
              className="group mt-8 inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:-translate-y-0.5"
            >
              Read privacy policy <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-[26px] bg-slate-50 p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-blue-100/80 blur-3xl" />

            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Fingerprint size={22} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    Information, made accessible
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Important details, clearly presented
                  </p>
                </div>
              </div>

              <div className="my-5 h-px bg-slate-100" />

              {[
                {
                  icon: LockKeyhole,
                  title: "Privacy policy",
                  description: "Data collection and handling",
                  href: "/privacy",
                },
                {
                  icon: FileText,
                  title: "Terms of service",
                  description: "Using the platform",
                  href: "/terms",
                },
                {
                  icon: Globe,
                  title: "Cookie policy",
                  description: "Cookies and preferences",
                  href: "/cookies",
                },
              ].map(({ icon: Icon, title, description, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-600">
                    <Icon size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {description}
                    </p>
                  </div>

                  <ArrowUpRight
                    size={16}
                    className="text-slate-400 transition group-hover:text-blue-600"
                  />
                </Link>
              ))}

              <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50/80 px-3.5 py-3 text-xs leading-5 text-blue-800">
                <CheckCircle2 size={16} className="shrink-0" />
                Clear information, whenever you need it.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section
        id="faq"
        className="scroll-mt-24 border-t border-slate-100 bg-slate-50/60 px-5 py-24 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <Eyebrow>A few useful answers</Eyebrow>

            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">
              Good to know.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              The essentials, without unnecessary complexity.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map(({ question, answer }) => (
              <details
                key={question}
                className="group rounded-2xl border border-slate-200/80 bg-white px-5 py-5 transition open:border-blue-200 sm:px-6"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden sm:text-base">
                  {question}
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>

                <p className="max-w-2xl pt-4 text-sm leading-7 text-slate-500">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-blue-600 px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 -top-32 h-80 w-80 rounded-full border border-white/10" />
            <div className="absolute -left-8 -top-20 h-56 w-56 rounded-full border border-white/10" />
            <div className="absolute -bottom-40 -right-16 h-96 w-96 rounded-full border border-white/10" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-blue-950/20" />
          </div>

          <div className="relative mx-auto max-w-3xl">
            <div className="mx-auto inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-2.5 shadow-lg">
              <Brand inverse size="md" href="" />
            </div>

            <h2 className="mt-7 text-4xl font-semibold leading-tight tracking-[-0.06em] text-white sm:text-6xl">
              Find your focus.
              <br />
              Start at TheCore.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-blue-100 sm:text-base sm:leading-8">
              A more thoughtful digital workspace starts with a single step.
            </p>

            <Link
              href="/dashboard"
              className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-50"
            >
              Enter TheCore <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-9 sm:flex-row sm:items-start">
            <div className="max-w-sm">
              <Brand compact />
              <p className="mt-4 max-w-xs text-sm leading-7 text-slate-500">
                A little more clarity for your digital life.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:gap-x-16">
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-slate-900">
                  EXPLORE
                </h3>
                <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500">
                  <a href="#features" className="nav-link">Features</a>
                  <a href="#experience" className="nav-link">Experience</a>
                  <Link href="/pricing" className="nav-link">Pricing & Plans</Link>
                  <Link href="/login" className="nav-link">Sign in</Link>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold tracking-wide text-slate-900">
                  INFORMATION
                </h3>
                <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500">
                  <Link href="/privacy" className="nav-link">Privacy Policy</Link>
                  <Link href="/terms" className="nav-link">Terms of Service</Link>
                  <Link href="/refund-policy" className="nav-link">Refund Policy</Link>
                  <Link href="/contact" className="nav-link">Contact Us</Link>
                  <Link href="/cookies" className="nav-link">Cookies</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} TheCore. All rights reserved.</p>
            <p>Designed with intention.</p>
          </div>
        </div>
      </footer>
    </main>
    </>
  );
}