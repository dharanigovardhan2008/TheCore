import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thecore.isroot.in';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/signup', '/privacy', '/terms', '/cookies'],
      disallow: [
        '/dashboard',
        '/dashboard/*',
        '/todos',
        '/todos/*',
        '/env',
        '/env/*',
        '/accounts',
        '/accounts/*',
        '/settings',
        '/settings/*',
        '/api',
        '/api/*',
        '/auth',
        '/auth/*',
        '/reset-password',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
