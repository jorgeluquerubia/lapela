/**
 * @jest-environment node
 */
import { GET, POST } from '../route';

const mockRpc = jest.fn();
const mockAdmin = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockLt = jest.fn();
const mockLimit = jest.fn();
const mockStripeRetrieve = jest.fn();
const mockStripeExpire = jest.fn();

jest.mock('@/models/marketplace', () => ({
  rpc: (...args: any[]) => mockRpc(...args),
  admin: () => mockAdmin(),
}));

jest.mock('@/lib/payments', () => ({
  stripe: () => ({
    checkout: {
      sessions: {
        retrieve: (...args: any[]) => mockStripeRetrieve(...args),
        expire: (...args: any[]) => mockStripeExpire(...args),
      },
    },
  }),
  origin: () => 'http://localhost',
}));

describe('Scheduled Maintenance Cron Endpoint (LP-OPS-001)', () => {
  const originalEnv = process.env;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-cron-secret-12345',
    };

    mockAdmin.mockReturnValue({
      from: mockFrom,
    });
    mockFrom.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      lt: mockLt,
    });
    mockLt.mockReturnValue({
      limit: mockLimit,
    });
    mockLimit.mockResolvedValue({
      data: [],
      error: null,
    });
    mockStripeRetrieve.mockReset();
    mockStripeExpire.mockReset();
  });

  afterAll(() => {
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
  });

  it('rejects unauthorized request with 401 when no auth header is provided (AC-01, RNF-01)', async () => {
    const req = new Request('http://localhost/api/cron/maintain');
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('No autorizado');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('rejects unauthorized request with 401 when invalid Bearer token is provided (AC-01, RNF-01)', async () => {
    const req = new Request('http://localhost/api/cron/maintain', {
      headers: {
        authorization: 'Bearer wrong-secret',
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('No autorizado');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('executes maintenance and returns 200 with metrics when all operations succeed (AC-02, RF-01, RF-02, RF-03)', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'lp_close_auctions') return Promise.resolve(3);
      if (name === 'lp_process_favorite_alerts') return Promise.resolve(7);
      if (name === 'lp_release') return Promise.resolve(true);
      return Promise.resolve(null);
    });

    mockLimit.mockResolvedValueOnce({
      data: [
        { id: 'order-1', stripe_session_id: null },
        { id: 'order-2', stripe_session_id: null },
      ],
      error: null,
    });

    const req = new Request('http://localhost/api/cron/maintain', {
      headers: {
        authorization: 'Bearer test-cron-secret-12345',
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.closedAuctions).toBe(3);
    expect(body.processedAlerts).toBe(7);
    expect(body.expiredOrders).toBe(2);
    expect(typeof body.timestamp).toBe('string');
  });

  it('supports POST method identical to GET (RF-01)', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'lp_close_auctions') return Promise.resolve(0);
      if (name === 'lp_process_favorite_alerts') return Promise.resolve(0);
      return Promise.resolve(null);
    });

    const req = new Request('http://localhost/api/cron/maintain', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-cron-secret-12345',
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 500 when lp_close_auctions RPC fails (Point 2, Point 4)', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'lp_close_auctions') {
        return Promise.reject(new Error('Postgres connection failure in lp_close_auctions'));
      }
      return Promise.resolve(0);
    });

    const req = new Request('http://localhost/api/cron/maintain', {
      headers: {
        authorization: 'Bearer test-cron-secret-12345',
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Error durante la ejecución del mantenimiento programado');
  });

  it('returns 500 when lp_process_favorite_alerts RPC fails (Point 2, Point 4)', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'lp_close_auctions') return Promise.resolve(2);
      if (name === 'lp_process_favorite_alerts') {
        return Promise.reject(new Error('Timeout processing favorite alerts'));
      }
      return Promise.resolve(0);
    });

    const req = new Request('http://localhost/api/cron/maintain', {
      headers: {
        authorization: 'Bearer test-cron-secret-12345',
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Error durante la ejecución del mantenimiento programado');
  });

  it('returns 500 when query for expired orders fails (Point 2, Point 4)', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'lp_close_auctions') return Promise.resolve(1);
      if (name === 'lp_process_favorite_alerts') return Promise.resolve(2);
      return Promise.resolve(0);
    });

    mockLimit.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database read error on lp_orders' },
    });

    const req = new Request('http://localhost/api/cron/maintain', {
      headers: {
        authorization: 'Bearer test-cron-secret-12345',
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Error durante la ejecución del mantenimiento programado');
  });

  it('returns 500 when lp_release fails and does not increment expiredOrders metric (Point 2, Point 3, Point 4)', async () => {
    mockRpc.mockImplementation((name: string) => {
      if (name === 'lp_close_auctions') return Promise.resolve(1);
      if (name === 'lp_process_favorite_alerts') return Promise.resolve(2);
      if (name === 'lp_release') {
        return Promise.reject(new Error('Failed to release expired order lock'));
      }
      return Promise.resolve(null);
    });

    mockLimit.mockResolvedValueOnce({
      data: [{ id: 'order-1', stripe_session_id: null }],
      error: null,
    });

    const req = new Request('http://localhost/api/cron/maintain', {
      headers: {
        authorization: 'Bearer test-cron-secret-12345',
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Error durante la ejecución del mantenimiento programado');
  });

  it('does not release an order when Stripe configuration is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    mockRpc.mockResolvedValue(0);
    mockLimit.mockResolvedValueOnce({
      data: [{id: 'order-1', stripe_session_id: 'cs_test_1'}],
      error: null,
    });

    const res = await GET(new Request('http://localhost/api/cron/maintain', {
      headers: {authorization: 'Bearer test-cron-secret-12345'},
    }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({error: 'Error durante la ejecución del mantenimiento programado'});
    expect(mockStripeRetrieve).not.toHaveBeenCalled();
    expect(mockRpc).not.toHaveBeenCalledWith('lp_release', expect.anything());
  });

  it('does not release an order when Stripe session retrieval fails', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
    mockRpc.mockResolvedValue(0);
    mockLimit.mockResolvedValueOnce({
      data: [{id: 'order-1', stripe_session_id: 'cs_test_1'}],
      error: null,
    });
    mockStripeRetrieve.mockRejectedValueOnce(new Error('Stripe request failed'));

    const res = await GET(new Request('http://localhost/api/cron/maintain', {
      headers: {authorization: 'Bearer test-cron-secret-12345'},
    }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({error: 'Error durante la ejecución del mantenimiento programado'});
    expect(mockRpc).not.toHaveBeenCalledWith('lp_release', expect.anything());
  });

  it('does not release an order when expiring an open Stripe session fails', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
    mockRpc.mockResolvedValue(0);
    mockLimit.mockResolvedValueOnce({
      data: [{id: 'order-1', stripe_session_id: 'cs_test_1'}],
      error: null,
    });
    mockStripeRetrieve.mockResolvedValueOnce({id: 'cs_test_1', status: 'open'});
    mockStripeExpire.mockRejectedValueOnce(new Error('Stripe expiration failed'));

    const res = await GET(new Request('http://localhost/api/cron/maintain', {
      headers: {authorization: 'Bearer test-cron-secret-12345'},
    }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({error: 'Error durante la ejecución del mantenimiento programado'});
    expect(mockRpc).not.toHaveBeenCalledWith('lp_release', expect.anything());
  });

  it('does not release an order when Stripe returns an unverifiable session status', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
    mockRpc.mockResolvedValue(0);
    mockLimit.mockResolvedValueOnce({
      data: [{id: 'order-1', stripe_session_id: 'cs_test_1'}],
      error: null,
    });
    mockStripeRetrieve.mockResolvedValueOnce({id: 'cs_test_1', status: null});

    const res = await GET(new Request('http://localhost/api/cron/maintain', {
      headers: {authorization: 'Bearer test-cron-secret-12345'},
    }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({error: 'Error durante la ejecución del mantenimiento programado'});
    expect(mockRpc).not.toHaveBeenCalledWith('lp_release', expect.anything());
  });

  it('keeps completed Stripe orders reserved and releases verified expired sessions', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
    mockRpc.mockImplementation((name: string) => Promise.resolve(name === 'lp_release' ? true : 0));
    mockLimit.mockResolvedValueOnce({
      data: [
        {id: 'order-complete', stripe_session_id: 'cs_complete'},
        {id: 'order-expired', stripe_session_id: 'cs_expired'},
      ],
      error: null,
    });
    mockStripeRetrieve
      .mockResolvedValueOnce({id: 'cs_complete', status: 'complete'})
      .mockResolvedValueOnce({id: 'cs_expired', status: 'expired'});

    const res = await GET(new Request('http://localhost/api/cron/maintain', {
      headers: {authorization: 'Bearer test-cron-secret-12345'},
    }));

    expect(res.status).toBe(200);
    expect((await res.json()).expiredOrders).toBe(1);
    expect(mockRpc).toHaveBeenCalledWith('lp_release', {p_order: 'order-expired'});
    expect(mockRpc).not.toHaveBeenCalledWith('lp_release', {p_order: 'order-complete'});
  });
});
