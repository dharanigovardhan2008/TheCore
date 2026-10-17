// Display copy for the home page and pricing section.
// IMPORTANT: these numbers must match lib/plans.ts (the real billing config).
// If lib/plans.ts exports the same values, import from there instead and delete this file.
export const PLANS = {
  free: { name: "Free", projects: 3, envFilesPerProject: 1 },
  pro: { name: "Pro", monthlyInr: 99, yearlyInr: 999 },
} as const;

// Computed, never typed by hand: how much cheaper the 12-month pass is.
export const yearlySavingPct = Math.round(
  (1 - PLANS.pro.yearlyInr / (PLANS.pro.monthlyInr * 12)) * 100,
);