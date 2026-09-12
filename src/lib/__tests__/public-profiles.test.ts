jest.mock('@supabase/supabase-js',()=>({createClient:jest.fn()}));

import {card, fallbackProfile} from '@/models/marketplace';
import {publicAlias} from '@/lib/rules';

describe('identidad pública',()=>{
  it('normaliza un alias apto para URL',()=>{
    expect(publicAlias('  Ana_Vende-2 ')).toBe('ana_vende-2');
  });

  it.each(['ab','usuario-123456789012','ana@example.com','ana vende','ana/venta','-ana','_ana','a'.repeat(31)])('rechaza alias no públicos: %s',(alias)=>{
    expect(()=>publicAlias(alias)).toThrow('El alias debe tener');
  });

  it('acepta alias válidos en los límites de 3 y 30 caracteres',()=>{
    expect(publicAlias('abc')).toBe('abc');
    expect(publicAlias('a-1')).toBe('a-1');
    expect(publicAlias('a_1')).toBe('a_1');
    expect(publicAlias('a'.repeat(30))).toBe('a'.repeat(30));
  });

  it('genera un alias temporal opaco y no expone el identificador en una tarjeta',()=>{
    const identity=fallbackProfile('123e4567-e89b-12d3-a456-426614174000');
    const listing={id:'123e4567-e89b-42d3-a456-426614174000',seller_id:'123e4567-e89b-12d3-a456-426614174000',title:'Cámara réflex usada',description:'Cámara en buen estado con objetivo incluido.',price_cents:12000,mode:'sale',images:['https://example.com/camera.jpg'],location:'Madrid',category:'Tecnología',status:'available',bid_count:0,ends_at:null,created_at:'2026-09-11T10:00:00.000Z'};
    expect(identity.alias).toBe('usuario-123e4567e89b');
    const c=card(listing,identity);
    expect(c).toMatchObject({seller:'usuario-123e4567e89b',sellerProfile:identity});
    expect(c).not.toHaveProperty('seller_id');
    expect(c).not.toHaveProperty('user_id');
    expect(c).not.toHaveProperty('buyer_id');
    expect(c).not.toHaveProperty('raw_user_meta_data');
  });

  it('proyecta story y has_story correctamente en las tarjetas de producto (AC-02, AC-03)', () => {
    const identity=fallbackProfile('123e4567-e89b-12d3-a456-426614174000');
    const baseListing={id:'123e4567-e89b-42d3-a456-426614174000',seller_id:'123e4567-e89b-12d3-a456-426614174000',title:'Cámara réflex usada',description:'Cámara en buen estado con objetivo incluido.',price_cents:12000,mode:'sale',images:['https://example.com/camera.jpg'],location:'Madrid',category:'Tecnología',status:'available',bid_count:0,ends_at:null,created_at:'2026-09-11T10:00:00.000Z'};

    const withStory = card({...baseListing, story: 'Comprada en 2018 para viajar.'}, identity);
    expect(withStory.has_story).toBe(true);
    expect(withStory.story).toBe('Comprada en 2018 para viajar.');

    const withoutStory = card({...baseListing, story: null}, identity);
    expect(withoutStory.has_story).toBe(false);
    expect(withoutStory.story).toBeNull();
  });
});
