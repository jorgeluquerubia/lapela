import robots from '../robots';
import sitemap from '../sitemap';
import {generateMetadata as generateCategoryMetadata} from '../categoria/[categorySlug]/page';
import {generateMetadata as generateArticuloMetadata} from '../articulos/[slug]/page';
import LegacyAdDetailRedirect from '../ad-detail/[slug]/page';
import {redirect} from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

jest.mock('@/components/ProductDetailInteractive', () => () => null);

jest.mock('@/models/marketplace', () => {
  return {
    admin: () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              limit: async () => ({data: []}),
            }),
            maybeSingle: async () => null,
          }),
        }),
      }),
    }),
    getListingByIdOrSlug: jest.fn().mockImplementation(async (slug: string) => {
      if (slug.includes('mock-product')) {
        return {
          id: '12345678-1234-4234-8234-123456789abc',
          title: 'Producto Mock de Prueba',
          description: 'Descripción para pruebas unitarias de SEO',
          price_cents: 5000,
          location: 'Madrid',
          category: 'Tecnología',
          mode: 'sale',
          images: ['https://example.com/mock.jpg'],
          status: 'available',
        };
      }
      return null;
    }),
  };
});

describe('SEO Features', () => {
  describe('robots.ts', () => {
    it('provides rules allowing public pages and disallowing private pages', () => {
      const config = robots();
      expect(config.sitemap).toContain('/sitemap.xml');
      const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
      expect(rules.allow).toContain('/categoria/');
      expect(rules.allow).toContain('/articulos/');
      expect(rules.allow).toContain('/subastas');
      expect(rules.disallow).toContain('/orders/');
      expect(rules.disallow).toContain('/chat/');
      expect(rules.disallow).toContain('/my-products');
      expect(rules.disallow).toContain('/edit-ad/');
      expect(rules.disallow).toContain('/api/');
    });
  });

  describe('sitemap.ts', () => {
    it('includes home, como-funciona, subastas, and all categories', async () => {
      const items = await sitemap();
      const urls = items.map((i) => i.url);
      expect(urls.some((u) => u.endsWith('/como-funciona'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/subastas'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/categoria/tecnologia'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/categoria/hogar'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/categoria/moda'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/categoria/deporte'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/categoria/coleccionismo'))).toBe(true);
      expect(urls.some((u) => u.endsWith('/categoria/otros'))).toBe(true);
    });
  });

  describe('Category metadata', () => {
    it('generates rich metadata and canonical URL for valid categories', async () => {
      const meta = await generateCategoryMetadata({
        params: Promise.resolve({categorySlug: 'tecnologia'}),
      });
      expect(meta.title).toBe('Tecnología de segunda mano');
      expect(meta.alternates?.canonical).toBe('/categoria/tecnologia');
      expect(meta.openGraph?.title).toContain('Tecnología de segunda mano');
    });

    it('returns noindex for unknown categories', async () => {
      const meta = await generateCategoryMetadata({
        params: Promise.resolve({categorySlug: 'desconocida'}),
      });
      expect(meta.title).toBe('Categoría no encontrada');
      expect(meta.robots).toEqual({index: false, follow: false});
    });
  });

  describe('Product article metadata', () => {
    it('generates rich metadata and canonical URL for demo products', async () => {
      const meta = await generateArticuloMetadata({
        params: Promise.resolve({slug: 'demo-1'}),
      });
      expect(meta.title).toContain('Auriculares inalámbricos negros');
      expect(meta.alternates?.canonical).toContain('/articulos/ejemplo-auriculares-inalambricos-negros-demo-1');
      expect(meta.openGraph?.images).toBeDefined();
    });

    it('returns not found metadata for unknown products', async () => {
      const meta = await generateArticuloMetadata({
        params: Promise.resolve({slug: 'inexistente-12345678-1234-4234-8234-123456789abc'}),
      });
      expect(meta.title).toBe('Artículo no encontrado');
      expect(meta.robots).toEqual({index: false, follow: false});
    });
  });

  describe('Legacy ad-detail redirect', () => {
    it('redirects demo product to canonical /articulos/ url', async () => {
      await LegacyAdDetailRedirect({
        params: Promise.resolve({slug: 'demo-1'}),
      });
      expect(redirect).toHaveBeenCalledWith('/articulos/ejemplo-auriculares-inalambricos-negros-demo-1');
    });
  });
});
