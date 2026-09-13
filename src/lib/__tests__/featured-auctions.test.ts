import {
  getEditionTemporalStatus,
  formatCountdown,
  validateAuctionEligibility,
  isOperatorUser,
  getItemAuctionOutcome,
} from '../featured-auctions';

describe('LP-FEAT-019: Subastas destacadas y coordinadas', () => {
  describe('Cálculo de estados temporales de la edición', () => {
    const startsAt = '2026-09-15T10:00:00.000Z';
    const referenceEndsAt = '2026-09-20T20:00:00.000Z';

    it('devuelve "upcoming" (Próximamente) antes del inicio', () => {
      const before = new Date('2026-09-14T10:00:00.000Z');
      expect(getEditionTemporalStatus(startsAt, referenceEndsAt, before)).toBe('upcoming');
    });

    it('devuelve "active" (En curso) durante la ventana editorial', () => {
      const during = new Date('2026-09-16T12:00:00.000Z');
      expect(getEditionTemporalStatus(startsAt, referenceEndsAt, during)).toBe('active');
    });

    it('devuelve "ended" (Finalizada) tras el cierre de referencia', () => {
      const after = new Date('2026-09-20T20:00:01.000Z');
      expect(getEditionTemporalStatus(startsAt, referenceEndsAt, after)).toBe('ended');
    });

    it('AC-04: una ampliación anti-sniping en un artículo no altera el estado de la edición', () => {
      // El artículo se extiende 2 minutos más allá del cierre de referencia de la edición
      const extendedArticleEndsAt = '2026-09-20T20:02:00.000Z';
      const now = new Date('2026-09-20T20:00:30.000Z');

      // La edición ya concluyó su ventana informativa
      expect(getEditionTemporalStatus(startsAt, referenceEndsAt, now)).toBe('ended');
      // El artículo sigue vivo de forma independiente
      expect(new Date(extendedArticleEndsAt).getTime() > now.getTime()).toBe(true);
    });
  });

  describe('Formato accesible de cuenta atrás (RNF-03)', () => {
    it('formatea días y horas', () => {
      const now = new Date('2026-09-10T10:00:00.000Z');
      const target = new Date('2026-09-12T14:30:00.000Z');
      expect(formatCountdown(target, now)).toBe('2 días y 4 horas');
    });

    it('formatea horas y minutos', () => {
      const now = new Date('2026-09-10T10:00:00.000Z');
      const target = new Date('2026-09-10T13:45:00.000Z');
      expect(formatCountdown(target, now)).toBe('3 horas y 45 min');
    });

    it('formatea minutos y segundos cuando queda menos de una hora', () => {
      const now = new Date('2026-09-10T10:00:00.000Z');
      const target = new Date('2026-09-10T10:12:35.000Z');
      expect(formatCountdown(target, now)).toBe('12 min y 35 s');
    });

    it('formatea solo segundos cuando queda menos de un minuto', () => {
      const now = new Date('2026-09-10T10:00:00.000Z');
      const target = new Date('2026-09-10T10:00:42.000Z');
      expect(formatCountdown(target, now)).toBe('42 s');
    });

    it('muestra "Finalizada" si el tiempo ha expirado', () => {
      const now = new Date('2026-09-10T10:00:00.000Z');
      const target = new Date('2026-09-10T09:59:00.000Z');
      expect(formatCountdown(target, now)).toBe('Finalizada');
    });
  });

  describe('Clasificación precisa de resultados (AC-05, RN-03)', () => {
    const now = new Date('2026-09-20T20:00:00.000Z');
    const edition = {
      starts_at: '2026-09-15T10:00:00.000Z',
      reference_ends_at: '2026-09-20T20:00:00.000Z',
    };

    it('reconoce anuncios con estado "reserved" como adjudicados', () => {
      const listing = {
        status: 'reserved',
        ends_at: '2026-09-20T19:59:00.000Z',
        bid_count: 8,
      };
      const outcome = getItemAuctionOutcome(listing, now, edition);
      expect(outcome.status).toBe('awarded');
      expect(outcome.label).toBe('Adjudicado');
      expect(outcome.detail).toBe('Adjudicado, pendiente del flujo correspondiente');
      expect(outcome.isEnded).toBe(true);
    });

    it('reconoce anuncios con estado "sold" como vendidos y confirmados', () => {
      const listing = {
        status: 'sold',
        ends_at: '2026-09-20T19:00:00.000Z',
        bid_count: 3,
      };
      const outcome = getItemAuctionOutcome(listing, now, edition);
      expect(outcome.status).toBe('awarded');
      expect(outcome.label).toBe('Vendido');
      expect(outcome.detail).toBe('Vendido y confirmado');
      expect(outcome.isEnded).toBe(true);
    });

    it('cuando el ganador no paga y lp_release marca el anuncio como expired, conserva las pujas y no lo califica como Adjudicado', () => {
      // Caso específico: el ganador no paga en el plazo estipulado, lp_release cancela la reserva
      // y marca el anuncio como 'expired'. Las pujas siguen registradas (bid_count > 0).
      // La edición debe clasificarlo como No adjudicado / venta no completada, jamás como Adjudicado.
      const listing = {
        status: 'expired',
        ends_at: '2026-09-20T19:59:00.000Z',
        bid_count: 14,
        highest_bidder: 'buyer-defaulted-123',
      };
      const outcome = getItemAuctionOutcome(listing, now, edition);
      expect(outcome.status).toBe('unsold');
      expect(outcome.label).toBe('No adjudicado');
      expect(outcome.detail).toBe('No adjudicado / venta no completada');
      expect(outcome.isEnded).toBe(true);
      expect(outcome.status).not.toBe('awarded');
      expect(outcome.label).not.toBe('Adjudicado');
    });

    it('mantiene como activo un artículo con prórroga anti-sniping superando la edición con pujas', () => {
      const listing = {
        status: 'available',
        ends_at: '2026-09-20T20:03:00.000Z', // 3 minutos después del cierre de la edición
        bid_count: 5,
      };
      const outcome = getItemAuctionOutcome(listing, now, edition);
      expect(outcome.status).toBe('active');
      expect(outcome.label).toBe('En curso');
      expect(outcome.detail).toBe('En prórroga anti-sniping');
      expect(outcome.isEnded).toBe(false);
      expect(outcome.isExtended).toBe(true);
    });

    it('muestra "En curso" de forma neutral si el artículo sigue abierto sin evidencia de prórroga activa', () => {
      const midEditionTime = new Date('2026-09-18T12:00:00.000Z');
      const listing = {
        status: 'available',
        ends_at: '2026-09-20T19:30:00.000Z', // Dentro del límite de la edición
        bid_count: 2,
      };
      const outcome = getItemAuctionOutcome(listing, midEditionTime, edition);
      expect(outcome.status).toBe('active');
      expect(outcome.label).toBe('En curso');
      expect(outcome.detail).toBe('En curso');
      expect(outcome.isEnded).toBe(false);
      expect(outcome.isExtended).toBe(false);
    });

    it('mantiene estado persistido "En curso" (pendiente de cierre) si ends_at venció pero la base de datos no lo ha cerrado aún', () => {
      const listing = {
        status: 'available',
        ends_at: '2026-09-20T19:50:00.000Z',
        bid_count: 4,
      };
      const outcome = getItemAuctionOutcome(listing, now, edition);
      expect(outcome.status).toBe('active');
      expect(outcome.label).toBe('En curso');
      expect(outcome.detail).toBe('Pendiente de cierre');
      expect(outcome.isEnded).toBe(false);
      expect(outcome.isExtended).toBe(false);
    });

    it('marca como "Sin venta" subastas expiradas o concluidas con 0 pujas', () => {
      const listing = {
        status: 'expired',
        ends_at: '2026-09-20T19:59:00.000Z',
        bid_count: 0,
      };
      const outcome = getItemAuctionOutcome(listing, now, edition);
      expect(outcome.status).toBe('unsold');
      expect(outcome.label).toBe('Sin venta');
      expect(outcome.detail).toBe('Sin pujas suficientes');
      expect(outcome.isEnded).toBe(true);
    });

    it('marca como "Retirado" anuncios con estado withdrawn', () => {
      const listing = {
        status: 'withdrawn',
        ends_at: '2026-09-20T20:00:00.000Z',
        bid_count: 0,
      };
      const outcome = getItemAuctionOutcome(listing, now, edition);
      expect(outcome.status).toBe('withdrawn');
      expect(outcome.label).toBe('Retirado');
      expect(outcome.isEnded).toBe(true);
    });
  });

  describe('Criterios de elegibilidad (AC-01, RN-01)', () => {
    const baseEdition = {
      environment: 'sandbox',
      starts_at: '2026-09-15T10:00:00.000Z',
      reference_ends_at: '2026-09-20T20:00:00.000Z',
    };
    const now = new Date('2026-09-12T10:00:00.000Z');

    it('rechaza artículos que no son modalidad subasta (compra directa / precio cerrado)', () => {
      const listing = {
        mode: 'sale',
        status: 'available',
        environment: 'sandbox',
        ends_at: null,
      };
      const res = validateAuctionEligibility(listing, baseEdition, now);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('Solo se pueden asociar artículos en modalidad de subasta');
    });

    it('rechaza artículos no disponibles (vendidos, reservados o retirados)', () => {
      const listing = {
        mode: 'auction',
        status: 'sold',
        environment: 'sandbox',
        ends_at: '2026-09-20T20:00:00.000Z',
      };
      const res = validateAuctionEligibility(listing, baseEdition, now);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('El artículo debe estar disponible');
    });

    it('rechaza artículos de un entorno distinto (sandbox vs live)', () => {
      const listing = {
        mode: 'auction',
        status: 'available',
        environment: 'live',
        ends_at: '2026-09-20T20:00:00.000Z',
      };
      const res = validateAuctionEligibility(listing, baseEdition, now);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('El artículo no pertenece al mismo entorno de la edición');
    });

    it('rechaza subastas que ya han finalizado', () => {
      const listing = {
        mode: 'auction',
        status: 'available',
        environment: 'sandbox',
        ends_at: '2026-09-11T20:00:00.000Z', // En el pasado
      };
      const res = validateAuctionEligibility(listing, baseEdition, now);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('No se pueden asociar subastas ya finalizadas');
    });

    it('rechaza subastas que terminan antes o en la apertura de la edición', () => {
      const listing = {
        mode: 'auction',
        status: 'available',
        environment: 'sandbox',
        ends_at: '2026-09-15T09:00:00.000Z', // Antes de starts_at (2026-09-15T10:00:00Z)
      };
      const res = validateAuctionEligibility(listing, baseEdition, now);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('La subasta debe finalizar después de la apertura de la edición');
    });

    it('rechaza subastas cuyo cierre previsto supera el cierre de referencia de la edición al asociarse', () => {
      const listing = {
        mode: 'auction',
        status: 'available',
        environment: 'sandbox',
        ends_at: '2026-09-20T21:00:00.000Z', // Después de reference_ends_at (2026-09-20T20:00:00Z)
      };
      const res = validateAuctionEligibility(listing, baseEdition, now);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('El cierre previsto de la subasta no puede superar el cierre de referencia de la edición');
    });

    it('acepta subastas válidas y elegibles con cierre compatible con la ventana de la edición', () => {
      const listing = {
        mode: 'auction',
        status: 'available',
        environment: 'sandbox',
        ends_at: '2026-09-20T19:00:00.000Z',
      };
      const res = validateAuctionEligibility(listing, baseEdition, now);
      expect(res.eligible).toBe(true);
    });
  });

  describe('Autorización operativa (RNF-01, AC-06)', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = {...originalEnv};
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('rechaza usuarios anónimos o no identificados', async () => {
      expect(await isOperatorUser(null)).toBe(false);
      expect(await isOperatorUser(undefined)).toBe(false);
    });

    it('autoriza por variable de entorno OPERATOR_EMAILS', async () => {
      process.env.OPERATOR_EMAILS = 'operaciones@lapela.es,admin@lapela.es';
      expect(await isOperatorUser({id: 'u1', email: 'operaciones@lapela.es'})).toBe(true);
      expect(await isOperatorUser({id: 'u2', email: 'usuario@example.com'})).toBe(false);
    });

    it('autoriza por tabla de operadores si está configurado en bd', async () => {
      const mockDb = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({data: {user_id: 'op-123'}}),
            }),
          }),
        }),
      };
      expect(await isOperatorUser({id: 'op-123', email: 'otro@example.com'}, mockDb)).toBe(true);
    });

    it('rechaza usuarios corrientes sin rol operativo', async () => {
      const mockDb = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({data: null}),
            }),
          }),
        }),
      };
      expect(await isOperatorUser({id: 'user-regular', email: 'vendedor@example.com'}, mockDb)).toBe(false);
    });
  });
});
