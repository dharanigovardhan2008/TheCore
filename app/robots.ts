import { getSiteUrlForMetadata } from '@/lib/site-url';
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrlForMetadata();

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
