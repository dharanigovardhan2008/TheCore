import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thecore.indevs.in';

  const routes = [
    '',
    '/login',
    '/signup',
    '/pricing',
    '/refund-policy',
    '/contact',
    '/privacy',
    '/terms',
    '/cookies',
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/pricing' ? 'weekly' : 'monthly',
    priority: route === '' ? 1.0 : route === '/pricing' ? 0.9 : route === '/login' || route === '/signup' ? 0.8 : 0.7,
  }));
}
