/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}));

describe('middleware (LP-FIX-007)', () => {
  it('allows /api/social-card/* without blocking with 410 Gone (AC-01)', async () => {
    const req = new NextRequest(new URL('https://example.com/api/social-card/reloj-vintage-12345678-1234-4234-8234-1234567890ab'));
    const res = await middleware(req);

    // AC-01: Must not be intercepted with 410
    expect(res.status).not.toBe(410);
  });

  it('allows /api/market/*, /api/stripe/* and GET /api/products', async () => {
    const marketReq = new NextRequest(new URL('https://example.com/api/market/catalog'));
    const marketRes = await middleware(marketReq);
    expect(marketRes.status).not.toBe(410);

    const stripeReq = new NextRequest(new URL('https://example.com/api/stripe/webhook'));
    const stripeRes = await middleware(stripeReq);
    expect(stripeRes.status).not.toBe(410);

    const productsGetReq = new NextRequest(new URL('https://example.com/api/products'), { method: 'GET' });
    const productsGetRes = await middleware(productsGetReq);
    expect(productsGetRes.status).not.toBe(410);
  });

  it('blocks legacy mutation endpoints with 410 Gone (AC-02)', async () => {
    const legacyUrls = [
      'https://example.com/api/auctions',
      'https://example.com/api/orders',
      'https://example.com/api/messages',
      'https://example.com/api/bids',
    ];

    for (const url of legacyUrls) {
      const req = new NextRequest(new URL(url));
      const res = await middleware(req);
      expect(res.status).toBe(410);

      const body = await res.json();
      expect(body).toEqual({
        error: 'Esta operación pertenece a la versión anterior. Actualiza la página.',
      });
    }

    // POST to /api/products is also blocked
    const postProductsReq = new NextRequest(new URL('https://example.com/api/products'), { method: 'POST' });
    const postProductsRes = await middleware(postProductsReq);
    expect(postProductsRes.status).toBe(410);
  });

  it('allows non-API page routes', async () => {
    const pageReq = new NextRequest(new URL('https://example.com/articulos/reloj-vintage-123'));
    const pageRes = await middleware(pageReq);
    expect(pageRes.status).not.toBe(410);
  });
});
