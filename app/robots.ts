import { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
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
