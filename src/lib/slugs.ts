import {categories} from './rules';

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

export function productSlug(id: string, title: string): string {
  const clean = slugify(title);
  return clean ? `${clean}-${id}` : id;
}

export function extractIdFromSlug(slug: string): string {
  if (!slug) return '';
  // Check for standard UUID at the end or exact match
  const uuidMatch = slug.match(/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i);
  if (uuidMatch) return uuidMatch[1];

  // Check for demo product ids (e.g. demo-1, ejemplo-1, or slugified ejemplo-auriculares-...-demo-1)
  const demoMatch = slug.match(/(demo-\d+|ejemplo-\d+)$/i);
  if (demoMatch) return demoMatch[1];

  return slug;
}

export const categoryToSlug: Record<string, string> = {
  Tecnología: 'tecnologia',
  Hogar: 'hogar',
  Moda: 'moda',
  Deporte: 'deporte',
  Coleccionismo: 'coleccionismo',
  Otros: 'otros',
};

export const slugToCategory: Record<string, string> = Object.fromEntries(
  Object.entries(categoryToSlug).map(([name, slug]) => [slug, name])
);

export function isCategorySlug(slug: string): boolean {
  return slug in slugToCategory;
}

export function getCategorySlug(categoryName: string): string {
  return categoryToSlug[categoryName] || slugify(categoryName);
}
