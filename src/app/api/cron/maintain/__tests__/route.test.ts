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

jest.mock('@/models/marketplace', () => ({
  rpc: (...args: any[]) => mockRpc(...args),
  admin: () => mockAdmin(),
}));

describe('Scheduled Maintenance Cron Endpoint (LP-OPS-001)', () => {
  const originalEnv = process.env;

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
  });

  afterAll(() => {
    process.env = originalEnv;
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
    expect(body.error).toBe('Postgres connection failure in lp_close_auctions');
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
    expect(body.error).toBe('Timeout processing favorite alerts');
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
    expect(body.error).toBe('No se ha podido completar la operación. Inténtalo de nuevo.');
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
    expect(body.error).toBe('Failed to release expired order lock');
  });
});
