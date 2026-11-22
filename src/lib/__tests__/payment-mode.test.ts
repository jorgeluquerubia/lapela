/** @jest-environment node */
import {marketplaceEnvironment} from '../payment-mode';
import {stripe} from '../payments';

const original = process.env;

beforeEach(() => {
  process.env = {...original, LAPELA_PAYMENTS_MODE: 'stripe_test'};
});

afterEach(() => {
  process.env = original;
});

test.each(['sk_test_example', 'rk_test_example', 'rkcs_test_example'])(
  'allows the %s format in Stripe sandbox',
  (key) => {
    process.env.STRIPE_SECRET_KEY = key;
    expect(marketplaceEnvironment()).toBe('sandbox');
    expect(stripe()).toBeDefined();
  },
);

test.each(['sk_live_example', 'rk_live_example'])(
  'rejects a live key in Stripe sandbox even with live payments enabled',
  (key) => {
    process.env.STRIPE_SECRET_KEY = key;
    process.env.LAPELA_LIVE_PAYMENTS = 'true';
    expect(stripe).toThrow('Stripe sandbox requiere una clave de prueba.');
  },
);

test('allows a live key only after explicitly enabling live payments', () => {
  process.env.LAPELA_PAYMENTS_MODE = 'stripe';
  process.env.STRIPE_SECRET_KEY = 'rk_live_example';
  process.env.LAPELA_LIVE_PAYMENTS = 'false';
  expect(marketplaceEnvironment()).toBe('live');
  expect(stripe).toThrow('Los pagos reales todavía no están habilitados.');
  process.env.LAPELA_LIVE_PAYMENTS = 'true';
  expect(stripe()).toBeDefined();
});

test('keeps the internal simulator on the sandbox catalog and requires stripe_test for test keys', () => {
  process.env.LAPELA_PAYMENTS_MODE = 'simulated';
  process.env.STRIPE_SECRET_KEY = 'sk_test_example';
  expect(marketplaceEnvironment()).toBe('sandbox');
  expect(stripe).toThrow('activa el modo stripe_test');
});
