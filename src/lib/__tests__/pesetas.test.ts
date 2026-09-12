import {
  PESETAS_PER_EURO,
  PESETA_DISCLAIMER,
  eurosToPesetas,
  centsToPesetas,
  formatPesetas,
  pesetaEquivalence,
  trackPesetaHelp,
} from '../pesetas';

describe('pesetas utility (LP-FEAT-016)', () => {
  it('has the official irrevocable rate 1 EUR = 166.386 ESP', () => {
    expect(PESETAS_PER_EURO).toBe(166.386);
    expect(PESETA_DISCLAIMER).toBe('Equivalencia histórica · El pago se realiza en euros');
  });

  describe('eurosToPesetas and centsToPesetas conversion and rounding', () => {
    // AC-01: 75.00 € -> 12.479 ptas.
    it('calculates AC-01 requirement: 75.00 € = 12479 ptas.', () => {
      expect(eurosToPesetas(75)).toBe(12479);
      expect(centsToPesetas(7500)).toBe(12479);
    });

    // Enteros
    it('converts integer euro amounts correctly', () => {
      expect(eurosToPesetas(1)).toBe(166); // 1 * 166.386 = 166.386 -> 166
      expect(eurosToPesetas(10)).toBe(1664); // 10 * 166.386 = 1663.86 -> 1664
      expect(centsToPesetas(100)).toBe(166);
      expect(centsToPesetas(1000)).toBe(1664);
    });

    // Decimales
    it('converts decimal euro amounts correctly', () => {
      expect(eurosToPesetas(0.5)).toBe(83); // 0.5 * 166.386 = 83.193 -> 83
      expect(eurosToPesetas(99.99)).toBe(16637); // 99.99 * 166.386 = 16636.93614 -> 16637
      expect(eurosToPesetas(12.34)).toBe(2053); // 12.34 * 166.386 = 2053.20324 -> 2053
      expect(centsToPesetas(50)).toBe(83);
      expect(centsToPesetas(9999)).toBe(16637);
      expect(centsToPesetas(1234)).toBe(2053);
    });

    // Redondeo específico (arriba y abajo)
    it('handles exact rounding rules (round down and round up)', () => {
      // Round down: 3 * 166.386 = 499.158 -> 499
      expect(eurosToPesetas(3)).toBe(499);
      // Round up: 1.5 * 166.386 = 249.579 -> 250
      expect(eurosToPesetas(1.5)).toBe(250);
      // 75 * 166.386 = 12478.95 -> 12479
      expect(eurosToPesetas(75)).toBe(12479);
    });

    // Cero informativo y valores no positivos o inválidos
    it('handles zero and non-positive / invalid numbers gracefully', () => {
      expect(eurosToPesetas(0)).toBe(0);
      expect(centsToPesetas(0)).toBe(0);
      expect(eurosToPesetas(-10)).toBe(0);
      expect(centsToPesetas(-500)).toBe(0);
      expect(eurosToPesetas(NaN)).toBe(0);
      expect(centsToPesetas(Infinity)).toBe(0);
    });

    // Valores máximos permitidos (10.000 € en plataforma)
    it('handles maximum allowable platform value (10.000 €)', () => {
      // 10000 * 166.386 = 1663860
      expect(eurosToPesetas(10000)).toBe(1663860);
      expect(centsToPesetas(1000000)).toBe(1663860);
    });
  });

  describe('formatPesetas and pesetaEquivalence', () => {
    it('formats pesetas with Spanish thousands separator', () => {
      expect(formatPesetas(0)).toBe('0');
      expect(formatPesetas(166)).toBe('166');
      expect(formatPesetas(12479)).toBe('12.479');
      expect(formatPesetas(1663860)).toBe('1.663.860');
    });

    it('generates the standard equivalence string with ≈ prefix and ptas. suffix', () => {
      // AC-01
      expect(pesetaEquivalence(75)).toBe('≈ 12.479 ptas.');
      expect(pesetaEquivalence(7500, true)).toBe('≈ 12.479 ptas.');

      expect(pesetaEquivalence(0)).toBe('≈ 0 ptas.');
      expect(pesetaEquivalence(1)).toBe('≈ 166 ptas.');
      expect(pesetaEquivalence(99.99)).toBe('≈ 16.637 ptas.');
      expect(pesetaEquivalence(10000)).toBe('≈ 1.663.860 ptas.');
    });
  });

  describe('trackPesetaHelp analytics', () => {
    it('dispatches custom event on window when triggered', () => {
      const listener = jest.fn();
      window.addEventListener('lp:peseta_help', listener);

      trackPesetaHelp('peseta_help_click', { location: 'product_detail' });

      expect(listener).toHaveBeenCalled();
      const eventDetail = listener.mock.calls[0][0].detail;
      expect(eventDetail.event).toBe('peseta_help_click');
      expect(eventDetail.location).toBe('product_detail');
      expect(typeof eventDetail.timestamp).toBe('number');

      window.removeEventListener('lp:peseta_help', listener);
    });

    it('invokes window.gtag when available', () => {
      const mockGtag = jest.fn();
      (window as any).gtag = mockGtag;

      trackPesetaHelp('peseta_help_view', { source: 'catalog_card' });

      expect(mockGtag).toHaveBeenCalledWith('event', 'peseta_help_view', { source: 'catalog_card' });

      delete (window as any).gtag;
    });
  });
});
