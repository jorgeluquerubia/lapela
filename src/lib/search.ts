import {categories} from './rules';

export const tagsByCategory: Record<string, readonly string[]> = {
  Tecnología: ['tv', 'televisión', 'móvil', 'smartphone', 'ordenador', 'portátil', 'consola', 'nintendo', 'playstation', 'xbox', 'audio', 'auriculares', 'cámara'],
  Hogar: ['mueble', 'silla', 'mesa', 'lámpara', 'decoración', 'cocina', 'electrodoméstico', 'jardín'],
  Moda: ['zapatillas', 'zapatos', 'ropa', 'bolso', 'reloj', 'talla', 'vintage'],
  Deporte: ['bicicleta', 'running', 'fitness', 'fútbol', 'montaña', 'raqueta', 'patinete'],
  Coleccionismo: ['vinilo', 'cómic', 'figura', 'cartas', 'retro', 'antigüedad'],
  Otros: ['libro', 'juguete', 'instrumento', 'mascota'],
};

export const searchAliases = [
  {label: 'TV y televisores', terms: ['tele', 'tv', 'televisor', 'televisión']},
  {label: 'Móviles y smartphones', terms: ['móvil', 'movil', 'teléfono', 'telefono', 'smartphone']},
  {label: 'Bicicletas', terms: ['bici', 'bicicleta']},
  {label: 'Auriculares', terms: ['cascos', 'auriculares']},
  {label: 'Nintendo Switch', terms: ['switch', 'nintendo']},
  {label: 'Zapatillas', terms: ['zapas', 'zapatillas']},
] as const;

export function normalizeSearch(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-ES')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

export function availableTags(category: string) {
  return tagsByCategory[category] ?? [];
}

export function normalizeTags(category: unknown, value: unknown) {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(availableTags(String(category)).map(normalizeSearch));
  const tags = [...new Set(value.map(normalizeSearch).filter(Boolean))];
  if (tags.length > 5 || tags.some(tag => !allowed.has(tag))) {
    throw Error('Elige hasta cinco etiquetas sugeridas para la categoría del artículo.');
  }
  return tags;
}

export function matchingSearchSuggestions(query: string) {
  const normalized = normalizeSearch(query);
  if (normalized.length < 2) return [];
  const aliasSuggestions = searchAliases
    .filter(group => group.terms.some(term => normalizeSearch(term).includes(normalized)))
    .map(group => ({type: 'query' as const, label: group.label, query: group.terms[0]}));
  const categorySuggestions = categories
    .filter(category => normalizeSearch(category).includes(normalized))
    .map(category => ({type: 'category' as const, label: category, query: category}));
  return [...aliasSuggestions, ...categorySuggestions];
}
