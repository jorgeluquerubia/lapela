import type {MetadataRoute} from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || 'https://lapela-nine.vercel.app';
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/como-funciona', '/categoria/', '/articulos/', '/subastas'],
      disallow: [
        '/api/',
        '/my-products',
        '/user-profile',
        '/orders/',
        '/chat/',
        '/reset-password',
        '/publish-ad',
        '/edit-ad/',
        '/login',
        '/register',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
