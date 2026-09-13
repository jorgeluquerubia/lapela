/**
 * @jest-environment node
 */
import { GET } from '../route';

const mockMaybeSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockFrom = jest.fn();
const samplePngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAABLAAAAJ6CAYAAABz5iI2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAIcSURBVHic7cEBDQAAAMKg909tDwcUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPwZp8AAAWJ4o2AAAAAASUVORK5CYII=';
const samplePngBuffer = Buffer.from(samplePngBase64, 'base64');

function validateNoUnsupportedSvgNodes(node: any, inSvg = false) {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const child of node) {
      validateNoUnsupportedSvgNodes(child, inSvg);
    }
    return;
  }
  if (typeof node !== 'object') return;

  if (typeof node.type === 'function') {
    const rendered = node.type(node.props || {});
    validateNoUnsupportedSvgNodes(rendered, inSvg);
    return;
  }

  const isSvg = inSvg || node.type === 'svg';
  if (isSvg && node.type === 'text') {
    throw new Error('<text> nodes are not currently supported, please convert them to <path>');
  }

  if (node.props?.children) {
    validateNoUnsupportedSvgNodes(node.props.children, isSvg);
  }
}

jest.mock('next/og', () => {
  class MockImageResponse extends Response {
    constructor(element: any, options: any = {}) {
      const readable = new ReadableStream({
        start(controller) {
          try {
            validateNoUnsupportedSvgNodes(element);
            controller.enqueue(new Uint8Array(samplePngBuffer));
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });
      const headers = new Headers(options.headers || {});
      if (!headers.has('content-type')) headers.set('content-type', 'image/png');
      super(readable, { status: options.status || 200, headers });
    }
  }

  return {
    ImageResponse: MockImageResponse,
  };
});

jest.mock('@/models/marketplace', () => ({
  admin: () => ({
    from: mockFrom,
  }),
}));

describe('GET /api/social-card/[slug] (LP-FEAT-020 & LP-FIX-007)', () => {
  const originalEnv = process.env;
  const sample1x1Png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      APP_URL: 'https://lapela-nine.vercel.app',
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

  const assertValidPngResponse = async (res: Response) => {
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/png');
    expect(res.headers.get('cache-control')).toContain('public');

    // Force Satori / ImageResponse rendering by consuming the full body buffer
    const arrayBuffer = await res.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(0);

    // Verify PNG signature (magic bytes: 0x89 0x50 0x4e 0x47)
    const magicBytes = Array.from(new Uint8Array(arrayBuffer.slice(0, 4)));
    expect(magicBytes).toEqual([0x89, 0x50, 0x4e, 0x47]);
  };

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

  it('renders card with valid image and consumes PNG arrayBuffer completely', async () => {
    const validImageUrl =
      'https://test-project.supabase.co/storage/v1/object/public/product-images/v2/user123/camara.png';

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: async () => sample1x1Png,
    } as any);

    mockMaybeSingle.mockResolvedValue({
      data: {
        id: '11111111-1111-4111-8111-111111111111',
        title: 'Cámara réflex vintage',
        price_cents: 7500,
        mode: 'sale',
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
    await assertValidPngResponse(res);

    fetchSpy.mockRestore();
  });

  it('renders card when image is missing using brand fallback (empty images array)', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: '22222222-2222-4222-8222-222222222222',
        title: 'Mesa de comedor rústica',
        price_cents: 25000,
        mode: 'sale',
        images: [],
        environment: 'sandbox',
        status: 'available',
      },
      error: null,
    });

    const res = await GET(new Request('http://localhost/api/social-card/test'), {
      params: Promise.resolve({ slug: 'mesa-de-comedor-22222222-2222-4222-8222-222222222222' }),
    });

    await assertValidPngResponse(res);
  });

  it('blocks SSRF by ignoring untrusted image origins and renders brand fallback (RNF-02)', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    mockMaybeSingle.mockResolvedValue({
      data: {
        id: '33333333-3333-4333-8333-333333333333',
        title: 'Servidor vintage',
        price_cents: 12000,
        mode: 'sale',
        images: ['http://169.254.169.254/latest/meta-data', 'https://attacker.site/image.png'],
        environment: 'sandbox',
        status: 'available',
      },
      error: null,
    });

    const res = await GET(new Request('http://localhost/api/social-card/test'), {
      params: Promise.resolve({ slug: 'servidor-vintage-33333333-3333-4333-8333-333333333333' }),
    });

    // Untrusted URLs must NOT be fetched
    expect(fetchSpy).not.toHaveBeenCalled();
    await assertValidPngResponse(res);

    fetchSpy.mockRestore();
  });

  it('renders card properly with a long title exceeding 70 characters', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: '44444444-4444-4444-8444-444444444444',
        title:
          'Bicicleta de montaña clásica vintage con amortiguación doble, cambios Shimano de alta gama y cuadro de aluminio pulido original',
        price_cents: 45000,
        mode: 'sale',
        images: [],
        environment: 'sandbox',
        status: 'available',
      },
      error: null,
    });

    const res = await GET(new Request('http://localhost/api/social-card/test'), {
      params: Promise.resolve({
        slug: 'bicicleta-de-montana-clasica-vintage-44444444-4444-4444-8444-444444444444',
      }),
    });

    await assertValidPngResponse(res);
  });

  it('renders card in direct sale mode ("Precio cerrado" badge)', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: '55555555-5555-4555-8555-555555555555',
        title: 'Teclado mecánico custom',
        price_cents: 8000,
        mode: 'sale',
        images: [],
        environment: 'sandbox',
        status: 'available',
      },
      error: null,
    });

    const res = await GET(new Request('http://localhost/api/social-card/test'), {
      params: Promise.resolve({ slug: 'teclado-mecanico-custom-55555555-5555-4555-8555-555555555555' }),
    });

    await assertValidPngResponse(res);
  });

  it('renders card in auction mode ("Subasta" badge)', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: '66666666-6666-4666-8666-666666666666',
        title: 'Moneda conmemorativa rara',
        price_cents: 15000,
        mode: 'auction',
        images: [],
        environment: 'sandbox',
        status: 'available',
      },
      error: null,
    });

    const res = await GET(new Request('http://localhost/api/social-card/test'), {
      params: Promise.resolve({ slug: 'moneda-conmemorativa-rara-66666666-6666-4666-8666-666666666666' }),
    });

    await assertValidPngResponse(res);
  });

  it('uses configured canonical APP_URL in card output without errors', async () => {
    process.env.APP_URL = 'https://lapela.es';

    mockMaybeSingle.mockResolvedValue({
      data: {
        id: '77777777-7777-4777-8777-777777777777',
        title: 'Libro de colección',
        price_cents: 3000,
        mode: 'sale',
        images: [],
        environment: 'sandbox',
        status: 'available',
      },
      error: null,
    });

    const res = await GET(new Request('http://localhost/api/social-card/test'), {
      params: Promise.resolve({ slug: 'libro-de-coleccion-77777777-7777-4777-8777-777777777777' }),
    });

    await assertValidPngResponse(res);
  });

  it('detects and rejects any <text> nodes inside <svg> to prevent Satori runtime crashes', () => {
    const invalidTree = {
      type: 'div',
      props: {
        children: {
          type: 'svg',
          props: {
            children: [{ type: 'text', props: { children: 'lp' } }],
          },
        },
      },
    };
    expect(() => validateNoUnsupportedSvgNodes(invalidTree)).toThrow(
      '<text> nodes are not currently supported, please convert them to <path>'
    );
  });
});
