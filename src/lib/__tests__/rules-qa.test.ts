import { noBargaining, noContact } from '../rules';

describe('Domain rules for Q&A (LP-FEAT-005)', () => {
  describe('noBargaining', () => {
    it('allows valid product questions regarding state and description', () => {
      expect(noBargaining('¿Viene con caja original y cables?')).toBe('¿Viene con caja original y cables?');
      expect(noBargaining('¿Tiene algún golpe en las esquinas o marcas de uso?')).toBe('¿Tiene algún golpe en las esquinas o marcas de uso?');
      expect(noBargaining('¿De qué año es el modelo?')).toBe('¿De qué año es el modelo?');
    });

    it('rejects bargaining attempts', () => {
      expect(() => noBargaining('¿Aceptas regateo?')).toThrow(/no es negociable/);
      expect(() => noBargaining('Te doy 50 euros y me lo llevo')).toThrow(/no es negociable/);
      expect(() => noBargaining('¿Me haces una rebaja?')).toThrow(/no es negociable/);
      expect(() => noBargaining('¿Cuál es tu último precio?')).toThrow(/no es negociable/);
      expect(() => noBargaining('¿Haces algún descuento si recojo hoy?')).toThrow(/no es negociable/);
      expect(() => noBargaining('¿El precio es negociable?')).toThrow(/no es negociable/);
      expect(() => noBargaining('¿Podrías bajar el precio?')).toThrow(/no es negociable/);
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
