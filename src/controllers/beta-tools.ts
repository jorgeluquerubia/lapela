import {admin} from '@/models/marketplace';
import {categories, text, uuid} from '@/lib/rules';
import {marketplaceEnvironment} from '@/lib/payment-mode';

type Database = ReturnType<typeof admin>;
const reasonLabels = {shipping:'Envío',delivery:'Recogida o entrega',condition:'Estado del artículo'};
const searchFields = 'id,category,mode,location,min_cents,max_cents';
const supportFields = 'id,order_id,reason,details,status,created_at';

function data<T>(response: {data:T;error:unknown}): T {
  if(response.error) throw Error('No se ha podido completar la operación. Inténtalo de nuevo.');
  return response.data;
}

function filterPrice(value:unknown, fallback:number) {
  if(value===undefined||value==='')return fallback;
  if(typeof value!=='string'||!/^\d{1,5}(\.\d{1,2})?$/.test(value))throw Error('Introduce un precio válido.');
  const cents=Math.round(Number(value)*100);
  if(cents>1000000)throw Error('El precio máximo es 10.000 €.');
  return cents;
}

export async function savedSearches(db:Database,userId:string) {
  return data(await db.from('lp_saved_searches').select(searchFields)
    .eq('user_id',userId).eq('environment',marketplaceEnvironment()).order('created_at',{ascending:false}));
}

export async function saveSearch(db:Database,userId:string,body:Record<string,unknown>) {
  const category=categories.includes(String(body.category))?String(body.category):'';
  const mode=body.mode==='sale'||body.mode==='auction'?body.mode:'';
  const location=typeof body.location==='string'?body.location.trim().toLowerCase().slice(0,80):'';
  const min_cents=filterPrice(body.minPrice,0);
  const max_cents=filterPrice(body.maxPrice,1000000);
  if(min_cents>max_cents)throw Error('El precio mínimo debe ser menor o igual al máximo.');
  if(!category&&!mode&&!location&&!min_cents&&max_cents===1000000)throw Error('Elige algún filtro para guardar la búsqueda.');
  return data(await db.from('lp_saved_searches').upsert({
    user_id:userId,environment:marketplaceEnvironment(),category,mode,location,min_cents,max_cents,
  },{onConflict:'user_id,environment,category,mode,location,min_cents,max_cents'}).select(searchFields).single());
}

export async function deleteSearch(db:Database,userId:string,id:string) {
  data(await db.from('lp_saved_searches').delete().eq('id',id).eq('user_id',userId).eq('environment',marketplaceEnvironment()));
  return {success:true};
}

async function ownsOrder(db:Database,userId:string,id:string) {
  return data(await db.from('lp_orders').select('id,listing:lp_listings!inner(environment)')
    .eq('id',id).eq('listing.environment',marketplaceEnvironment())
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`).maybeSingle());
}

export async function orderSupport(db:Database,userId:string,id:string,body?:Record<string,unknown>) {
  if(!await ownsOrder(db,userId,id))return null;
  const tickets=db.from('lp_order_support');
  const ownTickets=()=>tickets.select(supportFields).eq('order_id',id).eq('reporter_id',userId);
  if(!body)return data(await ownTickets().order('created_at',{ascending:false}));

  const {reason}=body;
  if(typeof reason!=='string'||!Object.hasOwn(reasonLabels,reason))throw Error('Selecciona el motivo de la incidencia.');
  const details=text(body.details,10,1000);
  const inserted=data(await tickets.upsert({order_id:id,reporter_id:userId,reason,details},
    {onConflict:'order_id,reporter_id,reason',ignoreDuplicates:true}).select(supportFields).maybeSingle());
  return inserted||data(await ownTickets().eq('reason',reason).single());
}

export async function supportQueue(db:Database,id?:string) {
  const scope='order:lp_orders!inner(listing:lp_listings!inner(environment))';
  if(id){
    if(!uuid(id))throw Error('Incidencia no válida.');
    const ticket=data(await db.from('lp_order_support').select(`id,${scope}`).eq('id',id)
      .eq('order.listing.environment',marketplaceEnvironment()).maybeSingle());
    if(!ticket)throw Error('Incidencia no encontrada.');
    return data(await db.from('lp_order_support').update({status:'resolved'}).eq('id',id).select('id,status').single());
  }
  const rows=data(await db.from('lp_order_support').select(`${supportFields},${scope}`)
    .eq('order.listing.environment',marketplaceEnvironment()).eq('status','open')
    .order('created_at').limit(100));
  return rows?.map(({order,...ticket})=>ticket)||[];
}
