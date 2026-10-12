import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thecore.indevs.in';

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/login',
        '/signup',
        '/pricing',
        '/refund-policy',
        '/contact',
        '/privacy',
        '/terms',
        '/cookies',
      ],
      disallow: [
        '/admin',
        '/admin/*',
        '/dashboard',
        '/dashboard/*',
        '/billing',
        '/billing/*',
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
