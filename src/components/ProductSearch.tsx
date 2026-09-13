'use client';

import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';

type Suggestion={type:'query'|'category'|'product';label:string;query?:string;detail?:string;slug?:string};

export default function ProductSearch(){
  const router=useRouter();
  const [query,setQuery]=useState('');
  const [suggestions,setSuggestions]=useState<Suggestion[]>([]);
  const [open,setOpen]=useState(false);
  const [activeIndex,setActiveIndex]=useState(-1);
  const blurTimer=useRef<number|null>(null);

  useEffect(()=>{
    const trimmed=query.trim();
    if(trimmed.length<2){setSuggestions([]);setOpen(false);setActiveIndex(-1);return}
    const controller=new AbortController();
    const timer=window.setTimeout(async()=>{
      try{
        const response=await fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmed)}`,{signal:controller.signal});
        const data=await response.json();
        if(!controller.signal.aborted){setSuggestions(Array.isArray(data.suggestions)?data.suggestions:[]);setOpen(true);setActiveIndex(-1)}
      }catch{if(!controller.signal.aborted){setSuggestions([]);setOpen(false)}}
    },180);
    return()=>{controller.abort();window.clearTimeout(timer)};
  },[query]);

  function showAll(value=query){const search=value.trim();if(search)router.push(`/search?q=${encodeURIComponent(search)}`);setOpen(false)}
  function choose(suggestion:Suggestion){
    if(suggestion.type==='product'&&suggestion.slug)router.push(`/articulos/${suggestion.slug}`);
    else if(suggestion.type==='category')router.push(`/search?q=${encodeURIComponent(suggestion.query||suggestion.label)}&category=${encodeURIComponent(suggestion.label)}`);
    else showAll(suggestion.query||suggestion.label);
    setOpen(false);
  }
  function onKeyDown(event:React.KeyboardEvent<HTMLInputElement>){
    if(event.key==='ArrowDown'&&open&&suggestions.length){event.preventDefault();setActiveIndex(index=>Math.min(index+1,suggestions.length-1));}
    else if(event.key==='ArrowUp'&&open&&suggestions.length){event.preventDefault();setActiveIndex(index=>Math.max(index-1,0));}
    else if(event.key==='Escape'){setOpen(false);setActiveIndex(-1)}
    else if(event.key==='Enter'&&open&&activeIndex>=0){event.preventDefault();choose(suggestions[activeIndex]);}
  }

  return <div className="global-search-wrap">
    <form className="global-search" role="search" onSubmit={event=>{event.preventDefault();showAll()}}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/></svg>
      <input aria-label="Buscar productos" aria-autocomplete="list" aria-controls="product-search-suggestions" aria-expanded={open} aria-activedescendant={activeIndex>=0?`search-suggestion-${activeIndex}`:undefined} role="combobox" placeholder="¿Qué estás buscando?" value={query} onFocus={()=>{if(query.trim().length>=2)setOpen(true)}} onBlur={()=>{blurTimer.current=window.setTimeout(()=>setOpen(false),120)}} onKeyDown={onKeyDown} onChange={event=>setQuery(event.target.value)}/>
      <button aria-label="Buscar" type="submit">↵</button>
    </form>
    {open&&<div id="product-search-suggestions" className="search-suggestions" role="listbox" aria-label="Sugerencias de búsqueda">
      {suggestions.map((suggestion,index)=><button key={`${suggestion.type}-${suggestion.label}`} id={`search-suggestion-${index}`} type="button" role="option" aria-selected={activeIndex===index} className={activeIndex===index?'active':''} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(suggestion)}><span><strong>{suggestion.label}</strong>{suggestion.detail&&<small>{suggestion.detail}</small>}</span><em>{suggestion.type==='product'?'Artículo':suggestion.type==='category'?'Categoría':'Sugerencia'}</em></button>)}
      <button type="button" className="search-all-results" onMouseDown={event=>event.preventDefault()} onClick={()=>showAll()}>Ver todos los resultados para «{query.trim()}»</button>
    </div>}
  </div>;
}
