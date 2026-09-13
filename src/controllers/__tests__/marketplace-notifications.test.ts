/**
 * @jest-environment node
 */
import {handle} from '../marketplace';

const mockGetUser = jest.fn();
jest.mock('@/utils/supabase/server', () => ({
  createClient: () => Promise.resolve({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

const mockRpc = jest.fn();
const mockAdmin = jest.fn();
jest.mock('@/models/marketplace', () => ({
  rpc: (...args: any[]) => mockRpc(...args),
  admin: () => mockAdmin(),
  card: jest.fn(),
  publicFields: '*',
  profilesById: jest.fn().mockResolvedValue(new Map()),
  getPublicProfile: jest.fn(),
  getCurrentFeaturedEdition: jest.fn(),
  getAuctionEditionBySlug: jest.fn(),
}));

describe('Marketplace Controller - Notification Actions (LP-FEAT-021)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc.mockResolvedValue({});
  });

  it('rejects unauthenticated requests to mark all notifications as read', async () => {
    mockGetUser.mockResolvedValue({data: {user: null}});
    const request = new Request('http://localhost/api/market/mark-all-notifications-read', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: '{}',
    });

    const response = await handle(request, ['mark-all-notifications-read']);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Inicia sesión para continuar.');
  });

  it('marks all unread notifications for authenticated user as read', async () => {
    mockGetUser.mockResolvedValue({data: {user: {id: 'user-abc', email: 'test@example.com'}}});

    const mockSelect = jest.fn().mockResolvedValue({
      data: [{id: 'note-1'}, {id: 'note-2'}],
      error: null,
    });
    const mockEqRead = jest.fn().mockReturnValue({select: mockSelect});
    const mockEqUser = jest.fn().mockReturnValue({eq: mockEqRead});
    const mockUpdate = jest.fn().mockReturnValue({eq: mockEqUser});
    const mockFrom = jest.fn().mockReturnValue({update: mockUpdate});

    mockAdmin.mockReturnValue({from: mockFrom});

    const request = new Request('http://localhost/api/market/mark-all-notifications-read', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: '{}',
    });

    const response = await handle(request, ['mark-all-notifications-read']);
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toEqual({success: true, markedCount: 2});
    expect(mockFrom).toHaveBeenCalledWith('lp_notifications');
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({read: true}));
    expect(mockEqUser).toHaveBeenCalledWith('user_id', 'user-abc');
    expect(mockEqRead).toHaveBeenCalledWith('read', false);
  });
});
