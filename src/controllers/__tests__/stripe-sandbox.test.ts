/** @jest-environment node */
import {admin, rpc} from '@/models/marketplace';
import {createClient} from '@/utils/supabase/server';
import {stripe} from '@/lib/payments';
import {handle} from '../marketplace';

jest.mock('@/utils/supabase/server', () => ({createClient: jest.fn()}));
jest.mock('@/models/marketplace', () => ({admin: jest.fn(), rpc: jest.fn()}));
jest.mock('@/lib/payments', () => ({stripe: jest.fn(), origin: () => 'http://localhost:3082'}));

const original = process.env;
const actor = {id: 'b51f3154-f104-4662-8b89-8962e98d4ea1', email: 'comprador@example.com'};
const item = '8f7fd4c0-d845-406c-a24a-b286c77cc79f';
const seller = '2102a339-55e2-43bb-803b-eab17a830d4e';
const order = '35117c59-4c7a-43d1-b799-65f16d77ac45';
const connectedAccount = 'acct_prueba';
const from = jest.fn();
const client = {
  accounts: {create: jest.fn(), retrieve: jest.fn()},
  accountLinks: {create: jest.fn()},
  checkout: {sessions: {create: jest.fn()}},
};

function post(path: string[]) {
  return handle(new Request('http://localhost:3082/api/market/' + path.join('/'), {
    method: 'POST', body: '{}', headers: {'Content-Type': 'application/json'},
  }), path);
}

function lookup(data: unknown) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({data, error: data ? null : {message: 'No rows'}}),
    maybeSingle: jest.fn().mockResolvedValue({data, error: null}),
    upsert: jest.fn().mockResolvedValue({data, error: null}),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env = {...original, LAPELA_PAYMENTS_MODE: 'stripe_test'};
  (createClient as jest.Mock).mockResolvedValue({auth: {getUser: async () => ({data: {user: actor}})}});
  (admin as jest.Mock).mockReturnValue({from});
  (stripe as jest.Mock).mockReturnValue(client);
  (rpc as jest.Mock).mockImplementation(async (name) => name === 'lp_reserve'
    ? {id: order, amount_cents: 2500}
    : {});
});

afterEach(() => {
  process.env = original;
});

test('onboards a test seller and stores the connected account under sandbox', async () => {
  const account = lookup(null);
  from.mockReturnValue(account);
  client.accounts.create.mockResolvedValue({id: connectedAccount});
  client.accountLinks.create.mockResolvedValue({url: 'https://connect.stripe.com/test-onboarding'});

  const response = await post(['onboard']);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({url: 'https://connect.stripe.com/test-onboarding'});
  expect(from).toHaveBeenCalledWith('lp_stripe_sandbox_accounts');
  expect(account.upsert).toHaveBeenCalledWith(
    {user_id: actor.id, stripe_account_id: connectedAccount},
    {onConflict: 'user_id'},
  );
});

test('creates a Stripe Checkout session for a sandbox listing and matching seller account', async () => {
  const listing = lookup({id: item, seller_id: seller, title: 'Radio de prueba', delivery: 'pickup'});
  const account = lookup({stripe_account_id: connectedAccount});
  const update = jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({eq: jest.fn().mockResolvedValue({data: null, error: null})}),
  });
  const tables: Record<string, unknown> = {lp_listings: listing, lp_stripe_sandbox_accounts: account, lp_orders: {update}};
  from.mockImplementation((table: string) => tables[table]);
  client.accounts.retrieve.mockResolvedValue({charges_enabled: true});
  client.checkout.sessions.create.mockResolvedValue({
    id: 'cs_test_prueba', url: 'https://checkout.stripe.com/c/pay/cs_test_prueba', expires_at: 1795378000,
  });

  const response = await post(['checkout', item]);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({url: 'https://checkout.stripe.com/c/pay/cs_test_prueba'});
  expect(listing.eq).toHaveBeenCalledWith('environment', 'sandbox');
  expect(from).toHaveBeenCalledWith('lp_stripe_sandbox_accounts');
  expect(rpc).toHaveBeenCalledWith('lp_reserve', {p_listing: item, p_actor: actor.id});
  expect(client.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
    metadata: {order_id: order},
    line_items: [expect.objectContaining({price_data: expect.objectContaining({unit_amount: 2500})})],
    payment_intent_data: expect.objectContaining({transfer_data: {destination: connectedAccount}}),
  }), {idempotencyKey: 'lapela-order-' + order});
  expect(update).toHaveBeenCalledWith(expect.objectContaining({stripe_session_id: 'cs_test_prueba'}));
});

test('does not create a Stripe session or reservation for a listing outside the sandbox', async () => {
  const listing = lookup(null);
  from.mockReturnValue(listing);

  expect((await post(['checkout', item])).status).toBe(400);
  expect(listing.eq).toHaveBeenCalledWith('environment', 'sandbox');
  expect(stripe).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalledWith('lp_reserve', expect.anything());
});
