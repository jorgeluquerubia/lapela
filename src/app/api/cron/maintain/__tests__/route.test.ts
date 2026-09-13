/**
 * @jest-environment node
 */
import { GET, POST } from '../route';
import { runMaintenance } from '@/controllers/marketplace';

jest.mock('@/controllers/marketplace', () => ({
  runMaintenance: jest.fn(),
}));

describe('Scheduled Maintenance Cron Endpoint (LP-OPS-001)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-cron-secret-12345',
    };
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
    expect(runMaintenance).not.toHaveBeenCalled();
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
    expect(runMaintenance).not.toHaveBeenCalled();
  });

  it('executes maintenance and returns 200 with metrics when valid Bearer token is provided (AC-02, RF-01, RF-02, RF-03)', async () => {
    (runMaintenance as jest.Mock).mockResolvedValueOnce({
      closedAuctions: 3,
      processedAlerts: 7,
      expiredOrders: 1,
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
    expect(body.expiredOrders).toBe(1);
    expect(typeof body.timestamp).toBe('string');
    expect(runMaintenance).toHaveBeenCalledTimes(1);
  });

  it('supports POST method identical to GET (RF-01)', async () => {
    (runMaintenance as jest.Mock).mockResolvedValueOnce({
      closedAuctions: 0,
      processedAlerts: 0,
      expiredOrders: 0,
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
    expect(runMaintenance).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when maintenance encounters an unexpected failure without leaking secrets (AC-05)', async () => {
    (runMaintenance as jest.Mock).mockRejectedValueOnce(new Error('Database connection timeout'));

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
});
