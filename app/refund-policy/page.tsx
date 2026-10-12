import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | TheCore',
  description: 'Understand TheCore refund and cancellation terms for Pro subscriptions.',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-content)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-content-secondary)] hover:text-[var(--text-content)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Legal Review Banner */}
        <div className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">
            <strong>Template generated for review.</strong> Have a qualified legal professional review this policy for your jurisdiction before launch.
          </p>
        </div>

        <article className="prose prose-neutral dark:prose-invert max-w-none bg-[var(--bg-surface)] p-8 sm:p-12 rounded-2xl border border-[var(--separator)] shadow-sm">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Refund & Cancellation Policy</h1>
          <p className="text-sm text-[var(--text-content-secondary)] mb-8">
            Effective Date: October 20, 2026 | Version 1.0
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">1. Overview</h2>
            <p className="text-sm leading-relaxed text-[var(--text-content-secondary)] mb-4">
              At TheCore, we provide subscription-based digital software services that grant immediate access to unlimited projects, unlimited environment file tracking, and encrypted vaults. Because digital access is granted instantly upon successful payment, we maintain clear guidelines on refunds and cancellations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">2. Cancellation Policy</h2>
            <p className="text-sm leading-relaxed text-[var(--text-content-secondary)] mb-4">
              You may choose not to renew your subscription at any time. When you cancel or choose not to extend your subscription:
            </p>
            <ul className="list-disc pl-5 text-sm text-[var(--text-content-secondary)] space-y-2 mb-4">
              <li>Your Pro access remains active until the end of your current paid billing period (month or year).</li>
              <li>At the end of your billing cycle, your account automatically transitions to the Free plan.</li>
              <li>Existing projects and encrypted .env files remain completely accessible and readable. Creating new items above the Free limits (3 projects, 1 .env file per project) will be restricted until you upgrade again.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">3. Refund Eligibility & Windows</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)]">
                <h3 className="text-base font-semibold mb-1">Annual Subscriptions (12 Months)</h3>
                <p className="text-sm text-[var(--text-content-secondary)]">
                  We offer a <strong>7-day refund window</strong> from the date of initial purchase for 12-month plans. If you are not satisfied with TheCore Pro within 7 days of payment, you may contact support for a full refund minus any payment gateway processing charges.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)]">
                <h3 className="text-base font-semibold mb-1">Monthly Subscriptions (1 Month)</h3>
                <p className="text-sm text-[var(--text-content-secondary)]">
                  Because monthly subscriptions provide short-term, instant full access to our unlimited tiers at nominal cost (₹99), monthly payments are generally non-refundable once the billing period has begun. In cases of accidental duplicate charges or technical billing errors, exceptions are promptly granted.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">4. How to Request a Refund</h2>
            <p className="text-sm leading-relaxed text-[var(--text-content-secondary)] mb-4">
              To request a refund or report a billing dispute:
            </p>
            <ol className="list-decimal pl-5 text-sm text-[var(--text-content-secondary)] space-y-2 mb-4">
              <li>Send an email to <a href="mailto:billing@thecore.indevs.in" className="text-blue-500 hover:underline">billing@thecore.indevs.in</a> or submit an inquiry through our <Link href="/contact" className="text-blue-500 hover:underline">Contact page</Link>.</li>
              <li>Include your registered email address and the Cashfree Order ID or transaction reference number.</li>
              <li>State the reason for your refund request.</li>
            </ol>
            <p className="text-sm leading-relaxed text-[var(--text-content-secondary)]">
              Eligible refunds are reviewed within 2 business days and credited to the original payment source within 5 to 7 business days as per banking standards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Contact Information</h2>
            <p className="text-sm leading-relaxed text-[var(--text-content-secondary)]">
              For questions regarding this policy, please reach us at{' '}
              <a href="mailto:support@thecore.indevs.in" className="text-blue-500 hover:underline">support@thecore.indevs.in</a> or visit our{' '}
              <Link href="/contact" className="text-blue-500 hover:underline">Contact page</Link>.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}

