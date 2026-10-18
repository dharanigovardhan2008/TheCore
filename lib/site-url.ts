/**
 * The ONLY source of this app's public URL: NEXT_PUBLIC_SITE_URL.
 * Never derived from request headers and never hardcoded (host headers can be spoofed
 * and would let an attacker choose where payment providers send the customer).
 */
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url) {
    throw new Error('NEXT_PUBLIC_SITE_URL is not set (e.g. https://thecore.opsyl.in or http://localhost:3000).');
  }
  return url.replace(/\/+$/, '');
}

/** Non-throwing variant for metadata (robots, sitemap, Open Graph) so a missing value cannot break a build. */
export function getSiteUrlForMetadata(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'http://localhost:3000').replace(/\/+$/, '');
}
