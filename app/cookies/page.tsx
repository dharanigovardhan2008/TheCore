
import type { Metadata } from "next";
import Link from "next/link";
import {
  Cookie,
  ShieldCheck,
  Settings2,
  Ban,
  Mail,
  CalendarDays,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  LockKeyhole,
  Palette,
  Info,
} from "lucide-react";

import {
  EFFECTIVE_DATE,
  LEGAL_VERSION,
  CONTACT_EMAIL,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Learn how TheCore uses essential authentication cookies and local storage to provide a secure, consistent developer workspace.",
  alternates: {
    canonical: "/cookies",
  },
  openGraph: {
    title: "Cookie Policy | TheCore",
    description: "Learn how TheCore uses essential authentication cookies and local storage to provide a secure, consistent developer workspace.",
  },
};

const sections = [
  {
    id: "what-are-cookies",
    title: "What Are Cookies?",
    icon: Cookie,
  },
  {
    id: "how-we-use-cookies",
    title: "How We Use Cookies",
    icon: Settings2,
  },
  {
    id: "no-tracking",
    title: "Tracking & Marketing",
    icon: Ban,
  },
  {
    id: "managing-preferences",
    title: "Managing Preferences",
    icon: Palette,
  },
  {
    id: "contact",
    title: "Contact",
    icon: Mail,
  },
];

const cardClass =
  "scroll-mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8";

function SectionHeading({
  number,
  title,
  icon: Icon,
}: {
  number: string;
  title: string;
  icon: React.ElementType;
}) {
  return (
    <div className="mb-5 flex items-start gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-600">
        {number}
      </span>

      <h2 className="flex-1 pt-1.5 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
        {title}
      </h2>

      <div className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 sm:flex">
        <Icon size={21} strokeWidth={1.7} />
      </div>
    </div>
  );
}

export default function CookiesPage() {
  return (
    <main
      className="relative isolate min-h-screen w-full bg-white text-slate-700"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* Keep this page independent of the application theme background. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-white"
      />

      <div className="relative mx-auto w-full max-w-7xl bg-white px-5 pb-16 pt-8 sm:px-8 sm:pt-12 lg:px-10">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-10 flex items-center gap-2 text-sm text-slate-500"
        >
          <Link href="/" className="transition hover:text-blue-600">
            Home
          </Link>
          <ChevronRight size={15} />
          <span className="font-medium text-slate-900">
            Cookie Policy
          </span>
        </nav>

        {/* Hero */}
        <header className="mb-12 grid items-center gap-8 lg:grid-cols-[1fr_250px]">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-semibold tracking-wide text-blue-700">
              <ShieldCheck size={15} />
              PRIVACY & PREFERENCES
            </div>

            <h1 className="text-5xl font-semibold leading-[1.06] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
              Your experience.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
                Your control.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              We keep browser storage simple. Learn how TheCore
              uses essential authentication cookies and local
              storage to help your workspace function as expected.
            </p>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CalendarDays size={17} className="text-blue-600" />
                <span>
                  Effective{" "}
                  <strong className="text-slate-950">
                    {EFFECTIVE_DATE}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Settings2 size={17} className="text-blue-600" />
                <span>
                  Version{" "}
                  <strong className="text-slate-950">
                    {LEGAL_VERSION}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Minimal decorative illustration */}
          <div className="relative mx-auto flex aspect-square w-full max-w-[230px] items-center justify-center">
            <div className="flex size-44 items-center justify-center rounded-[2.5rem] border border-slate-200 bg-white sm:size-48">
              <div className="flex size-28 items-center justify-center rounded-[2rem] bg-blue-600 text-white sm:size-32">
                <Cookie size={57} strokeWidth={1.4} />
              </div>

              <div className="absolute right-0 top-5 flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-blue-600">
                <CheckCircle2 size={22} />
              </div>

              <div className="absolute bottom-5 left-0 flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-blue-600">
                <LockKeyhole size={21} />
              </div>
            </div>
          </div>
        </header>

        {/* Privacy highlights */}
        <section
          aria-label="Cookie policy highlights"
          className="mb-10 grid gap-3 sm:grid-cols-3"
        >
          {[
            {
              icon: LockKeyhole,
              title: "Essential cookies",
              description: "Support authentication and sessions.",
            },
            {
              icon: Palette,
              title: "Saved preferences",
              description: "Remember your display theme locally.",
            },
            {
              icon: Ban,
              title: "No marketing cookies",
              description: "No advertising cookies are intended.",
            },
          ].map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Icon size={20} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {title}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* Sidebar and policy */}
        <div className="grid items-start gap-6 lg:grid-cols-[265px_minmax(0,1fr)] lg:gap-8">
          {/* Table of contents */}
          <aside className="lg:sticky lg:top-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between px-2">
                <h2 className="text-sm font-semibold text-slate-950">
                  On this page
                </h2>

                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                  05 SECTIONS
                </span>
              </div>

              <nav aria-label="Cookie policy sections">
                <ol className="space-y-1">
                  {sections.map((section, index) => {
                    const Icon = section.icon;

                    return (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition group-hover:bg-white group-hover:text-blue-600">
                            <Icon size={16} />
                          </span>

                          <span className="min-w-0 flex-1">
                            {section.title}
                          </span>

                          <span className="text-[10px] text-slate-400">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ol>
              </nav>

              <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4">
                <ShieldCheck
                  size={23}
                  className="mb-3 text-blue-600"
                />

                <p className="text-sm font-semibold text-slate-950">
                  Privacy matters.
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Understand how your personal information is handled.
                </p>

                <Link
                  href="/privacy"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Read Privacy Policy
                  <ArrowUpRight size={13} />
                </Link>
              </div>
            </div>
          </aside>

          {/* Content cards */}
          <div className="min-w-0 space-y-5 text-[15px] leading-7 text-slate-600">
            <section
              id="what-are-cookies"
              className={cardClass}
            >
              <SectionHeading
                number="01"
                title="What Are Cookies?"
                icon={Cookie}
              />

              <p>
                Cookies are small text files that websites may store
                in your browser when you visit them. They can help
                maintain sessions, remember preferences, and support
                essential website functionality.
              </p>

              <p className="mt-4">
                Local storage is a separate browser feature that lets
                websites save information on your device. Unlike
                cookies, local storage values are not automatically
                attached to every HTTP request.
              </p>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <Info
                    size={20}
                    className="mt-1 shrink-0 text-blue-600"
                  />
                  <div>
                    <p className="font-semibold text-slate-950">
                      Cookies and local storage are different.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      This policy covers both technologies where
                      they are used by TheCore.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section
              id="how-we-use-cookies"
              className={cardClass}
            >
              <SectionHeading
                number="02"
                title="How We Use Cookies"
                icon={Settings2}
              />

              <p className="mb-6">
                TheCore aims to use only the browser storage needed
                for authentication and your basic preferences.
                Based on the services described in this policy,
                these uses include:
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <LockKeyhole size={21} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-950">
                      Authentication & session management
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Supabase authentication may use cookies or
                      other session-storage mechanisms to maintain
                      your sign-in state and protect authenticated
                      access.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Palette size={21} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-950">
                      Theme preferences
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Browser local storage may remember your
                      selected appearance, such as light or dark
                      mode, so your preference persists between visits.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-500">
                The exact storage mechanisms depend on your current
                application configuration and authentication setup.
              </p>
            </section>

            <section
              id="no-tracking"
              className={cardClass}
            >
              <SectionHeading
                number="03"
                title="Tracking & Marketing"
                icon={Ban}
              />

              <div className="mb-5 flex items-start gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600">
                  <CheckCircle2 size={21} />
                </div>

                <div>
                  <p className="font-semibold text-slate-950">
                    No advertising cookies intended
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    TheCore does not intend to use cookies for
                    behavioral advertising or marketing tracking.
                  </p>
                </div>
              </div>

              <p>
                TheCore does not intentionally use advertising,
                marketing, or cross-site tracking cookies. If
                analytics or additional third-party integrations
                are introduced, this policy should be updated to
                describe their actual behavior and applicable
                consent requirements.
              </p>
            </section>

            <section
              id="managing-preferences"
              className={cardClass}
            >
              <SectionHeading
                number="04"
                title="Managing Preferences"
                icon={Palette}
              />

              <p>
                You can manage or clear cookies and local storage
                through your browser settings. Clearing authentication
                storage may sign you out, and clearing saved preferences
                may reset your theme.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  {
                    title: "Clear cookies",
                    description:
                      "Remove stored website cookies through your browser settings.",
                  },
                  {
                    title: "Clear site storage",
                    description:
                      "Remove local storage and other saved site data for TheCore.",
                  },
                  {
                    title: "Sign in again",
                    description:
                      "Reauthenticate if clearing storage ends your session.",
                  },
                ].map((item, index) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                      {index + 1}
                    </span>

                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-500">
                Blocking essential storage may prevent sign-in or
                other parts of the application from functioning correctly.
              </p>
            </section>

            <section id="contact" className={cardClass}>
              <SectionHeading
                number="05"
                title="Contact Us"
                icon={Mail}
              />

              <p>
                Have a question about cookies, browser storage, or
                this policy? Contact us using the email address below.
              </p>

              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="group mt-6 flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white p-5 transition hover:bg-blue-50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <Mail size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">
                      Cookie policy enquiries
                    </p>
                    <p className="break-all text-sm font-semibold text-slate-950">
                      {CONTACT_EMAIL}
                    </p>
                  </div>
                </div>

                <ArrowUpRight
                  size={20}
                  className="shrink-0 text-blue-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </a>
            </section>

            {/* Footer */}
            <footer className="flex flex-col gap-4 border-t border-slate-200 px-2 pt-7 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  TheCore
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Your projects. One organized workspace.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                <Link href="/" className="transition hover:text-blue-600">Home</Link>
                <Link href="/pricing" className="transition hover:text-blue-600">Pricing</Link>
                <Link href="/privacy" className="transition hover:text-blue-600">Privacy Policy</Link>
                <Link href="/terms" className="transition hover:text-blue-600">Terms of Service</Link>
                <Link href="/refund-policy" className="transition hover:text-blue-600">Refund Policy</Link>
                <Link href="/contact" className="transition hover:text-blue-600">Contact</Link>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
