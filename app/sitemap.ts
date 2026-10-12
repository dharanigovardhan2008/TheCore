import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thecore.isroot.in';

  const routes = ['', '/login', '/signup', '/privacy', '/terms', '/cookies'];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'monthly' : 'yearly',
    priority: route === '' ? 1.0 : route === '/login' || route === '/signup' ? 0.9 : 0.8,
  }));
}
