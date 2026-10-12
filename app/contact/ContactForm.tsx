'use client';

import React, { useState } from 'react';

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
        <h3 className="text-base font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
          Thank you for reaching out!
        </h3>
        <p className="text-xs text-[var(--text-content-secondary)]">
          We have received your message and will respond to your email within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-content-secondary)] mb-1">
            Your Name
          </label>
          <input
            type="text"
            required
            placeholder="Jane Doe"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-content)] placeholder:text-[var(--text-content-tertiary)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-content-secondary)] mb-1">
            Your Email
          </label>
          <input
            type="email"
            required
            placeholder="jane@example.com"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-content)] placeholder:text-[var(--text-content-tertiary)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-content-secondary)] mb-1">
          Subject
        </label>
        <input
          type="text"
          required
          placeholder="Billing question, bug report, or feature request"
          className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-content)] placeholder:text-[var(--text-content-tertiary)]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-content-secondary)] mb-1">
          Message
        </label>
        <textarea
          rows={5}
          required
          placeholder="How can we help you?"
          className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[var(--bg-grouped)] border border-[var(--separator)] focus:outline-none focus:ring-2 focus:ring-blue-500 text-[var(--text-content)] placeholder:text-[var(--text-content-tertiary)]"
        ></textarea>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="px-6 py-2.5 text-sm font-medium rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
        >
          Send Message
        </button>
      </div>
    </form>
  );
}

