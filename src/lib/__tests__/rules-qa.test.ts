import { noBargaining, noContact } from '../rules';

describe('Domain rules for Q&A (LP-FEAT-005)', () => {
  describe('noBargaining', () => {
    it('allows valid product questions regarding state and description', () => {
      expect(noBargaining('¿Viene con caja original y cables?')).toBe('¿Viene con caja original y cables?');
      expect(noBargaining('¿Tiene algún golpe en las esquinas o marcas de uso?')).toBe('¿Tiene algún golpe en las esquinas o marcas de uso?');
      expect(noBargaining('¿De qué año es el modelo?')).toBe('¿De qué año es el modelo?');
      // Legitimate questions with words like "cambio" or "marchas"
      expect(noBargaining('¿Funciona suave el cambio Shimano de la bicicleta?')).toBe('¿Funciona suave el cambio Shimano de la bicicleta?');
      expect(noBargaining('¿Se le ha hecho recientemente algún cambio de batería o pantalla?')).toBe('¿Se le ha hecho recientemente algún cambio de batería o pantalla?');
    });

    it('rejects bargaining attempts and varied negotiation forms', () => {
      expect(() => noBargaining('¿Aceptas regateo?')).toThrow(/no es negociable/);
      expect(() => noBargaining('Te doy 50 euros y me lo llevo')).toThrow(/no es negociable/);
      expect(() => noBargaining('¿Me haces una rebaja?')).toThrow(/no es negociable/);
      expect(() => noBargaining('¿Cuál es tu último precio?')).toThrow(/no es negociable/);
      expect(() => noBargaining('¿Haces algún descuento si recojo hoy?')).toThrow(/no es negociable/);
      expect(() => noBargaining('¿El precio es negociable?')).toThrow(/no es negociable/);
      expect(() => noBargaining('¿Podrías bajar el precio?')).toThrow(/no es negociable/);
      expect(() => noBargaining('¿Me lo dejas en 30 euros?')).toThrow(/no es negociable/);
      expect(() => noBargaining('Déjamelo por 40 y te lo compro ya')).toThrow(/no es negociable/);
      expect(() => noBargaining('Te ofrezco 60€')).toThrow(/no es negociable/);
      expect(() => noBargaining('Te pago 25€ en mano')).toThrow(/no es negociable/);
      expect(() => noBargaining('¿Aceptas cambios por una consola?')).toThrow(/no es negociable/);
      expect(() => noBargaining('¿Haces trueques?')).toThrow(/no es negociable/);
      expect(() => noBargaining('Te lo cambio por un móvil')).toThrow(/no es negociable/);
      expect(() => noBargaining('50€ en mano')).toThrow(/no es negociable/);
    });
  });

  describe('noContact', () => {
    it('allows normal questions without contact info', () => {
      expect(noContact('¿Funciona la batería al 100%?')).toBe('¿Funciona la batería al 100%?');
    });

    it('rejects contact details in questions', () => {
      expect(() => noContact('Escríbeme a test@example.com')).toThrow(/No incluyas teléfonos, enlaces/);
      expect(() => noContact('Mi teléfono es 612345678, llámame')).toThrow(/No incluyas teléfonos, enlaces/);
      expect(() => noContact('Hablamos por whatsapp')).toThrow(/No incluyas teléfonos, enlaces/);
      expect(() => noContact('Búscame en instagram @usuario')).toThrow(/No incluyas teléfonos, enlaces/);
    });
  });
});
