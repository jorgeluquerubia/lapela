/** @jest-environment node */
import {admin, rpc} from '@/models/marketplace';
import Stripe from 'stripe';
import {POST} from '../route';

jest.mock('@/models/marketplace', () => ({admin: jest.fn(), rpc: jest.fn()}));

const original = process.env;
const secret = 'whsec_unit_test';
const orderId = 'b51f3154-f104-4662-8b89-8962e98d4ea1';
const webhooks = new Stripe('sk_test_example').webhooks;
const query = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env = {...original, LAPELA_PAYMENTS_MODE: 'stripe_test', STRIPE_SECRET_KEY: 'sk_test_example', STRIPE_WEBHOOK_SECRET: secret};
  (admin as jest.Mock).mockReturnValue({from: () => query});
  query.maybeSingle.mockResolvedValue({data: {id: orderId}, error: null});
});

afterEach(() => {
  process.env = original;
});

function paidEvent(livemode = false, signingSecret = secret) {
  const payload = JSON.stringify({
    id: 'evt_test_paid',
    type: 'checkout.session.completed',
    livemode,
    data: {object: {
      id: 'cs_test_session',
      payment_status: 'paid',
      payment_intent: 'pi_test_payment',
      currency: 'eur',
      amount_total: 2500,
      metadata: {order_id: orderId},
    }},
  });
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: {'stripe-signature': webhooks.generateTestHeaderString({payload, secret: signingSecret})},
    body: payload,
  });
}

test('passes signed Stripe test events to the idempotent confirmation for a sandbox order', async () => {
  expect((await POST(paidEvent())).status).toBe(200);
  expect(query.eq).toHaveBeenCalledWith('id', orderId);
  expect(query.eq).toHaveBeenCalledWith('listing.environment', 'sandbox');
  expect(rpc).toHaveBeenCalledWith('lp_confirm_payment', {
    p_event: 'evt_test_paid', p_order: orderId, p_session: 'cs_test_session',
    p_payment: 'pi_test_payment', p_amount: 2500, p_address: null,
  });
});

test('rejects an invalid signature and a live event before accessing the database', async () => {
  expect((await POST(paidEvent(false, 'whsec_wrong'))).status).toBe(400);
  expect((await POST(paidEvent(true))).status).toBe(400);
  expect(admin).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
});

test('ignores a confirmed payment for an order outside the sandbox', async () => {
  query.maybeSingle.mockResolvedValue({data: null, error: null});
  expect((await POST(paidEvent())).status).toBe(200);
  expect(rpc).not.toHaveBeenCalled();
});

test('keeps the Stripe webhook unavailable in internal simulation', async () => {
  process.env.LAPELA_PAYMENTS_MODE = 'simulated';
  expect((await POST(paidEvent())).status).toBe(503);
  expect(admin).not.toHaveBeenCalled();
});
