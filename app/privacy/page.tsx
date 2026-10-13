
import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  LockKeyhole,
  Database,
  FileText,
  Ban,
  Layers,
  Cookie,
  UserRoundCheck,
  Shield,
  Users,
  Mail,
  CalendarDays,
  ArrowUpRight,
  ChevronRight,
  Info,
  Fingerprint,
  FolderKanban,
  Monitor,
  CheckCircle2,
} from "lucide-react";

import {
  EFFECTIVE_DATE,
  LEGAL_VERSION,
  CONTACT_EMAIL,
} from "@/lib/legal";

export function generateMetadata(): Metadata {
  return {
    title: "Privacy Policy",
    description:
      "Learn how TheCore collects, uses, and protects your personal information.",
    alternates: {
      canonical: "/privacy",
    },
    openGraph: {
      title: "Privacy Policy | TheCore",
      description: "Learn how TheCore collects, uses, and protects your personal information.",
    },
  };
}

const sections = [
  { id: "introduction", title: "Introduction", icon: FileText },
  { id: "what-we-collect", title: "What We Collect", icon: Database },
  {
    id: "what-we-dont-collect",
    title: "What We Don't Collect",
    icon: Ban,
  },
  {
    id: "the-vault",
    title: "The Vault & Encryption",
    icon: LockKeyhole,
  },
  {
    id: "processors",
    title: "Third-Party Processors",
    icon: Layers,
  },
  {
    id: "use-of-data",
    title: "How We Use Your Data",
    icon: Fingerprint,
  },
  {
    id: "cookies",
    title: "Cookies & Local Storage",
    icon: Cookie,
  },
  { id: "your-rights", title: "Your Rights", icon: UserRoundCheck },
  { id: "security", title: "Security", icon: Shield },
  { id: "children", title: "Children's Privacy", icon: Users },
  { id: "contact", title: "Contact Us", icon: Mail },
];

const cardClass =
  "scroll-mt-8 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 transition-colors duration-200 hover:border-blue-200";

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

export default function PrivacyPage() {
  return (
    <main
      className="relative isolate min-h-screen w-full bg-white text-slate-700"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* Opaque page background: no app gradients or image layers */}
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
            Privacy Policy
          </span>
        </nav>

        {/* Hero */}
        <header className="mb-12 grid items-center gap-8 lg:grid-cols-[1fr_280px]">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-semibold tracking-wide text-blue-700">
              <ShieldCheck size={15} />
              PRIVACY AT THE CORE
            </div>

            <h1 className="text-5xl font-semibold leading-[1.06] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
              Your privacy.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
                Your control.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Your projects are personal. Your credentials are
              sensitive. At TheCore, we believe you should know
              exactly what information we handle and how we
              protect it.
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
                <Layers size={17} className="text-blue-600" />
                <span>
                  Version{" "}
                  <strong className="text-slate-950">
                    {LEGAL_VERSION}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Minimal privacy illustration */}
          <div className="relative mx-auto flex aspect-square w-full max-w-[250px] items-center justify-center">
            <div className="flex size-44 items-center justify-center rounded-[2.5rem] border border-blue-100 bg-white sm:size-48">
              <div className="flex size-28 items-center justify-center rounded-[2rem] bg-blue-600 text-white sm:size-32">
                <ShieldCheck size={68} strokeWidth={1.4} />
              </div>

              <div className="absolute right-1 top-6 flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-blue-600">
                <LockKeyhole size={22} />
              </div>

              <div className="absolute bottom-5 left-1 flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-blue-600">
                <Fingerprint size={22} />
              </div>
            </div>
          </div>
        </header>

        {/* Trust cards */}
        <div className="mb-10 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: LockKeyhole,
              title: "Client-side vault encryption",
              description: "For your encrypted environment files",
            },
            {
              icon: ShieldCheck,
              title: "No data sales",
              description: "We do not sell your personal data",
            },
            {
              icon: UserRoundCheck,
              title: "You stay in control",
              description: "Manage and delete your account data",
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
        </div>

        {/* Main content and navigation */}
        <div className="grid items-start gap-6 lg:grid-cols-[265px_minmax(0,1fr)] lg:gap-8">
          <aside className="lg:sticky lg:top-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between px-2">
                <h2 className="text-sm font-semibold text-slate-950">
                  On this page
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                  11 SECTIONS
                </span>
              </div>

              <nav aria-label="Privacy policy sections">
                <ol className="space-y-1">
                  {sections.map((section, index) => {
                    const Icon = section.icon;

                    return (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-[13px] font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-blue-600">
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
                  Have a question about your information? We're
                  here to help.
                </p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Contact support
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-5 text-[15px] leading-7 text-slate-600">
            {/* 01 Introduction */}
            <section id="introduction" className={cardClass}>
              <SectionHeading number="01" title="Introduction" icon={FileText} />
              <p>
                Welcome to TheCore. We respect your privacy and
                are committed to protecting your personal data.
                This Privacy Policy explains how we collect, use,
                and safeguard your information when you use our
                service.
              </p>
            </section>

            {/* 02 Data collection */}
            <section id="what-we-collect" className={cardClass}>
              <SectionHeading number="02" title="What We Collect" icon={Database} />
              <p className="mb-5">
                We collect the following information when you use
                TheCore:
              </p>

              <ul className="space-y-4">
                {[
                  {
                    icon: UserRoundCheck,
                    title: "Profile Information",
                    text: "Your email address and name provided by Google during sign-in.",
                  },
                  {
                    icon: FolderKanban,
                    title: "Project Data",
                    text: "Project names, descriptions, tech stacks, repository URLs, and live URLs.",
                  },
                  {
                    icon: Monitor,
                    title: "Platform Data",
                    text: "Platform names and login emails associated with your projects.",
                  },
                  {
                    icon: FileText,
                    title: "Notes and To-dos",
                    text: "General notes and tasks you create within the app.",
                  },
                  {
                    icon: LockKeyhole,
                    title: "Encrypted Vault Data",
                    text: "Encrypted blobs of your environment variables and .env files.",
                  },
                  {
                    icon: Layers,
                    title: "Preferences",
                    text: "Theme preferences stored in your browser.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Profession & Workplace",
                    text: "Your optional profession/role (e.g. Developer, Student) and workplace or organisation name, collected during account setup. Used solely to personalise your experience and displayed in your account settings. Never shared with third parties.",
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Icon size={17} />
                    </span>
                    <p>
                      <strong className="text-slate-950">{title}:</strong>{" "}
                      {text}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* 03 Data not collected */}
            <section id="what-we-dont-collect" className={cardClass}>
              <SectionHeading number="03" title="What We Don't Collect" icon={Ban} />
              <p className="mb-5">
                Under the intended vault design, TheCore does not
                receive the following sensitive information:
              </p>
              <ul className="space-y-3">
                {[
                  "Hosting platform passwords or cloud provider credentials.",
                  "Plaintext environment variable values.",
                  "Your Vault Master Password.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Ban size={18} className="mt-1 shrink-0 text-rose-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 04 Encryption */}
            <section id="the-vault" className={cardClass}>
              <SectionHeading number="04" title="The Vault & Encryption" icon={LockKeyhole} />
              <p>
                Your environment variables are encrypted in your
                browser using a key derived from your Master Password
                before the encrypted data is sent to our servers.
                TheCore uses the Web Crypto API with AES-GCM encryption.
              </p>

              <div className="my-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <Info size={21} className="mt-1 shrink-0 text-blue-600" />
                  <div>
                    <p className="font-semibold text-slate-950">
                      Important to know
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      If encryption keys are derived locally and
                      never sent to our servers, we cannot read
                      your encrypted environment variables or
                      recover your Master Password if you lose it.
                    </p>
                  </div>
                </div>
              </div>

              <p>
                Other information, including project names, login
                emails, notes, and to-dos, is not client-side
                encrypted and may be accessible to authorized
                database operators.
              </p>
            </section>

            {/* 05 Third-party services */}
            <section id="processors" className={cardClass}>
              <SectionHeading number="05" title="Third-Party Processors" icon={Layers} />
              <p className="mb-5">
                We use third-party providers to operate TheCore.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    name: "Supabase",
                    role: "Database and authentication",
                    letter: "S",
                    color: "bg-emerald-50 text-emerald-600",
                  },
                  {
                    name: "Vercel",
                    role: "Application hosting",
                    letter: "V",
                    color: "bg-slate-100 text-slate-900",
                  },
                  {
                    name: "Google",
                    role: "Sign-in authentication",
                    letter: "G",
                    color: "bg-blue-50 text-blue-600",
                  },
                ].map((provider) => (
                  <div
                    key={provider.name}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200"
                  >
                    <div className={`mb-4 flex size-10 items-center justify-center rounded-xl text-lg font-bold ${provider.color}`}>
                      {provider.letter}
                    </div>
                    <p className="font-semibold text-slate-950">{provider.name}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {provider.role}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* 06 Data use */}
            <section id="use-of-data" className={cardClass}>
              <SectionHeading number="06" title="How We Use Your Data" icon={Fingerprint} />
              <p>
                We use your data to provide, maintain, secure, and
                improve TheCore. We do not sell your personal data,
                run advertisements, or profile users for advertising.
              </p>
            </section>

            {/* 07 Cookies */}
            <section id="cookies" className={cardClass}>
              <SectionHeading number="07" title="Cookies & Local Storage" icon={Cookie} />
              <p>
                We use essential session and authentication cookies
                where required to keep you signed in. Your browser's
                local storage may be used to remember your theme
                preference.
              </p>
              <p className="mt-4">
                We do not intentionally use non-essential tracking
                or marketing cookies. Additional storage used by
                integrations should be documented where applicable.
              </p>
            </section>

            {/* 08 User rights */}
            <section id="your-rights" className={cardClass}>
              <SectionHeading number="08" title="Your Rights" icon={UserRoundCheck} />
              <p className="mb-5">
                Depending on your location and applicable law,
                including India's Digital Personal Data Protection
                framework and the GDPR where applicable, you may
                have rights concerning your personal data.
              </p>
              <ul className="space-y-4">
                {[
                  {
                    title: "Access and export.",
                    text: "Access your data and request an available data export.",
                  },
                  {
                    title: "Correction.",
                    text: "Update inaccurate project and profile information.",
                  },
                  {
                    title: "Deletion.",
                    text: "Request deletion of associated personal data, subject to applicable legal retention requirements.",
                  },
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="mt-1 shrink-0 text-blue-500" />
                    <p>
                      <strong className="text-slate-950">{item.title}</strong>{" "}
                      {item.text}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            {/* 09 Security */}
            <section id="security" className={cardClass}>
              <SectionHeading number="09" title="Security" icon={Shield} />
              <p>
                We use security measures intended to protect your
                information, including encryption in transit,
                database Row Level Security (RLS), and client-side
                encryption for vault data. Effectiveness depends on
                correct configuration and ongoing maintenance.
              </p>
              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <Info size={19} className="mt-1 shrink-0 text-amber-600" />
                <p className="text-sm leading-6 text-slate-600">
                  No system can guarantee absolute security. Use
                  a strong, unique Master Password and keep your
                  account credentials secure.
                </p>
              </div>
            </section>

            {/* 10 Children's privacy */}
            <section id="children" className={cardClass}>
              <SectionHeading number="10" title="Children's Privacy" icon={Users} />
              <p>
                TheCore is not intended for individuals under the
                age of 16. We do not knowingly collect personal
                information from children under 16. If you believe
                a child has provided personal information to us,
                contact us so we can review the situation.
              </p>
            </section>

            {/* 11 Contact */}
            <section id="contact" className={cardClass}>
              <SectionHeading number="11" title="Contact Us" icon={Mail} />
              <p>
                Questions, privacy concerns, or requests regarding
                your personal information? Get in touch with us.
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
                    <p className="text-xs text-slate-500">Privacy enquiries</p>
                    <p className="break-all text-sm font-semibold text-slate-950">
                      {CONTACT_EMAIL}
                    </p>
                  </div>
                </div>
                <ArrowUpRight size={20} className="shrink-0 text-blue-600" />
              </a>
            </section>

            {/* Footer */}
            <footer className="flex flex-col gap-4 border-t border-slate-200 px-2 pt-7 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">TheCore</p>
                <p className="mt-1 text-xs text-slate-500">
                  Your projects. One organized workspace.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                <Link href="/" className="hover:text-blue-600">Home</Link>
                <Link href="/pricing" className="hover:text-blue-600">Pricing</Link>
                <Link href="/terms" className="hover:text-blue-600">Terms of Service</Link>
                <Link href="/refund-policy" className="hover:text-blue-600">Refund Policy</Link>
                <Link href="/contact" className="hover:text-blue-600">Contact</Link>
                <Link href="/cookies" className="hover:text-blue-600">Cookies</Link>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
