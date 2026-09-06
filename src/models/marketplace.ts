import {createClient} from '@supabase/supabase-js';
import {productSlug, extractIdFromSlug} from '@/lib/slugs';

export function admin(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})}
export function card(l:any){return {id:l.id,slug:productSlug(l.id,l.title),name:l.title,description:l.description,price:l.price_cents/100,type:l.mode,image:l.images[0],detailImage:l.images[0],location:l.location,category:l.category,status:l.status,user_id:l.seller_id,seller:'Vendedor',buyer:null,bid_count:l.bid_count,auction_ends_at:l.ends_at,updated_at:l.created_at,time:l.created_at}}
export const publicFields='id,title,description,category,condition,location,images,mode,price_cents,buy_now_cents,shipping_cents,delivery,ends_at,status,bid_count,created_at';
export async function rpc(name:string,args:Record<string,unknown>={}){const {data,error}=await admin().rpc(name,args);if(error)throw Error(error.message);return data}

export async function getListingByIdOrSlug(idOrSlug: string) {
  const id = extractIdFromSlug(idOrSlug);
  if (!id) return null;
  const env = process.env.LAPELA_PAYMENTS_MODE === 'simulated' ? 'sandbox' : 'live';
  const { data } = await admin().from('lp_listings').select('*').eq('id', id).maybeSingle();
  if (!data || data.environment !== env) return null;
  return data;
}
