const mockCreateClient = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args: any[]) => mockCreateClient(...args),
}));

import { getPublicProfile } from '@/models/marketplace';

describe('LP-FEAT-013 - Aislamiento entre sandbox y producción en perfiles y valoraciones', () => {
  const originalEnv = process.env.LAPELA_PAYMENTS_MODE;
  let mockEq: jest.Mock;
  let mockSelect: jest.Mock;
  let mockFrom: jest.Mock;
  let mockRpc: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEq = jest.fn();

    const makeQueryBuilder = (result: any = { data: [], error: null, count: 0 }) => {
      const qb: any = {
        select: jest.fn(() => qb),
        eq: jest.fn((...args: any[]) => {
          mockEq(...args);
          return qb;
        }),
        order: jest.fn(() => qb),
        limit: jest.fn(() => Promise.resolve(result)),
        maybeSingle: jest.fn(() => Promise.resolve(result)),
        single: jest.fn(() => Promise.resolve(result)),
        in: jest.fn(() => qb),
      };
      // Allow awaiting the query builder directly (as in count queries)
      qb.then = (onfulfilled: any, onrejected: any) => Promise.resolve(result).then(onfulfilled, onrejected);
      return qb;
    };

    mockFrom = jest.fn((table: string) => {
      if (table === 'lp_profiles') {
        const qb: any = {
          select: jest.fn(() => qb),
          eq: jest.fn(() => ({
            maybeSingle: () => Promise.resolve({
              data: { id: 'seller-uuid-1', alias: 'vendedor_top', show_purchases: true, created_at: '2026-01-01' },
              error: null,
            }),
          })),
          in: jest.fn(() => Promise.resolve({ data: [] })),
        };
        return qb;
      }
      return makeQueryBuilder();
    });

    mockRpc = jest.fn();

    mockCreateClient.mockReturnValue({
      from: mockFrom,
      rpc: mockRpc,
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'buyer-uuid-1', email: 'buyer@example.com' } },
        }),
      },
    });
  });

  afterEach(() => {
    process.env.LAPELA_PAYMENTS_MODE = originalEnv;
  });

  it('filtra anuncios, ventas, reviews y compras con environment=sandbox en modo simulado', async () => {
    process.env.LAPELA_PAYMENTS_MODE = 'simulated';

    await getPublicProfile('vendedor_top');

    // Comprobar que en cada consulta se exigió el entorno 'sandbox'
    expect(mockEq).toHaveBeenCalledWith('environment', 'sandbox');
    expect(mockEq).toHaveBeenCalledWith('listing.environment', 'sandbox');
    expect(mockEq).toHaveBeenCalledWith('order.listing.environment', 'sandbox');
  });

  it('filtra anuncios, ventas, reviews y compras con environment=live en modo producción', async () => {
    process.env.LAPELA_PAYMENTS_MODE = 'live';

    await getPublicProfile('vendedor_top');

    // Comprobar que en cada consulta se exigió el entorno 'live'
    expect(mockEq).toHaveBeenCalledWith('environment', 'live');
    expect(mockEq).toHaveBeenCalledWith('listing.environment', 'live');
    expect(mockEq).toHaveBeenCalledWith('order.listing.environment', 'live');
  });

  it('devuelve estadísticas y listas vacías cuando no hay actividad en el entorno', async () => {
    process.env.LAPELA_PAYMENTS_MODE = 'simulated';

    const res = await getPublicProfile('vendedor_top');

    expect(res).not.toBeNull();
    expect(res?.profile.alias).toBe('vendedor_top');
    expect(res?.stats.completedSales).toBe(0);
    expect(res?.stats.reviewCount).toBe(0);
    expect(res?.activeListings).toEqual([]);
    expect(res?.purchases).toEqual([]);
    expect(res?.reviews).toEqual([]);
  });
});

