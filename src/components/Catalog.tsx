'use client';
import {useEffect,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {Product} from '@/types';
import ProductCard from './ProductCard';
import BrandSpinner from './BrandSpinner';
import {demoProducts} from '@/lib/demo-products';
import {categoryToSlug, slugify} from '@/lib/slugs';

interface CatalogProps {
  initialCategory?: string;
  initialMode?: string;
}

export default function Catalog({initialCategory, initialMode}: CatalogProps = {}){
  const params=useSearchParams();
  const q=params.get('q')||'';
  const [category,setCategory]=useState(initialCategory||params.get('category')||'Todas');
  const [mode,setMode]=useState(initialMode||params.get('mode')||'all');
  const [min,setMin]=useState('');
  const [max,setMax]=useState('');
  const [location,setLocation]=useState('');
  const [sort,setSort]=useState('recent');
  const [products,setProducts]=useState<Product[]>([]);
  const [count,setCount]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [examples,setExamples]=useState(params.get('examples')==='1');
  const [filters,setFilters]=useState(false);
  const [page,setPage]=useState(1);
  const [retry,setRetry]=useState(0);

  useEffect(()=>{
    setCategory(initialCategory||params.get('category')||'Todas');
    setMode(initialMode||params.get('mode')||'all');
    setPage(1);
  },[params, initialCategory, initialMode]);

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

  const categories=['Todas','Tecnología','Hogar','Moda','Deporte','Coleccionismo','Otros'];

  return <>
    <section className="market-intro">
      <div>
        <h1>Segunda mano.<br/>Sin segundas negociaciones.</h1>
        <p>Encuentra lo que buscas. Compra a precio cerrado o puja por ello.</p>
      </div>
      <div className="intro-note">
        <strong>Tu tiempo también vale.</strong>
        El chat se abre después de comprar. Solo queda acordar la entrega.
      </div>
    </section>

    <div className="catalog-head">
      <div>
        <h2>{q?`Resultados para “${q}”`:'Tu próximo gran hallazgo'}</h2>
        <span className="muted">Cosas con mucho por delante.</span>
      </div>
      <div className="mode-tabs" aria-label="Tipo de venta">
        {[['all','Todo'],['sale','Compra directa'],['auction','Subastas']].map(([v,label])=>(
          <button key={v} aria-pressed={mode===v} className={mode===v?'active':''} onClick={()=>{setMode(v);setPage(1)}}>{label}</button>
        ))}
      </div>
    </div>

    {examples&&<div className="notice">Catálogo de ejemplo · Fotografías ilustrativas, sin artículos a la venta ni operaciones reales. <button onClick={()=>setExamples(false)} className="underline">Volver al catálogo</button></div>}

    <div className="catalog-layout">
      <aside className={`filter-panel ${filters?'open':''}`} aria-label="Filtros">
        <h3>Categorías</h3>
        {categories.map(c=>{
          const targetHref = c === 'Todas' ? '/' : `/categoria/${categoryToSlug[c] || slugify(c)}`;
          const isActive = category === c;
          return (
            <Link
              key={c}
              href={targetHref}
              className={`category-button ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => {
                setCategory(c);
                setPage(1);
              }}
            >
              {c === 'Todas' ? 'Todos los artículos' : c}
            </Link>
          );
        })}

        <h3>Precio</h3>
        <div className="filter-prices">
          <input aria-label="Precio mínimo" placeholder="Desde €" type="number" min="0" value={min} onChange={e=>{setMin(e.target.value);setPage(1)}}/>
          <input aria-label="Precio máximo" placeholder="Hasta €" type="number" min="0" value={max} onChange={e=>{setMax(e.target.value);setPage(1)}}/>
        </div>

        <h3>Ubicación</h3>
        <input className="location" aria-label="Ubicación" placeholder="Ciudad" value={location} onChange={e=>{setLocation(e.target.value);setPage(1)}}/>

        <div className="filter-note">
          <strong>Un trato claro.</strong>
          <p>Sin “¿me lo dejas por menos?”. Elige, compra y sigue con tu día.</p>
          <Link href="/como-funciona" className="underline">Cómo funciona ↗</Link>
        </div>
      </aside>

      <section aria-label="Productos">
        <div className="catalog-toolbar">
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="catalog-updating-banner" role="status">
                <BrandSpinner size="sm" label="Actualizando catálogo" />
                <span>Buscando artículos…</span>
              </div>
            ) : (
              <span className="muted">{`${count} artículos${category!=='Todas'?' en '+category:''}`}</span>
            )}
          </div>
          <button className="button mobile-filters" aria-expanded={filters} onClick={()=>setFilters(!filters)}>Filtros</button>
          <select aria-label="Ordenar productos" value={sort} onChange={e=>{setSort(e.target.value);setPage(1)}}>
            <option value="recent">Más recientes</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="ending">Subastas que terminan</option>
          </select>
        </div>

        {error ? (
          <div className="empty-state" role="status">
            <h3>El catálogo no está disponible</h3>
            <p>{error}</p>
            <button className="button primary" onClick={()=>setExamples(true)}>Explorar ejemplos</button>
            <button className="button" onClick={()=>{setExamples(false);setRetry(r=>r+1)}}>Reintentar</button>
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
                <p>Prueba otra categoría o publica el primer anuncio.</p>
                <Link href="/publish-ad" className="button primary">Publicar anuncio</Link>
                <button className="button" onClick={()=>{setExamples(true);setCategory('Todas');setMin('');setMax('');setLocation('')}}>Explorar ejemplos</button>
              </div>
            )}

            {!examples&&count>12&&(
              <div className="catalog-toolbar mt-8">
                <button className="button" disabled={page===1} onClick={()=>setPage(page-1)}>Anterior</button>
                <span>Página {page} de {Math.ceil(count/12)}</span>
                <button className="button" disabled={page*12>=count} onClick={()=>setPage(page+1)}>Siguiente</button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  </>;
}
