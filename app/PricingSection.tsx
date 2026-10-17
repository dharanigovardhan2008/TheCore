"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS, yearlySavingPct } from "@/lib/plans-display";

const freeFeatures = [
  `Up to ${PLANS.free.projects} projects`,
  `${PLANS.free.envFilesPerProject} encrypted .env file per project`,
  "Platforms and login emails",
  "To-dos, search and export",
];

const proFeatures = [
  "Unlimited projects",
  "Unlimited encrypted .env files",
  "Everything in Free",
  "Priority email support",
];

const rows: [string, string, string][] = [
  ["Projects", `${PLANS.free.projects}`, "Unlimited"],
  [".env files per project", `${PLANS.free.envFilesPerProject}`, "Unlimited"],
  ["Platforms and login emails", "Included", "Included"],
  ["Export your data", "Included", "Included"],
  ["Support", "Standard", "Priority email"],
];

export default function PricingSection({ signedIn }: { signedIn: boolean }) {
  const [cycle, setCycle] = useState<"year" | "month">("year");
  const yearly = cycle === "year";
  const price = yearly ? PLANS.pro.yearlyInr : PLANS.pro.monthlyInr;
  const proHref = signedIn ? "/pricing" : `/signup?plan=pro&cycle=${cycle}`;
  const freeHref = signedIn ? "/dashboard" : "/signup";

  return (
    <section id="pricing" className="scroll-mt-20 bg-white px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          Start free. Pay only when you outgrow it.
        </h2>
        <p className="mt-4 max-w-xl text-lg text-slate-600">
          Pro is a prepaid pass. There is no auto-renewal and no surprise charge.
        </p>

        <div
          role="group"
          aria-label="Billing period"
          className="mt-8 inline-flex rounded-full bg-slate-100 p-1"
        >
          {(["year", "month"] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cycle === c}
              onClick={() => setCycle(c)}
              className={`min-h-11 rounded-full px-5 text-sm font-semibold transition ${
                cycle === c ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {c === "year" ? `12 months, save ${yearlySavingPct}%` : "1 month"}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="flex flex-col rounded-3xl border border-slate-200 bg-slate-50 p-8">
            <h3 className="text-xl font-semibold text-slate-900">{PLANS.free.name}</h3>
            <p className="mt-1 text-slate-600">For a few side projects.</p>
            <p className="mt-6 text-5xl font-semibold tracking-tight text-slate-900">₹0</p>
            <p className="text-sm text-slate-600">free forever</p>
            <ul className="mt-6 flex-1 space-y-3 text-slate-700">
              {freeFeatures.map((f) => (
                <li key={f} className="flex gap-3">
                  <Check size={18} className="mt-1 shrink-0 text-blue-600" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={freeHref}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 font-semibold text-slate-900 transition hover:bg-slate-100 active:scale-[0.98]"
            >
              {signedIn ? "Open dashboard" : "Start free"}
            </Link>
          </div>

          <div className="relative flex flex-col rounded-3xl border-2 border-blue-600 bg-white p-8 shadow-lg shadow-blue-600/10">
            <span className="absolute -top-3 left-8 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
              Most popular
            </span>
            <h3 className="text-xl font-semibold text-slate-900">{PLANS.pro.name}</h3>
            <p className="mt-1 text-slate-600">For everything you have built.</p>
            <p className="mt-6 text-5xl font-semibold tracking-tight text-slate-900">
              ₹{price}
            </p>
            <p className="text-sm text-slate-600">
              {yearly
                ? `for 12 months (about ₹${Math.round(price / 12)} a month)`
                : "for 1 month"}
            </p>
            <ul className="mt-6 flex-1 space-y-3 text-slate-700">
              {proFeatures.map((f) => (
                <li key={f} className="flex gap-3">
                  <Check size={18} className="mt-1 shrink-0 text-blue-600" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={proHref}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-6 font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]"
            >
              {signedIn ? "Upgrade to Pro" : "Get Pro"}
            </Link>
          </div>
        </div>

        <p className="mt-5 text-sm text-slate-600">
          Payments are processed securely by Cashfree. Prices are in INR, taxes as applicable. Read the{" "}
          <Link href="/refund-policy" className="font-medium text-blue-700 underline underline-offset-2">
            refund policy
          </Link>
          .
        </p>

        <div className="mt-12 overflow-x-auto rounded-3xl border border-slate-200">
          <table className="w-full min-w-[420px] text-left text-sm">
            <caption className="sr-only">Free and Pro compared</caption>
            <thead className="bg-slate-50 text-slate-900">
              <tr>
                <th scope="col" className="px-5 py-4 font-semibold">What you get</th>
                <th scope="col" className="px-5 py-4 font-semibold">Free</th>
                <th scope="col" className="px-5 py-4 font-semibold text-blue-700">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rows.map(([label, free, pro]) => (
                <tr key={label}>
                  <th scope="row" className="px-5 py-4 font-medium text-slate-900">{label}</th>
                  <td className="px-5 py-4">{free}</td>
                  <td className="px-5 py-4 font-medium text-slate-900">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}