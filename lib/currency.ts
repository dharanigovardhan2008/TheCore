export type Currency = 'INR' | 'USD'
export type PayProvider = 'cashfree' | 'dodo'

/** India pays INR via Cashfree. Every other known country pays USD via Dodo Payments. Unknown (e.g. localhost) shows INR. */
export const currencyFromCountry = (c?: string | null): Currency => {
  const code = c?.trim().toUpperCase()
  if (!code) return 'INR'
  return code === 'IN' ? 'INR' : 'USD'
}

export const providerForCurrency = (cur: Currency): PayProvider => (cur === 'INR' ? 'cashfree' : 'dodo')

/**
 * Manual switch rules (enforced on the SERVER, never trusted from the client):
 *  - Anyone may choose USD / Dodo Payments.
 *  - INR / Cashfree is only allowed for India, or when the country is unknown (local testing).
 */
export function isProviderAllowed(country: string | null | undefined, provider: PayProvider): boolean {
  if (provider === 'dodo') return true
  const code = country?.trim().toUpperCase()
  return !code || code === 'IN'
}

export function formatMoney(n: number, cur: Currency) {
  const sym = cur === 'USD' ? '$' : '₹'
  return `${sym}${Number.isInteger(n) ? n : n.toFixed(2)}`
}

/** Format an order amount stored in minor units (paise for INR, cents for USD). */
export function formatMinor(amountMinor: number, currency?: string | null) {
  const cur: Currency = (currency || 'INR').toUpperCase() === 'USD' ? 'USD' : 'INR'
  return `${cur === 'USD' ? '$' : '₹'}${(amountMinor / 100).toFixed(2)}`
}
