import {createClient} from '@supabase/supabase-js';
import {productSlug, extractIdFromSlug} from '@/lib/slugs';
import {getEditionTemporalStatus, getItemAuctionOutcome} from '@/lib/featured-auctions';
import type {AuctionEdition} from '@/types';

export type PublicProfile={alias:string};

export function admin(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})}
export const publicFields='id,seller_id,title,description,story,category,condition,location,images,mode,price_cents,buy_now_cents,shipping_cents,delivery,ends_at,status,bid_count,created_at';
export function fallbackProfile(id:string):PublicProfile{return {alias:`usuario-${id.replace(/-/g,'').slice(0,12)}`}}
export function card(l:any,profile?:PublicProfile,featuredEdition?:any){const seller=profile||fallbackProfile(l.seller_id||l.id);return {id:l.id,slug:productSlug(l.id,l.title),name:l.title,description:l.description,story:l.story||null,has_story:Boolean(l.story),price:l.price_cents/100,type:l.mode,image:l.images[0],detailImage:l.images[0],location:l.location,category:l.category,status:l.status,seller:seller.alias,sellerProfile:seller,buyer:null,bid_count:l.bid_count,auction_ends_at:l.ends_at,updated_at:l.created_at,time:l.created_at,featuredEdition:featuredEdition||l.featuredEdition||undefined}}
export async function profilesById(db:any,ids:string[]){const unique=[...new Set(ids.filter(Boolean))];if(!unique.length)return new Map<string,PublicProfile>();const {data,error}=await db.from('lp_profiles').select('id,alias').in('id',unique);if(error)throw Error('No se han podido cargar los perfiles.');const profiles=new Map<string,PublicProfile>((data||[]).map((p:any)=>[p.id,{alias:p.alias}]));for(const id of unique)if(!profiles.has(id))profiles.set(id,fallbackProfile(id));return profiles}
export async function rpc(name:string,args:Record<string,unknown>={}){const {data,error}=await admin().rpc(name,args);if(error)throw Error(error.message);return data}

export async function getCurrentFeaturedEdition(dbClient?:any,targetEnv?:string):Promise<AuctionEdition|null>{
  const env=targetEnv||(process.env.LAPELA_PAYMENTS_MODE==='simulated'?'sandbox':'live');
  const db=dbClient||admin();
  const {data:editions,error}=await db.from('lp_auction_editions').select('*').eq('environment',env).eq('status','published').order('starts_at',{ascending:true});
  if(error||!editions||!editions.length)return null;
  const now=new Date();
  const active=editions.find((e:any)=>{
    const s=new Date(e.starts_at).getTime(),r=new Date(e.reference_ends_at).getTime(),n=now.getTime();
    return n>=s&&n<r;
  });
  const upcoming=editions.find((e:any)=>new Date(e.starts_at).getTime()>now.getTime());
  const chosen=active||upcoming;
  if(!chosen)return null;

  const {data:items,error:itemsError}=await db.from('lp_auction_edition_items').select(`sort_order,listing:lp_listings(${publicFields})`).eq('edition_id',chosen.id).order('sort_order',{ascending:true});
  if(itemsError||!items)return null;

  const valid=items.filter((it:any)=>it.listing&&it.listing.status==='available'&&it.listing.mode==='auction');
  if(!valid.length)return null;

  const profiles=await profilesById(db,valid.map((it:any)=>it.listing.seller_id));
  const temporalStatus=getEditionTemporalStatus(chosen.starts_at,chosen.reference_ends_at,now);
  const editionMeta={id:chosen.id,slug:chosen.slug,title:chosen.title,status:chosen.status,temporal_status:temporalStatus};

  const products=valid.map((it:any)=>({
    ...card(it.listing,profiles.get(it.listing.seller_id),editionMeta),
    featuredEdition:editionMeta,
    auctionOutcome:getItemAuctionOutcome(it.listing,now),
  }));

  return {
    id:chosen.id,
    slug:chosen.slug,
    title:chosen.title,
    description:chosen.description,
    environment:chosen.environment,
    starts_at:chosen.starts_at,
    reference_ends_at:chosen.reference_ends_at,
    status:chosen.status,
    temporal_status:temporalStatus,
    image_url:chosen.image_url,
    items_count:products.length,
    items:products
  };
}

export async function getAuctionEditionBySlug(slugOrId:string,dbClient?:any,targetEnv?:string,includeDrafts=false):Promise<AuctionEdition|null>{
  const env=targetEnv||(process.env.LAPELA_PAYMENTS_MODE==='simulated'?'sandbox':'live');
  const db=dbClient||admin();
  let query=db.from('lp_auction_editions').select('*').eq('environment',env);
  if(!includeDrafts){
    query=query.eq('status','published');
  }
  if(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId)){
    query=query.or(`id.eq.${slugOrId},slug.eq.${slugOrId}`);
  }else{
    query=query.eq('slug',slugOrId);
  }
  const {data:edition,error}=await query.maybeSingle();
  if(error||!edition)return null;

  const now=new Date();
  const temporalStatus=getEditionTemporalStatus(edition.starts_at,edition.reference_ends_at,now);
  const {data:items,error:itemsError}=await db.from('lp_auction_edition_items').select(`sort_order,listing:lp_listings(${publicFields})`).eq('edition_id',edition.id).order('sort_order',{ascending:true});
  if(itemsError)return null;

  const allListings=(items||[]).map((it:any)=>it.listing).filter(Boolean);
  // RN-05: En ediciones activas o próximas solo se muestran anuncios disponibles en subasta.
  // AC-05: Tras finalizar, se muestran los resultados reales de cada artículo que formó parte.
  const validListings=temporalStatus==='ended'
    ? allListings
    : allListings.filter((l:any)=>l.status==='available'&&l.mode==='auction');

  const profiles=await profilesById(db,validListings.map((l:any)=>l.seller_id));
  const editionMeta={id:edition.id,slug:edition.slug,title:edition.title,status:edition.status,temporal_status:temporalStatus};

  const products=validListings.map((l:any)=>({
    ...card(l,profiles.get(l.seller_id),editionMeta),
    featuredEdition:editionMeta,
    auctionOutcome:getItemAuctionOutcome(l,now),
  }));

  return {
    id:edition.id,
    slug:edition.slug,
    title:edition.title,
    description:edition.description,
    environment:edition.environment,
    starts_at:edition.starts_at,
    reference_ends_at:edition.reference_ends_at,
    status:edition.status,
    temporal_status:temporalStatus,
    image_url:edition.image_url,
    items_count:products.length,
    items:products
  };
}

export async function getListingByIdOrSlug(idOrSlug:string){const id=extractIdFromSlug(idOrSlug);if(!id)return null;const env=process.env.LAPELA_PAYMENTS_MODE==='simulated'?'sandbox':'live';const db=admin();const {data,error}=await db.from('lp_listings').select('*').eq('id',id).maybeSingle();if(error||!data||data.environment!==env)return null;const {data:bids,error:bidsError}=await db.from('lp_bids').select('id,bidder_id,amount_cents,created_at').eq('listing_id',id).order('created_at',{ascending:false}).limit(50);if(bidsError)return null;const profiles=await profilesById(db,[data.seller_id,...(bids||[]).map((b:any)=>b.bidder_id)]);const {seller_id,highest_bidder,...safe}=data;
  let featuredEdition=undefined;
  try{
    const {data:itemLink}=await db.from('lp_auction_edition_items').select('edition:lp_auction_editions!inner(id,slug,title,status,starts_at,reference_ends_at)').eq('listing_id',data.id).eq('edition.status','published').maybeSingle();
    if(itemLink?.edition){
      const ed=itemLink.edition as any;
      featuredEdition={id:ed.id,slug:ed.slug,title:ed.title,status:ed.status,temporal_status:getEditionTemporalStatus(ed.starts_at,ed.reference_ends_at)};
    }
  }catch{}
  return {...safe,seller:profiles.get(seller_id),bids:(bids||[]).map(({bidder_id,...b}:any)=>({...b,bidder:profiles.get(bidder_id)})),slug:productSlug(data.id,data.title),featuredEdition}}

export async function getPublicProfile(alias:string){const db=admin();const normalized=alias.trim().toLowerCase();const {data:profile,error}=await db.from('lp_profiles').select('id,alias,show_purchases,created_at').eq('alias',normalized).maybeSingle();if(error||!profile)return null;const env=process.env.LAPELA_PAYMENTS_MODE==='simulated'?'sandbox':'live';const [activeResult,salesResult,reviewsResult,purchasesResult]=await Promise.all([db.from('lp_listings').select(publicFields).eq('seller_id',profile.id).eq('status','available').eq('environment',env).order('created_at',{ascending:false}).limit(24),db.from('lp_orders').select('id,listing:lp_listings!inner(environment)',{head:true,count:'exact'}).eq('seller_id',profile.id).eq('status','completed').eq('listing.environment',env),db.from('lp_reviews').select('id,author_id,score,comment,created_at,order:lp_orders!inner(id,listing:lp_listings!inner(environment))').eq('recipient_id',profile.id).eq('order.listing.environment',env).order('created_at',{ascending:false}).limit(30),profile.show_purchases?db.from('lp_orders').select('id,listing:lp_listings!inner(id,seller_id,title,description,category,location,images,mode,price_cents,ends_at,status,bid_count,created_at,environment)').eq('buyer_id',profile.id).eq('status','completed').eq('listing.environment',env).order('created_at',{ascending:false}).limit(24):Promise.resolve({data:[]})]);if(activeResult.error||salesResult.error||reviewsResult.error||(purchasesResult as any).error)throw Error('No se ha podido cargar el perfil.');const reviews=reviewsResult.data||[];const purchases=(purchasesResult as any).data||[];const ids=[...reviews.map((r:any)=>r.author_id),...purchases.map((o:any)=>o.listing?.seller_id).filter(Boolean),profile.id];const profiles=await profilesById(db,ids);const scoreCount=reviews.length;const averageScore=scoreCount?Math.round((reviews.reduce((sum:number,r:any)=>sum+r.score,0)/scoreCount)*10)/10:null;return {profile:{alias:profile.alias,memberSince:profile.created_at,showPurchases:profile.show_purchases},stats:{completedSales:salesResult.count||0,averageScore,reviewCount:scoreCount},activeListings:(activeResult.data||[]).map((l:any)=>card(l,profiles.get(profile.id))),purchases:profile.show_purchases?purchases.filter((o:any)=>o.listing).map((o:any)=>card(o.listing,profiles.get(o.listing.seller_id))):[],reviews:reviews.map((r:any)=>({id:r.id,score:r.score,comment:r.comment,created_at:r.created_at,author:profiles.get(r.author_id)}))}}

