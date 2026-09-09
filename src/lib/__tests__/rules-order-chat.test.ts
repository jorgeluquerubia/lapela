import { canMessage } from '../rules';

describe('Order chat authorization rules (LP-FEAT-007)', () => {
  const buyerId = 'buyer-uuid-1111';
  const sellerId = 'seller-uuid-2222';
  const outsiderId = 'outsider-uuid-9999';

  it('allows buyer and seller to message when order is in pending_payment (reserved)', () => {
    expect(canMessage('pending_payment', buyerId, buyerId, sellerId)).toBe(true);
    expect(canMessage('pending_payment', sellerId, buyerId, sellerId)).toBe(true);
  });

  it('allows buyer and seller to message in post-payment active states', () => {
    const activeStates = ['paid', 'shipped', 'completed', 'disputed'];
    for (const status of activeStates) {
      expect(canMessage(status, buyerId, buyerId, sellerId)).toBe(true);
      expect(canMessage(status, sellerId, buyerId, sellerId)).toBe(true);
    }
  });

  it('rejects messaging from outsiders even if order is reserved or paid', () => {
    expect(canMessage('pending_payment', outsiderId, buyerId, sellerId)).toBe(false);
    expect(canMessage('paid', outsiderId, buyerId, sellerId)).toBe(false);
  });

  it('rejects messaging when order is cancelled or refunded', () => {
    expect(canMessage('cancelled', buyerId, buyerId, sellerId)).toBe(false);
    expect(canMessage('refunded', buyerId, buyerId, sellerId)).toBe(false);
    expect(canMessage('unknown', buyerId, buyerId, sellerId)).toBe(false);
  });
});
