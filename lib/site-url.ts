// lib/site-url.ts
// Exports the site URL from NEXT_PUBLIC_SITE_URL only.
// Throws an error if the environment variable is missing.

export const siteUrl: string = (() => {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    throw new Error('NEXT_PUBLIC_SITE_URL is not set. Please define it in your environment variables.');
  }
  return url;
})();