import type {MetadataRoute} from 'next';
import {admin} from '@/models/marketplace';
import {demoProducts} from '@/lib/demo-products';
import {categories} from '@/lib/rules';
import {categoryToSlug, productSlug} from '@/lib/slugs';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL || 'https://lapela-nine.vercel.app';
  const env = process.env.LAPELA_PAYMENTS_MODE === 'simulated' ? 'sandbox' : 'live';

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/como-funciona`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/subastas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  for (const cat of categories) {
    const slug = categoryToSlug[cat];
    if (slug) {
      routes.push({
        url: `${baseUrl}/categoria/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }
  }

  try {
    const {data: listings} = await admin()
      .from('lp_listings')
      .select('id, title, created_at')
      .eq('status', 'available')
      .eq('environment', env)
      .limit(500);

    if (listings && listings.length > 0) {
      for (const l of listings) {
        routes.push({
          url: `${baseUrl}/articulos/${productSlug(l.id, l.title)}`,
          lastModified: new Date(l.created_at || Date.now()),
          changeFrequency: 'daily',
          priority: 0.7,
        });
      }
    } else {
      for (const p of demoProducts) {
        routes.push({
          url: `${baseUrl}/articulos/${p.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }
  } catch {
    for (const p of demoProducts) {
      routes.push({
        url: `${baseUrl}/articulos/${p.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  return routes;
}
