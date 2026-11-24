import {Product} from '@/types';
import {slugify, extractIdFromSlug} from './slugs';

const photos=['photo-1585298723682-7115561c51b7','photo-1580744996977-bcb703315d8a','photo-1746087867515-e676cb795991','photo-1707050494089-7a69b3a2f738','photo-1569546494896-62e7c30b8aab','photo-1607983859015-f8f6ebcac397'];
const items=[['Auriculares inalámbricos negros',85,'Tecnología','Madrid','sale'],['Cámara réflex con objetivo',180,'Tecnología','Barcelona','auction'],['Silla de diseño naranja',65,'Hogar','Valencia','sale'],['Bicicleta urbana roja',120,'Deporte','Sevilla','sale'],['Nintendo Switch con mandos',95,'Tecnología','Bilbao','auction'],['Zapatillas blancas · Talla 42',35,'Moda','Madrid','sale']] as const;

const stories: Record<number, string> = {
  1: 'La compré en un anticuario del Rastro en 2018 para restaurarla durante las tardes de lluvia. Conserva el cuerpo mecánico impecable y ha recorrido media Europa conmigo en viajes de tren. La vendo porque he pasado a formato medio y merece seguir disparando fotos.',
};

const pilotExamples: Product[] = [
  {name:'Radio portátil Bruma', price:25, category:'Tecnología', location:'Madrid', type:'sale', photo:'radio', description:'Radio portátil con carcasa de baquelita y dial analógico. Incluye cable de alimentación. Tiene pequeñas marcas en la esquina inferior.', delivery:'pickup', condition:'Con señales de uso'},
  {name:'Lámpara de cerámica Ámbar', price:39.5, category:'Hogar', location:'Valencia', type:'sale', photo:'lamp', description:'Base de cerámica esmaltada y pantalla de tela. Mide 42 cm de alto. La pantalla conserva una pequeña marca en la parte trasera.', delivery:'shipping', condition:'Buen estado'},
  {name:'Mochila de montaña Abeto', price:24, category:'Deporte', location:'Bilbao', type:'auction', photo:'backpack', description:'Mochila de 25 litros con respaldo ventilado y funda para lluvia. Las cremalleras funcionan y hay desgaste en una hebilla.', delivery:'shipping', condition:'Buen estado', bid_count:3, demoAuction:'En curso · cierra primero'},
  {name:'Avión de hojalata Órbita', price:28, category:'Coleccionismo', location:'Sevilla', type:'auction', photo:'plane', description:'Avión de hojalata pintada con hélice móvil. Conserva marcas de uso en las alas y se vende como pieza de colección.', delivery:'pickup', condition:'Con señales de uso', bid_count:0, demoAuction:'En curso · sin pujas'},
  {name:'Abrigo de lana Granate', price:48, category:'Moda', location:'Barcelona', type:'sale', photo:'coat', description:'Abrigo de lana de corte recto, talla M. Forro íntegro y botones originales. Medidas en plano: 51 cm de pecho y 92 cm de largo.', delivery:'shipping', condition:'Buen estado'},
  {name:'Robot explorador lunar', price:44, category:'Coleccionismo', location:'Granada', type:'auction', photo:'rover', description:'Vehículo espacial de juguete con ruedas articuladas. Tiene una marca de pintura en el lateral y conserva la antena original.', delivery:'shipping', condition:'Con señales de uso', bid_count:6, demoAuction:'Finalizada · adjudicada', status:'expired'},
].map(({photo,...item}, index)=>({
  ...item, id:`demo-${index+7}`, slug:`ejemplo-${slugify(item.name)}-demo-${index+7}`, image:`/ejemplos/${photo}.jpg`,
  seller:'Perfil de ejemplo', buyer:null, time:'', updated_at:'2026-11-24T00:00:00Z', status:item.status||'available',
})) as Product[];

export const demoProducts:Product[]=items.map<Product>(([name,price,category,location,type],i)=>({
  id:`demo-${i+1}`,
  slug:`ejemplo-${slugify(name)}-demo-${i+1}`,
  name,
  price,
  category,
  location,
  type,
  image:`https://images.unsplash.com/${photos[i]}?auto=format&fit=crop&w=900&q=85`,
  description:'Anuncio de ejemplo para explorar La Pela. La fotografía es ilustrativa. Este artículo no está a la venta.',
  story: stories[i] || null,
  has_story: Boolean(stories[i]),
  seller:'Perfil de ejemplo',
  user_id:'demo-seller',
  status:'available',
  buyer:null,
  time:'',
  updated_at:'2026-09-06T00:00:00Z',
  bid_count:0
})).concat(pilotExamples);

export const isDemoProduct=(id:string)=>id.startsWith('demo-')||id.startsWith('ejemplo-');

export const findDemoProduct=(slugOrId:string)=>{
  if (!slugOrId) return undefined;
  const targetId = extractIdFromSlug(slugOrId);
  return demoProducts.find(p => p.id === targetId || p.slug === slugOrId || p.id === slugOrId) ||
    demoProducts.find(p => p.slug?.startsWith(slugOrId));
};
