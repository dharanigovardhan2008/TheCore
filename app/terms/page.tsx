
import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  UserRoundCheck,
  Ban,
  LockKeyhole,
  Layers,
  CreditCard,
  Trash2,
  Scale,
  RefreshCw,
  Gavel,
  Mail,
  CalendarDays,
  ArrowUpRight,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Handshake,
} from "lucide-react";

import {
  EFFECTIVE_DATE,
  LEGAL_VERSION,
  CONTACT_EMAIL,
} from "@/lib/legal";

export function generateMetadata(): Metadata {
  return {
    title: "Terms of Service",
    description:
      "Read the Terms of Service governing your use of TheCore, including account responsibilities, acceptable use, security, and liability.",
    alternates: {
      canonical: "/terms",
    },
    openGraph: {
      title: "Terms of Service | TheCore",
      description: "Read the Terms of Service governing your use of TheCore, including account responsibilities, acceptable use, security, and liability.",
    },
  };
}

const sections = [
  {
    id: "service-description",
    title: "Service Description",
    icon: FileText,
  },
  {
    id: "eligibility",
    title: "Eligibility & Accounts",
    icon: UserRoundCheck,
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    icon: Ban,
  },
  {
    id: "vault-disclaimer",
    title: "Vault & Master Password",
    icon: LockKeyhole,
  },
  {
    id: "third-party",
    title: "Third-Party Services",
    icon: Layers,
  },
  {
    id: "fees",
    title: "Fees & Paid Plans",
    icon: CreditCard,
  },
  {
    id: "termination",
    title: "Deletion & Termination",
    icon: Trash2,
  },
  {
    id: "disclaimer",
    title: "Warranty & Liability",
    icon: Scale,
  },
  {
    id: "changes",
    title: "Changes to Terms",
    icon: RefreshCw,
  },
  {
    id: "governing-law",
    title: "Governing Law",
    icon: Gavel,
  },
  {
    id: "contact",
    title: "Contact",
    icon: Mail,
  },
];

const cardClass =
  "scroll-mt-8 rounded-3xl border border-slate-200 bg-white p-6 transition-colors duration-200 hover:border-blue-200 sm:p-8";

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

export default function TermsPage() {
  return (
    <main
      className="relative isolate min-h-screen w-full bg-white text-slate-700"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* Independent white page background */}
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
            Terms of Service
          </span>
        </nav>

        {/* Hero */}
        <header className="mb-12 grid items-center gap-8 lg:grid-cols-[1fr_280px]">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-2 text-xs font-semibold tracking-wide text-blue-700">
              <Handshake size={15} />
              TERMS & CONDITIONS
            </div>

            <h1 className="text-5xl font-semibold leading-[1.06] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
              Clear terms.
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent">
                Better trust.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              These terms explain the rules, responsibilities,
              and conditions that apply when you use TheCore.
              Please read them carefully before using our service.
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
                <FileText size={17} className="text-blue-600" />
                <span>
                  Version{" "}
                  <strong className="text-slate-950">
                    {LEGAL_VERSION}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Hero illustration */}
          <div className="relative mx-auto flex aspect-square w-full max-w-[250px] items-center justify-center">
            <div className="flex size-44 items-center justify-center rounded-[2.5rem] border border-blue-100 bg-white sm:size-48">
              <div className="flex size-28 items-center justify-center rounded-[2rem] bg-blue-600 text-white sm:size-32">
                <FileText size={62} strokeWidth={1.4} />
              </div>

              <div className="absolute right-1 top-6 flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-blue-600">
                <CheckCircle2 size={22} />
              </div>

              <div className="absolute bottom-5 left-1 flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-blue-600">
                <Scale size={22} />
              </div>
            </div>
          </div>
        </header>

        {/* Key principles */}
        <div className="mb-10 grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Your projects, your responsibility",
              description: "Keep your account and project data secure.",
            },
            {
              icon: LockKeyhole,
              title: "Protect your vault",
              description: "Keep your Master Password confidential.",
            },
            {
              icon: UserRoundCheck,
              title: "Know your rights",
              description: "Understand account access and termination.",
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

        {/* Sidebar + terms */}
        <div className="grid items-start gap-6 lg:grid-cols-[265px_minmax(0,1fr)] lg:gap-8">
          {/* Table of contents */}
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

              <nav aria-label="Terms of Service sections">
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
                  Need clarification?
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Contact us if you have questions about these terms.
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

          {/* Legal content */}
          <div className="min-w-0 space-y-5 text-[15px] leading-7 text-slate-600">
            <section id="service-description" className={cardClass}>
              <SectionHeading
                number="01"
                title="Service Description"
                icon={FileText}
              />
              <p>
                TheCore is a project and environment variable
                management tool designed to help developers
                organize their work and securely store sensitive
                environment variables through client-side encryption.
              </p>
            </section>

            <section id="eligibility" className={cardClass}>
              <SectionHeading
                number="02"
                title="Eligibility & Account Responsibility"
                icon={UserRoundCheck}
              />
              <p>
                You must be at least 16 years old to use TheCore.
                You are responsible for maintaining the
                confidentiality of your account credentials and
                for activities that occur under your account.
                Please notify us if you suspect unauthorized access.
              </p>
            </section>

            <section id="acceptable-use" className={cardClass}>
              <SectionHeading
                number="03"
                title="Acceptable Use"
                icon={Ban}
              />
              <p className="mb-5">
                You agree not to use TheCore to:
              </p>

              <ul className="space-y-3">
                {[
                  "Engage in unlawful activities.",
                  "Abuse, harass, or interfere with the service or other users.",
                  "Conduct unauthorized automated scraping or data extraction.",
                  "Attempt to reverse engineer, decompile, or compromise the service's security, except where applicable law permits.",
                  "Store or distribute illegal, infringing, or malicious content.",
                  "Interfere with the availability, integrity, or operation of the service.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Ban
                      size={18}
                      className="mt-1 shrink-0 text-rose-500"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section id="vault-disclaimer" className={cardClass}>
              <SectionHeading
                number="04"
                title="Vault & Master Password"
                icon={LockKeyhole}
              />

              <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <LockKeyhole
                    size={21}
                    className="mt-1 shrink-0 text-blue-600"
                  />
                  <div>
                    <p className="font-semibold text-slate-950">
                      Your Master Password is critical
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      You are responsible for remembering your
                      Master Password and keeping it confidential.
                    </p>
                  </div>
                </div>
              </div>

              <p>
                TheCore's vault relies on client-side encryption.
                If your Master Password and encryption key are
                never transmitted to or stored on our servers,
                we cannot recover the password or decrypt your
                vault data if you lose access to the key.
              </p>

              <p className="mt-4">
                Keep secure backups of your original environment
                variables outside TheCore. We cannot guarantee
                recovery of lost, corrupted, or inaccessible vault
                data.
              </p>
            </section>

            <section id="third-party" className={cardClass}>
              <SectionHeading
                number="05"
                title="Third-Party Services"
                icon={Layers}
              />
              <p className="mb-5">
                TheCore relies on third-party services to operate.
                Their availability and performance may affect
                certain features.
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
                    <div
                      className={`mb-4 flex size-10 items-center justify-center rounded-xl text-lg font-bold ${provider.color}`}
                    >
                      {provider.letter}
                    </div>
                    <p className="font-semibold text-slate-950">
                      {provider.name}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {provider.role}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section id="fees" className={cardClass}>
              <SectionHeading
                number="06"
                title="Fees & Paid Plans"
                icon={CreditCard}
              />
              <p>
                TheCore is currently offered under a free plan
                during its early access phase. We may introduce
                paid plans or charges for specific features in
                the future. We will communicate pricing and
                applicable changes before introducing mandatory
                charges for existing features, subject to
                applicable law.
              </p>
            </section>

            <section id="termination" className={cardClass}>
              <SectionHeading
                number="07"
                title="Account Deletion & Termination"
                icon={Trash2}
              />
              <p>
                You may delete your account through the
                application's settings if the feature is
                available. Account deletion may permanently
                remove associated data, including vault data.
                Export anything you need before deletion.
              </p>

              <p className="mt-4">
                We may suspend or terminate access when reasonably
                necessary for violations of these terms, security
                risks, legal obligations, or harm to the service
                or other users. Where appropriate and legally
                permitted, we will provide notice.
              </p>
            </section>

            <section id="disclaimer" className={cardClass}>
              <SectionHeading
                number="08"
                title="Warranty Disclaimer & Limitation of Liability"
                icon={Scale}
              />

              <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={21}
                    className="mt-1 shrink-0 text-amber-600"
                  />
                  <div>
                    <p className="font-semibold text-slate-950">
                      Important limitation
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Keep independent backups of important
                      project information and environment variables.
                    </p>
                  </div>
                </div>
              </div>

              <p>
                To the extent permitted by applicable law, TheCore
                is provided on an "AS IS" and "AS AVAILABLE" basis,
                without warranties that cannot lawfully be excluded.
                We do not guarantee uninterrupted, error-free, or
                continuously available service.
              </p>

              <p className="mt-4">
                To the extent permitted by applicable law, TheCore
                and its creators will not be liable for indirect,
                incidental, special, consequential, or punitive
                damages arising from your use of the service,
                including loss of profits, data, or access to
                encrypted vault information.
              </p>

              <p className="mt-4">
                Nothing in these terms excludes or limits liability
                or rights that cannot be excluded or limited under
                applicable law.
              </p>
            </section>

            <section id="changes" className={cardClass}>
              <SectionHeading
                number="09"
                title="Changes to Terms"
                icon={RefreshCw}
              />
              <p>
                We may update these Terms of Service from time to
                time. Material changes will be communicated by
                posting updated terms on the site or by email
                where appropriate. The updated effective date will
                appear at the top of this page.
              </p>

              <p className="mt-4">
                Your continued use of TheCore after updated terms
                take effect will be subject to applicable law and
                any consent requirements that apply.
              </p>
            </section>

            <section id="governing-law" className={cardClass}>
              <SectionHeading
                number="10"
                title="Governing Law"
                icon={Gavel}
              />
              <p>
                These terms are subject to applicable law. The
                governing law and courts with jurisdiction over
                disputes involving TheCore should be specified
                based on the operator's location and applicable
                legal requirements.
              </p>
            </section>

            <section id="contact" className={cardClass}>
              <SectionHeading
                number="11"
                title="Contact"
                icon={Mail}
              />
              <p>
                If you have questions about these Terms of Service,
                contact us using the email address below.
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
                      Terms enquiries
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
                <Link href="/" className="transition hover:text-blue-600">
                  Home
                </Link>
                <Link
                  href="/privacy"
                  className="transition hover:text-blue-600"
                >
                  Privacy Policy
                </Link>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="transition hover:text-blue-600"
                >
                  Contact
                </a>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </main>
  );
}
