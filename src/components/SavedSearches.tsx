'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {api} from '@/lib/api';
import {money} from '@/lib/rules';
import {useAuth} from '@/context/AuthContext';

type Filters={category:string;mode:string;location:string;minPrice:string;maxPrice:string};
type Saved={id:string;category:string;mode:string;location:string;min_cents:number;max_cents:number};

function savedLink(item:Saved){
  const query=new URLSearchParams();
  if(item.category)query.set('category',item.category);
  if(item.mode)query.set('mode',item.mode);
  if(item.location)query.set('location',item.location);
  if(item.min_cents)query.set('minPrice',String(item.min_cents/100));
  if(item.max_cents<1000000)query.set('maxPrice',String(item.max_cents/100));
  return '/?'+query;
}

function formatSaved(item:Saved){
  return [item.category,
    item.mode==='auction'?'Subastas':item.mode==='sale'?'Compra directa':'',
    item.location,
    item.min_cents?'Desde '+money(item.min_cents):'',
    item.max_cents<1000000?'Hasta '+money(item.max_cents):'',
  ].filter(Boolean).join(' · ');
}

export default function SavedSearches({filters,keyword}:{filters:Filters;keyword:string}){
  const {user}=useAuth();
  if(!user)return null;
  return <SearchPanel key={user.id} filters={filters} keyword={keyword}/>;
}

function SearchPanel({filters,keyword}:{filters:Filters;keyword:string}){
  const [open,setOpen]=useState(false);
  const [saved,setSaved]=useState<Saved[]|null>(null);
  const [notice,setNotice]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const canSave=!keyword.trim()&&Boolean(filters.category||filters.mode||filters.location.trim()||filters.minPrice||filters.maxPrice);

  useEffect(()=>{
    if(!open)return;
    let active=true;
    api('saved-searches').then(rows=>{if(active)setSaved(rows);})
      .catch(e=>{if(active)setError(e.message);});
    return ()=>{active=false;};
  },[open]);

  async function change(id?:string){
    setBusy(true);
    setError('');
    setNotice('');
    try{
      if(id){
        await api('remove-saved-search/'+id,{});
        setSaved(rows=>rows?.filter(row=>row.id!==id)||[]);
        setNotice('Búsqueda eliminada.');
      }else{
        const row:Saved=await api('saved-searches',filters);
        setSaved(rows=>[row,...(rows||[]).filter(item=>item.id!==row.id)]);
        setNotice('Búsqueda guardada. Verás las coincidencias nuevas en Novedades.');
      }
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }

  return <section className="saved-searches" aria-label="Búsquedas guardadas">
    <button type="button" className="button" aria-expanded={open} onClick={()=>{setError('');setOpen(value=>!value);}}>Búsquedas guardadas</button>
    {open&&<div className="saved-search-panel">
      <p>Recibe un aviso cuando se publique un artículo que coincida con tus filtros.</p>
      {keyword.trim()&&<p className="muted">Para guardar filtros, abre el catálogo sin palabras de búsqueda.</p>}
      <button className="button" type="button" disabled={busy||!canSave||saved===null} onClick={()=>change()}>Guardar estos filtros</button>
      {notice&&<p role="status">{notice}</p>}
      {error&&<p role="alert" className="error-message">{error}</p>}
      {saved?.length===0&&<p className="muted">Aún no tienes búsquedas guardadas.</p>}
      {Boolean(saved?.length)&&<ul className="beta-task-list mt-3">
        {saved?.map(item=><li key={item.id}><Link href={savedLink(item)} className="underline">{formatSaved(item)}</Link>
          <button type="button" className="button" disabled={busy} aria-label={'Eliminar búsqueda · '+formatSaved(item)} onClick={()=>change(item.id)}>Eliminar</button></li>)}
      </ul>}
    </div>}
  </section>;
}
