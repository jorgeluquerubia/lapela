export function stripeSandboxPayments() {
  return process.env.LAPELA_PAYMENTS_MODE === 'stripe_test';
}

export function marketplaceEnvironment(): 'sandbox' | 'live' {
  return process.env.LAPELA_PAYMENTS_MODE === 'simulated' || stripeSandboxPayments()
    ? 'sandbox'
    : 'live';
}
