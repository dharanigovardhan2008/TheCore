import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail, MapPin, Clock, MessageSquare, ShieldCheck } from 'lucide-react';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us | TheCore',
  description: 'Get in touch with TheCore team for support, questions, or billing assistance.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-content)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-content-secondary)] hover:text-[var(--text-content)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Contact Us</h1>
          <p className="text-[var(--text-content-secondary)] text-base max-w-2xl">
            Have questions about TheCore, need help with your encrypted vault, or need billing support? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Details Card */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-[var(--bg-surface)] p-6 rounded-2xl border border-[var(--separator)] shadow-sm space-y-6">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Email Us</h3>
                  <p className="text-xs text-[var(--text-content-secondary)] mt-0.5">Direct support & billing</p>
                  <a
                    href="mailto:contact@thecore.indevs.in"
                    className="text-sm font-medium text-blue-500 hover:underline block mt-1 break-all"
                  >
                    contact@thecore.indevs.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Location</h3>
                  <p className="text-xs text-[var(--text-content-secondary)] mt-0.5">Operating entity</p>
                  <p className="text-sm text-[var(--text-content-secondary)] mt-1">
                    TheCore Developer Services<br />
                    Bengaluru, Karnataka, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Response Time</h3>
                  <p className="text-xs text-[var(--text-content-secondary)] mt-0.5">Monday – Friday</p>
                  <p className="text-sm text-[var(--text-content-secondary)] mt-1">
                    Typically within 24 hours
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)] flex items-center gap-3 text-xs text-[var(--text-content-secondary)]">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Payments secured by Cashfree Payments with 256-bit encryption.</span>
            </div>
          </div>

          {/* Contact Message Form */}
          <div className="md:col-span-2">
            <div className="bg-[var(--bg-surface)] p-6 sm:p-8 rounded-2xl border border-[var(--separator)] shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-[var(--text-tint)]" />
                <h2 className="text-lg font-semibold">Send a Message</h2>
              </div>

              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

