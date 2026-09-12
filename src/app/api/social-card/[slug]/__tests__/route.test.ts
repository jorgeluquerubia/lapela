/**
 * @jest-environment node
 */
import { GET } from '../route';

const mockMaybeSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/models/marketplace', () => ({
  admin: () => ({
    from: mockFrom,
  }),
}));

describe('GET /api/social-card/[slug] (LP-FEAT-020)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      LAPELA_PAYMENTS_MODE: 'simulated',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
    };

    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns 404 when slug does not contain a valid UUID (AC-06)', async () => {
    const res = await GET(new Request('http://localhost/api/social-card/invalid-slug'), {
      params: Promise.resolve({ slug: 'articulo-sin-identificador' }),
    });

    expect(res.status).toBe(404);
  });

  it('returns 404 when listing does not exist in database (AC-06)', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const res = await GET(new Request('http://localhost/api/social-card/test'), {
      params: Promise.resolve({ slug: 'camara-11111111-1111-4111-8111-111111111111' }),
    });

    expect(res.status).toBe(404);
  });

  it('returns 404 when listing belongs to a different environment (AC-06)', async () => {
    // Current environment is sandbox (simulated = true)
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Cámara réflex',
        price_cents: 12000,
        mode: 'sale',
        images: [],
        environment: 'live', // mismatch
        status: 'available',
      },
      error: null,
    });

    const res = await GET(new Request('http://localhost/api/social-card/test'), {
      params: Promise.resolve({ slug: 'camara-11111111-1111-4111-8111-111111111111' }),
    });

    expect(res.status).toBe(404);
  });

  it('returns 404 when listing is withdrawn, sold, or reserved (AC-06)', async () => {
    for (const status of ['withdrawn', 'sold', 'reserved', 'cancelled']) {
      mockMaybeSingle.mockResolvedValue({
        data: {
          id: '11111111-1111-4111-8111-111111111111',
          title: 'Cámara réflex',
          price_cents: 12000,
          mode: 'sale',
          images: [],
          environment: 'sandbox',
          status,
        },
        error: null,
      });

      const res = await GET(new Request('http://localhost/api/social-card/test'), {
        params: Promise.resolve({ slug: 'camara-11111111-1111-4111-8111-111111111111' }),
      });

      expect(res.status).toBe(404);
    }
  });

  it('blocks SSRF by ignoring untrusted image origins and generates card with brand fallback (RNF-02)', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    mockMaybeSingle.mockResolvedValue({
      data: {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Cámara réflex',
        price_cents: 12000,
        mode: 'sale',
        images: ['http://169.254.169.254/latest/meta-data', 'https://attacker.site/image.png'],
        environment: 'sandbox',
        status: 'available',
      },
      error: null,
    });

    const res = await GET(new Request('http://localhost/api/social-card/test'), {
      params: Promise.resolve({ slug: 'camara-11111111-1111-4111-8111-111111111111' }),
    });

    // Untrusted URLs must NOT be fetched
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/png');

    fetchSpy.mockRestore();
  });

  it('generates 200 PNG response with cache headers for authorized active listings (AC-01, AC-07)', async () => {
    const validImageUrl =
      'https://test-project.supabase.co/storage/v1/object/public/product-images/v2/user123/camara.jpg';

    const fakeImageBuffer = Buffer.from('fake-image-bytes');
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: async () => fakeImageBuffer,
    } as any);

    mockMaybeSingle.mockResolvedValue({
      data: {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Cámara réflex vintage',
        price_cents: 7500,
        mode: 'auction',
        images: [validImageUrl],
        environment: 'sandbox',
        status: 'available',
      },
      error: null,
    });

    const res = await GET(new Request('http://localhost/api/social-card/test'), {
      params: Promise.resolve({ slug: 'camara-reflex-vintage-11111111-1111-4111-8111-111111111111' }),
    });

    expect(fetchSpy).toHaveBeenCalledWith(validImageUrl, expect.any(Object));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/png');
    expect(res.headers.get('cache-control')).toContain('public');

    fetchSpy.mockRestore();
  });
});
