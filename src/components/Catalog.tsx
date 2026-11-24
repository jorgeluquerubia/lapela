'use client';
import {useEffect,useState,type MouseEvent} from 'react';
import {usePathname,useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {Product} from '@/types';
import ProductCard from './ProductCard';
import BrandSpinner from './BrandSpinner';
import FeaturedAuctionSection from './FeaturedAuctionSection';
import {demoProducts} from '@/lib/demo-products';
import ActionDialog from './ActionDialog';
import SavedSearches from './SavedSearches';

interface CatalogProps {
  initialCategory?: string;
  initialMode?: string;
}

export default function Catalog({initialCategory, initialMode}: CatalogProps = {}){
  const params=useSearchParams();
  const pathname=usePathname();
  const q=params.get('q')||'';
  const category=params.get('category')||initialCategory||'Todas';
  const mode=params.get('mode')||initialMode||'all';
  const min=params.get('minPrice')||'';
  const max=params.get('maxPrice')||'';
  const location=params.get('location')||'';
  const defaultSort=q?'relevance':initialMode==='auction'?'ending':'recent';
  const sort=params.get('sort')||defaultSort;
  const page=Math.max(1,Math.min(10000,Number.parseInt(params.get('page')||'1',10)||1));
  const examples=params.get('examples')==='1';
  const [products,setProducts]=useState<Product[]>([]);
  const [count,setCount]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [filters,setFilters]=useState(false);
  const [retry,setRetry]=useState(0);

  function update(changes:Record<string,string>, replace=false) {
    const next=new URLSearchParams(window.location.search);
    if (!('page' in changes)) next.delete('page');
    for (const [name,value] of Object.entries(changes)) {
      if(value) next.set(name,value);
      else next.delete(name);
    }
    const query=next.toString();
    const href=pathname+(query?'?'+query:'');
    if(replace) window.history.replaceState(null,'',href);
    else window.history.pushState(null,'',href);
  }

  function clearFilters() {
    update({category:'',mode:'',minPrice:'',maxPrice:'',location:'',sort:''});
  }

  useEffect(()=>{
    const controller=new AbortController();
    let alive=true;
    setLoading(true);
    setError('');
    const timer=setTimeout(async()=>{
      try{
        if(examples){
          let rows=demoProducts.filter(p=>(category==='Todas'||p.category===category)&&(mode==='all'||p.type===mode)&&(!q||p.name.toLowerCase().includes(q.toLowerCase()))&&(!location||p.location.toLowerCase().includes(location.toLowerCase()))&&(!min||p.price>=Number(min))&&(!max||p.price<=Number(max)));
          if(sort==='price-asc')rows.sort((a,b)=>a.price-b.price);
          if(sort==='price-desc')rows.sort((a,b)=>b.price-a.price);
          setProducts(rows);
          setCount(rows.length);
          return;
        }
        const query=new URLSearchParams({q,category,mode,minPrice:min,maxPrice:max,location,sort,page:String(page)});
        const r=await fetch('/api/products?'+query,{signal:controller.signal});
        if(!r.ok)throw Error('No hemos podido conectar con el catálogo. Puedes reintentarlo o explorar los anuncios de ejemplo.');
        const data=await r.json();
        if(alive){
          setProducts(data.products);
          setCount(data.totalCount||0);
        }
      }catch(e){
        if(alive)setError(e instanceof Error?e.message:'No se pudo cargar el catálogo.');
      }finally{
        if(alive)setLoading(false);
      }
    },250);
    return()=>{
      alive=false;
      clearTimeout(timer);
      controller.abort();
    };
  },[q,category,mode,min,max,location,sort,page,examples,retry]);

  useEffect(()=>{
    if(loading||!products.length)return;
    const position=window.history.state?.lapelaCatalogScroll;
    if(typeof position!=='number')return;
    const frame=window.requestAnimationFrame(()=>{
      window.scrollTo(0,position);
      const state={...window.history.state};
      delete state.lapelaCatalogScroll;
      window.history.replaceState(state,'');
    });
    return ()=>window.cancelAnimationFrame(frame);
  },[loading,products.length]);

  function rememberScroll(event:MouseEvent<HTMLElement>) {
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    if(!(event.target instanceof Element)||!event.target.closest('a[href^="/articulos/"]'))return;
    window.history.replaceState({...window.history.state,lapelaCatalogScroll:window.scrollY},'');
  }

  const categories=['Todas','Tecnología','Hogar','Moda','Deporte','Coleccionismo','Otros'];
  const home=pathname==='/'&&!q&&!initialCategory&&!initialMode;
  const chips=[
    {name:'category',label:category!== (initialCategory||'Todas')?category:''},
    {name:'mode',label:mode!==(initialMode||'all')?(mode==='sale'?'Compra directa':mode==='auction'?'Subastas':'Todo'):''},
    {name:'minPrice',label:min?`Desde ${min} €`:''},
    {name:'maxPrice',label:max?`Hasta ${max} €`:''},
    {name:'location',label:location},
  ].filter(chip=>chip.label);
  const totalLabel=`${count} ${count===1?'artículo':'artículos'}`;

  function filterFields() {
    return <>
      <label>Categoría
        <select value={category} onChange={e=>update({category:e.target.value===(initialCategory||'Todas')?'':e.target.value})}>
          {categories.map(c=><option key={c} value={c}>{c==='Todas'?'Todas las categorías':c}</option>)}
        </select>
      </label>
      <fieldset>
        <legend>Precio</legend>
        <div className="filter-prices">
          <label>Desde <input aria-label="Precio mínimo" placeholder="0 €" type="number" min="0" value={min} onChange={e=>update({minPrice:e.target.value},true)}/></label>
          <label>Hasta <input aria-label="Precio máximo" placeholder="Sin límite" type="number" min="0" value={max} onChange={e=>update({maxPrice:e.target.value},true)}/></label>
        </div>
      </fieldset>
      <label>Ubicación<input className="location" placeholder="Ciudad" value={location} onChange={e=>update({location:e.target.value},true)}/></label>
    </>;
  }

  function changePage(next:number) {
    update({page:next===1?'':String(next)});
    document.getElementById('catalog-results')?.scrollIntoView({block:'start'});
  }

  return <>
    {home&&<section className="market-intro">
      <div className="market-intro-copy">
        <h1>Segunda mano,<br/><em>sin regateos.</em></h1>
        <p>Compra a precio fijo o puja en una subasta.</p>
      </div>
      <div className="market-intro-coin" aria-hidden="true">
        <div className="intro-coin-face"><span>1</span><strong>PESETA</strong><small>LA PELA</small></div>
      </div>
    </section>}

    <div className="catalog-head">
      {home ? <h2>Explorar artículos</h2> : <h1>{q?`Resultados para “${q}”`:initialMode==='auction'?'Subastas':initialCategory||'Buscar artículos'}</h1>}
      {!initialMode&&<div className="mode-tabs" aria-label="Tipo de venta">
        {[['all','Todo'],['sale','Compra directa'],['auction','Subastas']].map(([v,label])=>(
          <button key={v} aria-pressed={mode===v} className={mode===v?'active':''} onClick={()=>update({mode:v==='all'?'':v,...(v!=='auction'&&sort==='ending'?{sort:''}:{})})}>{label}</button>
        ))}
      </div>}
    </div>

    {examples ? <div className="notice"><strong>Catálogo de ejemplo</strong> · Estás viendo anuncios ficticios. <button type="button" onClick={()=>update({examples:''})} className="underline">Volver al catálogo</button></div>
      : <p className="catalog-example-link"><Link href="/subastas?examples=1" className="underline">{initialMode==='auction'?'Ver una subasta de ejemplo':'Explorar subastas de ejemplo'}</Link> · <Link href="/?examples=1" className="underline">Todos los anuncios de ejemplo</Link></p>}
    {examples&&mode==='auction'&&<div className="notice"><strong>La Subasta de la Pela · Edición de ejemplo</strong><p className="m-0">Explora artículos sin pujas, con pujas y adjudicados. Las fichas de muestra no admiten pujas.</p></div>}


    <div className="catalog-layout">
      <aside className="filter-panel catalog-filters" aria-label="Filtros del catálogo">
        {filterFields()}
      </aside>

      <section aria-label="Productos" id="catalog-results" onClickCapture={rememberScroll}>
        <div className="catalog-toolbar">
          <span role="status" className="muted">{loading?'Buscando…':totalLabel}</span>
          <button className="button mobile-filters" aria-haspopup="dialog" onClick={event=>{event.currentTarget.focus();setFilters(true);}}>Filtros{chips.length?` (${chips.length})`:''}</button>
          <select aria-label="Ordenar productos" value={sort} onChange={e=>update({sort:e.target.value===defaultSort?'':e.target.value,...(e.target.value==='ending'&&mode!=='auction'?{mode:'auction'}:{})})}>
            {q&&<option value="relevance">Más relevantes</option>}
            <option value="recent">Más recientes</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
            <option value="ending">Próximos cierres</option>
          </select>
        </div>
        {!examples&&<SavedSearches keyword={q} filters={{category:category==='Todas'?'':category,mode:mode==='all'?'':mode,location,minPrice:min,maxPrice:max}}/>}
        {chips.length>0&&<div className="filter-chips" aria-label="Filtros activos">
          {chips.map(chip=><button type="button" key={chip.name} aria-label={`Quitar filtro ${chip.label}`} onClick={()=>update({[chip.name]:''})}>{chip.label} <span aria-hidden="true">×</span></button>)}
          <button type="button" className="underline" onClick={clearFilters}>Limpiar filtros</button>
        </div>}
        {filters&&<ActionDialog labelledBy="catalog-filter-title" onClose={()=>setFilters(false)}>
          <h2 id="catalog-filter-title">Filtros</h2>
          <div className="catalog-filters">{filterFields()}</div>
          <div className="dialog-actions">
            <button type="button" className="button" onClick={clearFilters}>Limpiar filtros</button>
            <button type="button" className="button primary" data-dialog-focus onClick={()=>setFilters(false)}>{loading?'Ver resultados':`Ver ${totalLabel}`}</button>
          </div>
        </ActionDialog>}

        {error ? (
          <div className="empty-state" role="status">
            <h3>El catálogo no está disponible</h3>
            <p>{error}</p>
            <button className="button primary" onClick={()=>update({examples:'1'})}>Explorar ejemplos</button>
            <button className="button" onClick={()=>{update({examples:''});setRetry(r=>r+1)}}>Reintentar</button>
          </div>
        ) : (
          <>
            {loading && !products.length ? (
              <div className="empty-state py-16" role="status">
                <BrandSpinner size="lg" label="Cargando artículos de La Pela…" />
                <p className="mt-4 font-medium text-stone-600">Buscando los mejores artículos de segunda mano…</p>
              </div>
            ) : (
              <div className={`product-grid ${loading ? 'catalog-grid-updating' : ''}`}>
                {products.map(p=><ProductCard key={p.id} product={p}/>)}
              </div>
            )}

            {!loading&&!products.length&&(
              <div className="empty-state">
                <h3>Aún no hay artículos aquí</h3>
                <p>{q||chips.length?'Prueba otros términos o ajusta los filtros.':'Prueba otra categoría o publica el primer anuncio.'}</p>
                <Link href="/publish-ad" className="button primary">Publicar anuncio</Link>
                <button className="button" onClick={()=>{update({examples:'1',category:'Todas',mode:'all',minPrice:'',maxPrice:'',location:''})}}>Explorar ejemplos</button>
              </div>
            )}

            {!examples&&count>12&&(
              <div className="catalog-toolbar mt-8">
                <button className="button" disabled={page===1} onClick={()=>changePage(page-1)}>Anterior</button>
                <span>Página {page} de {Math.ceil(count/12)}</span>
                <button className="button" disabled={page*12>=count} onClick={()=>changePage(page+1)}>Siguiente</button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
    {!examples&&!q&&!chips.length&&page===1&&(home||initialMode==='auction')&&<FeaturedAuctionSection/>}
  </>;
}
