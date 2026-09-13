import {NextResponse} from 'next/server';
import {admin, card} from '@/models/marketplace';
import {categories} from '@/lib/rules';
import {matchingSearchSuggestions, normalizeSearch} from '@/lib/search';

const environment=()=>process.env.LAPELA_PAYMENTS_MODE==='simulated'?'sandbox':'live';
const ok=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
const pageSize=12;

function numberParam(value:string|null, maximum:number) {
  const number=Number(value);
  return Number.isFinite(number)&&number>=0?Math.min(number,maximum):null;
}

function searchParameters(request:Request) {
  const params=new URL(request.url).searchParams;
  const category=params.get('category');
  const mode=params.get('mode');
  const sort=params.get('sort');
  const page=Math.max(1,Math.min(10000,Number.parseInt(params.get('page')||'1')||1));
  return {
    query: normalizeSearch(params.get('q')),
    category: category&&categories.includes(category)?category:null,
    mode: mode==='sale'||mode==='auction'?mode:null,
    minPrice: numberParam(params.get('minPrice'),10000),
    maxPrice: numberParam(params.get('maxPrice'),10000),
    location: normalizeSearch(params.get('location')).slice(0,80)||null,
    sort: ['relevance','recent','price-asc','price-desc','ending'].includes(sort||'')?sort:'relevance',
    page,
  };
}

export async function relevantCatalog(request:Request) {
  try {
    const params=searchParameters(request);
    if(!params.query)return ok({products:[],totalCount:0});
    const {data,error}=await admin().rpc('lp_search_listings',{
      p_query:params.query,
      p_environment:environment(),
      p_category:params.category,
      p_mode:params.mode,
      p_min_price_cents:params.minPrice===null?null:Math.round(params.minPrice*100),
      p_max_price_cents:params.maxPrice===null?null:Math.round(params.maxPrice*100),
      p_location:params.location,
      p_sort:params.sort,
      p_limit:pageSize,
      p_offset:(params.page-1)*pageSize,
    });
    if(error)throw error;
    return ok({products:(data||[]).map(card),totalCount:Number(data?.[0]?.total_count||0)});
  }catch{
    return ok({error:'La búsqueda no está disponible temporalmente.'},503);
  }
}

export async function searchSuggestions(request:Request) {
  const query=normalizeSearch(new URL(request.url).searchParams.get('q'));
  if(query.length<2)return ok({suggestions:[]});
  try{
    const {data,error}=await admin().rpc('lp_search_listings',{
      p_query:query,
      p_environment:environment(),
      p_category:null,
      p_mode:null,
      p_min_price_cents:null,
      p_max_price_cents:null,
      p_location:null,
      p_sort:'relevance',
      p_limit:3,
      p_offset:0,
    });
    if(error)throw error;
    const contextual=matchingSearchSuggestions(query).slice(0,3);
    const products=(data||[]).map((listing:any)=>({
      type:'product' as const,
      label:listing.title,
      detail:`${(listing.price_cents/100).toLocaleString('es-ES',{style:'currency',currency:'EUR'})} · ${listing.location}`,
      slug:card(listing).slug,
    }));
    return ok({suggestions:[...contextual,...products].slice(0,6)});
  }catch{
    return ok({suggestions:[]});
  }
}
