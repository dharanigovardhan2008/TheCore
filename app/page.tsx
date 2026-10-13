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
  FolderKanban,
  Globe,
  LayoutDashboard,
  Layers,
  LockKeyhole,
  MousePointer2,
  Palette,
  Search,
  Shield,
  Smartphone,
  Zap,
  CheckSquare,
  LogOut,
} from "lucide-react";

const features = [
  {
    icon: Layers,
    number: "01",
    title: "Everything, connected.",
    description:
      "Bring your projects, resources, and digital essentials into one thoughtfully organized space.",
  },
  {
    icon: Zap,
    number: "02",
    title: "A faster workflow.",
    description:
      "Reduce the clutter, find what you need, and give your attention back to the work that matters.",
  },
  {
    icon: Shield,
    number: "03",
    title: "Privacy with purpose.",
    description:
      "Find clear policies and useful information about your digital workspace.",
  },
  {
    icon: Search,
    number: "04",
    title: "Find your focus.",
    description:
      "Keep important resources accessible instead of losing them across countless tabs.",
  },
  {
    icon: Smartphone,
    number: "05",
    title: "Made for every screen.",
    description:
      "A responsive experience designed for desktops, laptops, tablets, and phones.",
  },
  {
    icon: Palette,
    number: "06",
    title: "Beautifully simple.",
    description:
      "A restrained interface, considered details, and room to think without unnecessary distractions.",
  },
];

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

function FeatureCard({
  icon: Icon,
  number,
  title,
  description,
}: {
  icon: ElementType;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="group rounded-[26px] border border-slate-200/80 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_60px_-35px_rgba(37,99,235,0.22)] sm:p-7">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
          <Icon size={21} strokeWidth={1.7} />
        </div>

        <span className="text-xs font-medium tabular-nums text-slate-300">
          {number}
        </span>
      </div>

      <h3 className="mt-7 text-lg font-semibold tracking-tight text-slate-950">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>

      <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-blue-700 opacity-0 transition-opacity group-hover:opacity-100">
        Made for clarity <ArrowRight size={14} />
      </div>
    </article>
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
      <header className="sticky top-4 sm:top-6 z-50 px-4 sm:px-6 w-full flex justify-center pointer-events-none">
        <nav className="pointer-events-auto flex h-14 max-w-5xl w-full items-center justify-between px-4 sm:px-6 rounded-full bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-200">
          <Brand />

          <div className="hidden items-center gap-7 md:flex text-[13px] font-medium text-slate-600">
            <a href="#features" className="nav-link transition-colors hover:text-blue-600">Features</a>
            <a href="#experience" className="nav-link transition-colors hover:text-blue-600">Experience</a>
            <Link href="/pricing" className="nav-link transition-colors hover:text-blue-600">Pricing</Link>
            <a href="#faq" className="nav-link transition-colors hover:text-blue-600">FAQs</a>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full bg-blue-600 px-3.5 sm:px-5 text-xs sm:text-[13px] font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Dashboard <ArrowUpRight size={15} />
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 px-3 sm:px-4 text-xs sm:text-[13px] font-semibold text-slate-700 hover:text-rose-600 shadow-2xs transition active:scale-95 cursor-pointer"
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
                  className="hidden text-[13px] font-medium text-slate-600 transition hover:text-blue-700 sm:inline-flex px-2 py-1"
                >
                  Log in
                </Link>

                <Link
                  href="/signup"
                  className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-full bg-blue-600 px-4 sm:px-5 text-xs sm:text-[13px] font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Get started free <ArrowUpRight size={15} />
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative isolate bg-white">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-[-170px] h-[480px] w-[850px] -translate-x-1/2 rounded-full bg-blue-50/90 blur-[100px]" />
          <div className="absolute right-[-120px] top-[280px] h-72 w-72 rounded-full bg-sky-50/70 blur-[90px]" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-20 pt-20 sm:px-8 sm:pb-24 sm:pt-24 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:px-10 lg:pb-28 lg:pt-28">
          <div className="relative z-10">
            <Eyebrow>The digital workspace, refined</Eyebrow>

            <h1 className="mt-7 max-w-2xl text-[3.35rem] font-semibold leading-[1.03] tracking-[-0.075em] text-slate-950 sm:text-7xl lg:text-[5.2rem]">
              Make space
              <br />
              for what
              <br />
              <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 bg-clip-text text-transparent">
                matters.
              </span>
            </h1>

            <p className="mt-7 max-w-lg text-base leading-8 text-slate-500 sm:text-lg sm:leading-9">
              Meet TheCore. A calmer way to bring your projects, resources,
              and digital essentials together — with less clutter and more
              clarity.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex h-[50px] items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-[0_8px_25px_-10px_rgba(37,99,235,0.65)] transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Enter TheCore <ArrowRight size={17} />
              </Link>

              <a
                href="#features"
                className="inline-flex h-[50px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Explore features
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={15} className="text-blue-600" />
                Thoughtful design
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={15} className="text-blue-600" />
                Free during Early Access
              </span>
            </div>
          </div>

          <WorkspacePreview />
        </div>
      </section>

      {/* Brand statement */}
      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 text-center sm:px-8 md:flex-row md:text-left lg:px-10">
          <p className="text-sm font-medium tracking-tight text-slate-500">
            A little less digital noise.{" "}
            <span className="text-slate-900">
              A lot more room to think.
            </span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-2">
              <Layers size={15} className="text-blue-600" /> Organized
            </span>
            <span className="flex items-center gap-2">
              <Zap size={15} className="text-blue-600" /> Focused
            </span>
            <span className="flex items-center gap-2">
              <Smartphone size={15} className="text-blue-600" /> Responsive
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="scroll-mt-24 bg-white px-5 py-24 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Designed around you</Eyebrow>

            <h2 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
              Simple on purpose.
              <br />
              <span className="text-slate-400">Powerful in practice.</span>
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base sm:leading-8">
              Every detail has a purpose. Explore a more considered approach
              to organizing your digital life.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.number} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Early Access Pricing */}
      <section
        id="pricing"
        className="scroll-mt-24 border-y border-slate-100 bg-slate-50/60 px-5 py-24 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>Early access is open</Eyebrow>

            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-6xl">
              Start free.
              <br />
              <span className="text-blue-600">Find your flow.</span>
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-slate-500">
              Explore TheCore during Early Access. No payment required to get
              started.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-lg rounded-[30px] border border-blue-200 bg-white p-7 shadow-[0_25px_80px_-45px_rgba(37,99,235,0.35)] sm:p-9">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  TheCore Early Access
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Your starting point
                </p>
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                FREE
              </span>
            </div>

            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-6xl font-semibold tracking-[-0.07em] text-slate-950">
                ₹0
              </span>
              <span className="text-sm text-slate-500">
                during Early Access
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              No payment required to get started.
            </p>

            <div className="my-7 h-px bg-slate-100" />

            <ul className="space-y-4">
              {[
                "Access to currently available features",
                "A space for your digital essentials",
                "Use on supported devices",
                "Product updates during Early Access",
                "Published privacy and usage policies",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />
                  <span className="text-sm leading-6 text-slate-600">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              className="mt-8 flex h-12 items-center justify-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Get started for free <ArrowRight size={17} />
            </Link>

            <p className="mt-4 text-center text-xs leading-5 text-slate-400">
              Any future pricing changes will be communicated transparently.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section
        id="experience"
        className="scroll-mt-24 border-b border-slate-100 bg-white px-5 py-24 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl items-start gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div className="lg:sticky lg:top-32">
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
            {steps.map(({ number, title, description, icon: Icon }) => (
              <article
                key={number}
                className="group rounded-[26px] border border-slate-200/80 bg-white p-6 transition duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/[0.035] sm:p-8"
              >
                <div className="flex items-start gap-5 sm:gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
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
                    className="shrink-0 text-slate-300 transition group-hover:text-blue-600"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="bg-white px-5 py-24 sm:px-8 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-12 rounded-[32px] border border-slate-200/80 bg-white p-7 sm:p-10 lg:grid-cols-2 lg:gap-20 lg:p-14">
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
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              Read privacy policy <ArrowUpRight size={16} />
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