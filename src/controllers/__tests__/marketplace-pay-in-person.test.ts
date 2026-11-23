/** @jest-environment node */
import {handle} from '../marketplace';

const mockRpc = jest.fn();
const mockFrom = jest.fn();
const mockRetrieve = jest.fn();
const mockExpire = jest.fn();
const mockCreate = jest.fn();
const mockAccount = jest.fn();
const actor = 'b51f3154-f104-4662-8b89-8962e98d4ea1';
const order = '35117c59-4c7a-43d1-b799-65f16d77ac45';
const listing = '8a7fd4c0-d845-406c-a24a-b286c77cc79f';

jest.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({auth: {getUser: async () => ({data: {user: {id: actor}}})}}),
}));
jest.mock('@/models/marketplace', () => ({
  rpc: (...args: unknown[]) => mockRpc(...args),
  admin: () => ({from: mockFrom}),
}));
jest.mock('@/lib/payments', () => ({
  origin: () => 'http://localhost:3092',
  stripe: () => ({
    checkout: {sessions: {retrieve: mockRetrieve, expire: mockExpire, create: mockCreate}},
    accounts: {retrieve: mockAccount},
  }),
}));

function post(action = 'pay-in-person', id = order) {
  return handle(new Request('http://localhost:3092/api/market/' + action + '/' + id, {
    method: 'POST', body: '{}', headers: {'Content-Type': 'application/json'},
  }), [action, id]);
}

function lookup(data: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({data, error: null}),
    maybeSingle: jest.fn().mockResolvedValue({data, error: null}),
  };
}

beforeEach(() => {
  jest.resetAllMocks();
  mockRpc.mockResolvedValue({status: 'completed'});
});
const paymentMode = process.env.LAPELA_PAYMENTS_MODE;
afterEach(() => {
  if (paymentMode === undefined) delete process.env.LAPELA_PAYMENTS_MODE;
  else process.env.LAPELA_PAYMENTS_MODE = paymentMode;
});

test('does not contact Stripe when the caller is not the seller', async () => {
  const query = lookup(null);
  mockFrom.mockReturnValue(query);
  expect((await post()).status).toBe(403);
  expect(query.eq).toHaveBeenCalledWith('seller_id', actor);
  expect(mockRetrieve).not.toHaveBeenCalled();
  expect(mockExpire).not.toHaveBeenCalled();
});

test('verifies expiration before asking PostgreSQL to close the payment', async () => {
  mockFrom.mockReturnValue(lookup({stripe_session_id: 'cs_test_open', status: 'pending_payment'}));
  mockRetrieve.mockResolvedValue({id: 'cs_test_open', status: 'open'});
  mockExpire.mockResolvedValue({id: 'cs_test_open', status: 'expired'});
  expect((await post()).status).toBe(200);
  expect(mockExpire).toHaveBeenCalledWith('cs_test_open');
  expect(mockRpc).toHaveBeenCalledWith('lp_confirm_in_person_payment', {
    p_order: order, p_actor: actor, p_closed_stripe_session: 'cs_test_open',
  });
});

test('keeps a Stripe payment that completes during expiration', async () => {
  mockFrom.mockReturnValue(lookup({stripe_session_id: 'cs_test_paid', status: 'pending_payment'}));
  mockRetrieve.mockResolvedValueOnce({id: 'cs_test_paid', status: 'open'})
    .mockResolvedValueOnce({id: 'cs_test_paid', status: 'complete'});
  mockExpire.mockRejectedValue(new Error('Checkout is already complete'));
  expect((await post()).status).toBe(409);
  expect(mockRpc.mock.calls.map(([name]) => name)).not.toContain('lp_confirm_in_person_payment');
});

test('expires a new Checkout without exposing its URL if payment in person won the race', async () => {
  process.env.LAPELA_PAYMENTS_MODE = 'live';
  const update = {
    update: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), is: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue({data: [], error: null}),
  };
  mockFrom.mockReturnValueOnce(lookup({id: listing, title: 'Radio de prueba', environment: 'live'}))
    .mockReturnValueOnce(lookup({stripe_account_id: 'acct_test'}))
    .mockReturnValueOnce(update)
    .mockReturnValueOnce(lookup({status: 'completed', stripe_session_id: null}));
  mockRpc.mockImplementation(async name => name === 'lp_reserve' ? {id: order, amount_cents: 2500} : {});
  mockAccount.mockResolvedValue({charges_enabled: true});
  const session = {id: 'cs_test_cancel', expires_at: 1795400000, status: 'open', url: 'https://checkout.stripe.com/test'};
  mockCreate.mockResolvedValue(session);
  mockRetrieve.mockResolvedValue(session);
  mockExpire.mockResolvedValue({...session, status: 'expired'});

  const response = await post('checkout', listing);

  expect(response.status).toBe(409);
  expect(await response.json()).not.toHaveProperty('url');
  expect(update.eq).toHaveBeenCalledWith('status', 'pending_payment');
  expect(update.is).toHaveBeenCalledWith('stripe_session_id', null);
  expect(mockExpire).toHaveBeenCalledWith(session.id);
});
