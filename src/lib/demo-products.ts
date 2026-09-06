import {Product} from '@/types';
import {slugify, extractIdFromSlug} from './slugs';

const photos=['photo-1585298723682-7115561c51b7','photo-1580744996977-bcb703315d8a','photo-1746087867515-e676cb795991','photo-1707050494089-7a69b3a2f738','photo-1569546494896-62e7c30b8aab','photo-1607983859015-f8f6ebcac397'];
const items=[['Auriculares inalámbricos negros',85,'Tecnología','Madrid','sale'],['Cámara réflex con objetivo',180,'Tecnología','Barcelona','auction'],['Silla de diseño naranja',65,'Hogar','Valencia','sale'],['Bicicleta urbana roja',120,'Deporte','Sevilla','sale'],['Nintendo Switch con mandos',95,'Tecnología','Bilbao','auction'],['Zapatillas blancas · Talla 42',35,'Moda','Madrid','sale']] as const;

export const demoProducts:Product[]=items.map(([name,price,category,location,type],i)=>({
  id:`demo-${i+1}`,
  slug:`ejemplo-${slugify(name)}-demo-${i+1}`,
  name,
  price,
  category,
  location,
  type,
  image:`https://images.unsplash.com/${photos[i]}?auto=format&fit=crop&w=900&q=85`,
  description:'Anuncio de ejemplo para explorar La Pela. La fotografía es ilustrativa. Este artículo no está a la venta.',
  seller:'Perfil de ejemplo',
  user_id:'demo-seller',
  status:'available',
  buyer:null,
  time:'',
  updated_at:'2026-09-06T00:00:00Z',
  bid_count:0
}));

export const isDemoProduct=(id:string)=>id.startsWith('demo-')||id.startsWith('ejemplo-');

export const findDemoProduct=(slugOrId:string)=>{
  if (!slugOrId) return undefined;
  const targetId = extractIdFromSlug(slugOrId);
  return demoProducts.find(p => p.id === targetId || p.slug === slugOrId || p.id === slugOrId || slugOrId.endsWith(p.id)) ||
    demoProducts.find(p => p.slug?.startsWith(slugOrId));
};
