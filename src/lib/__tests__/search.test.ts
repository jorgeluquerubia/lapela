import {availableTags, matchingSearchSuggestions, normalizeSearch, normalizeTags} from '../search';

describe('search vocabulary',()=>{
  it('normalizes accents and whitespace before looking up terms',()=>{
    expect(normalizeSearch('  Televisión  Samsung  ')).toBe('television samsung');
  });

  it('only accepts the controlled tags for a category',()=>{
    expect(normalizeTags('Tecnología',['TV','Cámara'])).toEqual(['tv','camara']);
    expect(()=>normalizeTags('Moda',['tv'])).toThrow('etiquetas sugeridas');
    expect(availableTags('Tecnología')).toContain('televisión');
  });

  it('offers approved aliases after two characters',()=>{
    expect(matchingSearchSuggestions('te')).toContainEqual(expect.objectContaining({type:'query',label:'TV y televisores'}));
    expect(matchingSearchSuggestions('t')).toEqual([]);
  });
});
