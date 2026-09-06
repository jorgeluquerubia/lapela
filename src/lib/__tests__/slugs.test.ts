import {slugify, productSlug, extractIdFromSlug, categoryToSlug, slugToCategory, isCategorySlug, getCategorySlug} from '../slugs';

describe('slugs utility', () => {
  describe('slugify', () => {
    it('normalizes accents, spaces, and punctuation to hyphens', () => {
      expect(slugify('Bicicleta de montaña & accesorios')).toBe('bicicleta-de-montana-accesorios');
      expect(slugify('Cámara réflex con objetivo')).toBe('camara-reflex-con-objetivo');
      expect(slugify('Tecnología')).toBe('tecnologia');
    });

    it('handles empty or special strings', () => {
      expect(slugify('')).toBe('');
      expect(slugify('---hello---world---')).toBe('hello-world');
    });
  });

  describe('productSlug', () => {
    it('combines slugified title and id', () => {
      const id = '12345678-1234-4234-8234-123456789abc';
      const slug = productSlug(id, 'Auriculares inalámbricos Sony');
      expect(slug).toBe('auriculares-inalambricos-sony-12345678-1234-4234-8234-123456789abc');
    });

    it('falls back to id if title produces empty slug', () => {
      expect(productSlug('some-id', '???')).toBe('some-id');
    });
  });

  describe('extractIdFromSlug', () => {
    it('extracts uuid from end of composite slug', () => {
      const uuid = '12345678-1234-4234-8234-123456789abc';
      const slug = `auriculares-inalambricos-sony-${uuid}`;
      expect(extractIdFromSlug(slug)).toBe(uuid);
    });

    it('returns raw uuid if passed directly', () => {
      const uuid = '12345678-1234-4234-8234-123456789abc';
      expect(extractIdFromSlug(uuid)).toBe(uuid);
    });

    it('extracts demo ids', () => {
      expect(extractIdFromSlug('ejemplo-auriculares-demo-1')).toBe('demo-1');
      expect(extractIdFromSlug('demo-2')).toBe('demo-2');
    });
  });

  describe('category mapping', () => {
    it('maps all categories bidirectionally', () => {
      expect(categoryToSlug['Tecnología']).toBe('tecnologia');
      expect(slugToCategory['tecnologia']).toBe('Tecnología');
      expect(isCategorySlug('tecnologia')).toBe(true);
      expect(isCategorySlug('invalid')).toBe(false);
      expect(getCategorySlug('Hogar')).toBe('hogar');
    });
  });
});
