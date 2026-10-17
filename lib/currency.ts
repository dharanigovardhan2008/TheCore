export type Currency = 'INR' | 'USD'
export const currencyFromCountry = (c?: string | null): Currency => (c?.toUpperCase() === 'US' ? 'USD' : 'INR')
export function formatMoney(n: number, cur: Currency) {
  const sym = cur === 'USD' ? '$' : '₹'
  return `${sym}${Number.isInteger(n) ? n : n.toFixed(2)}`
}