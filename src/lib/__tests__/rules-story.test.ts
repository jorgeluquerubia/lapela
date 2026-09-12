import { validateStory, noExternalPayment } from '../rules';

describe('Domain rules for Object Stories (LP-FEAT-017)', () => {
  describe('noExternalPayment', () => {
    it('allows story without external payment mentions', () => {
      expect(noExternalPayment('Esta cámara la compré en un viaje por Andalucía.')).toBe(
        'Esta cámara la compré en un viaje por Andalucía.'
      );
    });

    it('rejects external payment methods', () => {
      expect(() => noExternalPayment('Pago por bizum antes de enviar')).toThrow(/métodos de pago externos/i);
      expect(() => noExternalPayment('Acepto paypal')).toThrow(/métodos de pago externos/i);
      expect(() => noExternalPayment('Hacemos transferencia bancaria')).toThrow(/métodos de pago externos/i);
      expect(() => noExternalPayment('Mejor pago por fuera para evitar líos')).toThrow(/métodos de pago externos/i);
      expect(() => noExternalPayment('Pago externo solamente')).toThrow(/métodos de pago externos/i);
      expect(() => noExternalPayment('Acepto bitcoin')).toThrow(/métodos de pago externos/i);
      expect(() => noExternalPayment('Cobro por verse o revolut')).toThrow(/métodos de pago externos/i);
    });
  });

  describe('validateStory', () => {
    it('returns null for undefined, null, or empty string (optionality RN-01)', () => {
      expect(validateStory(undefined)).toBeNull();
      expect(validateStory(null)).toBeNull();
      expect(validateStory('')).toBeNull();
      expect(validateStory('   ')).toBeNull();
    });

    it('allows and trims valid story of up to 1000 characters', () => {
      const validStory = '  Perteneció a mi abuela y lo usó durante más de cuarenta años en el taller familiar.  ';
      expect(validateStory(validStory)).toBe(
        'Perteneció a mi abuela y lo usó durante más de cuarenta años en el taller familiar.'
      );
    });

    it('allows story with exactly 1000 characters', () => {
      const story1000 = 'a'.repeat(1000);
      expect(validateStory(story1000)).toBe(story1000);
    });

    it('rejects story exceeding 1000 characters', () => {
      const story1001 = 'a'.repeat(1001);
      expect(() => validateStory(story1001)).toThrow(/no puede superar los 1.000 caracteres/i);
    });

    it('rejects non-string values', () => {
      expect(() => validateStory(12345)).toThrow(/debe ser un texto/i);
      expect(() => validateStory({ story: 'test' })).toThrow(/debe ser un texto/i);
    });

    it('rejects contact details in story (AC-04, RN-03)', () => {
      expect(() => validateStory('Si te gusta llámame al 612345678')).toThrow(/No incluyas teléfonos, enlaces/i);
      expect(() => validateStory('Escríbeme a vendedor@correo.es para detalles')).toThrow(/No incluyas teléfonos, enlaces/i);
      expect(() => validateStory('Más fotos en https://mifoto.com/camara')).toThrow(/No incluyas teléfonos, enlaces/i);
      expect(() => validateStory('Háblame por whatsapp para acordar')).toThrow(/No incluyas teléfonos, enlaces/i);
      expect(() => validateStory('Sígueme en instagram @retro_vendedor')).toThrow(/No incluyas teléfonos, enlaces/i);
    });

    it('rejects bargaining and price negotiation in story (AC-04, RN-03)', () => {
      expect(() => validateStory('Acepto regateos si vienes hoy')).toThrow(/no es negociable/i);
      expect(() => validateStory('Te hago una rebaja de 10 euros')).toThrow(/no es negociable/i);
      expect(() => validateStory('Acepto trueque por una guitarra')).toThrow(/no es negociable/i);
      expect(() => validateStory('Mi último precio es de risa')).toThrow(/no es negociable/i);
    });

    it('rejects external payment mentions in story (AC-04, RN-03)', () => {
      expect(() => validateStory('Se envía tras pago por Bizum')).toThrow(/métodos de pago externos/i);
      expect(() => validateStory('Transferencia o PayPal disponible')).toThrow(/métodos de pago externos/i);
    });
  });
});
