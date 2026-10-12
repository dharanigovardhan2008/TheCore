export type PlanId = 'free' | 'pro';
export type BillingCycle = 'month' | 'year';

export interface PlanLimits {
  maxProjects: number;
  maxEnvFilesPerProject: number;
}

export interface PlanPricingCycle {
  amountInRupees: number;
  amountInPaise: number;
  label: string;
  periodLabel: string;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  badge: string;
  description: string;
  limits: PlanLimits;
  pricing?: {
    month: PlanPricingCycle;
    year: PlanPricingCycle;
  };
  features: string[];
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    badge: 'Starter',
    description: 'Perfect for students and developers getting started with personal projects.',
    limits: {
      maxProjects: 3,
      maxEnvFilesPerProject: 1,
    },
    features: [
      'Up to 3 active projects',
      '1 encrypted .env file per project',
      'Client-side AES-256-GCM vault',
      'To-do task manager & platform tracker',
      'Full JSON data export & import',
      'Dark and light mode support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    badge: 'Unlimited',
    description: 'For freelancers, indie hackers, and professional builders managing multiple apps.',
    limits: {
      maxProjects: Infinity,
      maxEnvFilesPerProject: Infinity,
    },
    pricing: {
      month: {
        amountInRupees: 99,
        amountInPaise: 9900,
        label: '₹99 / month',
        periodLabel: 'per month',
      },
      year: {
        amountInRupees: 999,
        amountInPaise: 99900,
        label: '₹999 / year',
        periodLabel: 'per year (Save 16%)',
      },
    },
    features: [
      'Unlimited projects',
      'Unlimited encrypted .env files per project',
      'Priority platform and database sync',
      'All Free features included',
      'Direct developer support',
      'Early access to new features',
    ],
  },
};

/**
 * Check if a user currently has an active Pro subscription.
 */
export function isProActive(plan?: string | null, expiresAt?: string | null | Date): boolean {
  if (!plan || plan.toLowerCase() !== 'pro') return false;
  if (!expiresAt) return true; // Lifetime or permanent Pro if no expiry set
  const expiryDate = new Date(expiresAt);
  return expiryDate.getTime() > Date.now();
}

/**
 * Get the effective limits for a user based on their plan and expiry.
 */
export function getEffectiveLimits(plan?: string | null, expiresAt?: string | null | Date): PlanLimits {
  if (isProActive(plan, expiresAt)) {
    return PLANS.pro.limits;
  }
  return PLANS.free.limits;
}

/**
 * Get authoritative plan pricing amount in paise.
 * Guaranteed to come from server config, never client input.
 */
export function getPlanPriceInPaise(planId: PlanId, cycle: BillingCycle): number {
  if (planId !== 'pro') {
    throw new Error('Only the Pro plan is billable.');
  }
  const pricing = PLANS.pro.pricing?.[cycle];
  if (!pricing) {
    throw new Error(`Invalid billing cycle: ${cycle}`);
  }
  return pricing.amountInPaise;
}

/**
 * Calculate the new expiry date when extending or purchasing a plan.
 * Extends from the current expiry if in the future, or from now if expired.
 */
export function calculateNewExpiry(
  currentExpiresAt: string | null | Date | undefined,
  cycle: BillingCycle,
  referenceDate: Date = new Date()
): Date {
  let baseTime = referenceDate.getTime();
  if (currentExpiresAt) {
    const existingTime = new Date(currentExpiresAt).getTime();
    if (existingTime > baseTime) {
      baseTime = existingTime;
    }
  }

  const result = new Date(baseTime);
  if (cycle === 'year') {
    // Add 365 days
    result.setDate(result.getDate() + 365);
  } else {
    // Add 30 days
    result.setDate(result.getDate() + 30);
  }
  return result;
}

