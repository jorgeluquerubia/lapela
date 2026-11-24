'use client';

import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {useAuth} from '@/context/AuthContext';
import {api} from '@/lib/api';
import {categories,conditions,validateStory} from '@/lib/rules';
import {availableTags} from '@/lib/search';
import {productSlug} from '@/lib/slugs';
import {normalizeListingImage} from '@/lib/image-processing';

const blankDraft = {title:'', description:'', price:'', category:categories[0], mode:'sale'};

export default function Publish(){
  const {user,loading}=useAuth();
  if(loading)return <p>Cargando cuenta…</p>;
  if(!user)return <section className="empty-state"><h1>Publicar un artículo</h1><p>Entra en tu cuenta para publicar.</p><Link href="/login?next=/publish-ad" className="button primary">Entrar</Link><Link href="/register" className="button">Crear cuenta</Link></section>;
  return <PublishForm key={user.id} userId={user.id}/>;
}

function PublishForm({userId}:{userId:string}){
  const router=useRouter();
  const draftKey='lapela:listing-draft:v1:'+userId;
  const [draft,setDraft]=useState(blankDraft);
  const [draftSaved,setDraftSaved]=useState(false);

  useEffect(()=>{
    try {
      const data=JSON.parse(localStorage.getItem(draftKey)||'null');
      if(!data)return;
      setDraft({
        title:typeof data.title==='string'?data.title.slice(0,100):'',
        description:typeof data.description==='string'?data.description.slice(0,4000):'',
        price:typeof data.price==='string'?data.price.slice(0,10):'',
        category:categories.includes(data.category)?data.category:categories[0],
        mode:data.mode==='auction'?'auction':'sale',
      });
      setDraftSaved(true);
    }catch{}
  },[draftKey]);

  function updateDraft(changes:Partial<typeof blankDraft>){
    const next={...draft,...changes};
    setDraft(next);
    try {
      const hasContent=Object.values(next).some((value,index)=>value!==Object.values(blankDraft)[index]);
      if(hasContent)localStorage.setItem(draftKey,JSON.stringify(next));
      else localStorage.removeItem(draftKey);
      setDraftSaved(hasContent);
    }catch{setDraftSaved(false);}
  }
  const {mode,category}=draft;
  const [delivery,setDelivery]=useState('pickup');
  const [tags,setTags]=useState<string[]>([]);
  const [images,setImages]=useState<string[]>([]);
  const [story,setStory]=useState('');
  const [uploading,setUploading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const errorRef=useRef<HTMLParagraphElement>(null);

  useEffect(()=>{if(error)errorRef.current?.focus();},[error]);

  function movePhoto(from:number,to:number){
    setImages(previous=>{
      const ordered=[...previous];
      const [photo]=ordered.splice(from,1);
      if (!photo) return previous;
      ordered.splice(to,0,photo);
      return ordered;
    });
  }

  async function upload(files:FileList|null){
    if(!files?.length||uploading)return;
    setError('');
    setUploading(true);
    try{
      if(files.length+images.length>6)throw Error('Puedes subir hasta seis fotos.');
      for(const file of Array.from(files)){
        const normalized=await normalizeListingImage(file);
        const form=new FormData();
        form.set('file',normalized,normalized.name);
        const r=await fetch('/api/market/upload',{method:'POST',body:form});
        const data=await r.json();
        if(!r.ok)throw Error(data.error);
        setImages(prev=>[...prev,data.url]);
      }
    }catch(e){setError((e as Error).message)}finally{setUploading(false)}
  }

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(busy||uploading||!images.length)return;
    setBusy(true);
    setError('');
    const data=Object.fromEntries(new FormData(e.currentTarget));
    try{
      const validatedStory = validateStory(story);
      const l=await api('publish',{...data,category,tags,mode,delivery,images,story:validatedStory,ends_at:data.ends_at?new Date(String(data.ends_at)).toISOString():null});
      try {localStorage.removeItem(draftKey);} catch {}
      router.push('/articulos/'+productSlug(l.id,String(data.title||'')));
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }

  function toggleTag(tag:string){
    setTags(previous=>previous.includes(tag)?previous.filter(value=>value!==tag):previous.length<5?[...previous,tag]:previous);
  }

  return <div className="publish-layout">
    <div><span className="eyebrow">VENDER EN LA PELA</span><h1>Tu artículo.<br/>Tus condiciones.</h1><p className="muted">Un buen anuncio resuelve las dudas antes de comprar.</p><div className="filter-note"><strong>Sin regateos, también en el anuncio.</strong><p>No incluyas teléfonos, redes sociales ni enlaces. Describe el estado y los defectos con claridad.</p></div></div>
    <form className="editor-form" onSubmit={submit}>
      {draftSaved&&<div className="notice"><p>Borrador guardado en este dispositivo. Conserva título, descripción, categoría, modalidad y precio.</p>
        <button type="button" className="underline" onClick={()=>{updateDraft(blankDraft);setTags([]);}}>Borrar borrador</button>
      </div>}
      <h2>1. Enséñalo como es</h2>
      {error&&<p ref={errorRef} tabIndex={-1} className="error-message" role="alert">{error}</p>}
      <label className="upload-area" aria-disabled={uploading||images.length>=6}>
        <span className="button">Añadir fotos</span>
        <span id="upload-help">Hasta 6 fotos, 5 MB por foto. JPG, PNG o WebP.</span>
        <input className="sr-only" aria-label="Fotos del artículo" aria-describedby="upload-help" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading||images.length>=6} onChange={e=>{void upload(e.target.files);e.target.value='';}}/>
      </label>
      <p className="muted upload-status" role="status">{uploading?'Subiendo fotos…':`${images.length} de 6 fotos`}</p>
      <ol className="publish-photos">
        {images.map((url,i)=><li key={url}>
          <img src={url} alt={`Foto ${i+1}`}/>
          {i===0?<strong>Foto principal</strong>:<button type="button" aria-label={`Hacer principal la foto ${i+1}`} onClick={()=>movePhoto(i,0)}>Hacer principal</button>}
          {i>1&&<button type="button" aria-label={`Adelantar la foto ${i+1}`} onClick={()=>movePhoto(i,i-1)}>Adelantar</button>}
          <button type="button" aria-label={`Quitar foto ${i+1}`} onClick={()=>setImages(previous=>previous.filter(x=>x!==url))}>Quitar</button>
        </li>)}
      </ol>
      <label>Título<input name="title" value={draft.title} onChange={event=>updateDraft({title:event.target.value})} placeholder="Por ejemplo: cámara réflex con objetivo 18–55 mm" minLength={5} maxLength={100} required/></label>
      <div className="form-pair"><label>Categoría<select name="category" value={category} onChange={event=>{updateDraft({category:event.target.value});setTags([])}}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Estado<select name="condition">{conditions.map(c=><option key={c}>{c}</option>)}</select></label></div>
      <fieldset className="tag-picker">
        <legend>Etiquetas para encontrarlo mejor <span>Opcional · hasta 5</span></legend>
        <p>Elige las que describan el artículo. Ayudan a encontrarlo con palabras parecidas.</p>
        <div>{availableTags(category).map(tag=><label key={tag} className={tags.includes(tag)?'selected':''}><input type="checkbox" checked={tags.includes(tag)} onChange={()=>toggleTag(tag)}/><span>{tag}</span></label>)}</div>
      </fieldset>
      <label>Descripción y defectos<textarea name="description" value={draft.description} onChange={event=>updateDraft({description:event.target.value})} rows={5} minLength={30} maxLength={4000} placeholder="Qué incluye, cuánto uso tiene y cualquier detalle o defecto que deba conocer quien lo compra." required/></label>
      <div className="story-field-group">
        <label htmlFor="story-input">
          Historia de este objeto <span className="muted font-normal text-xs">(opcional)</span>
        </label>
        <p className="field-hint text-xs muted mb-1" id="story-hint">
          ¿De dónde salió? ¿Qué recuerdos te trae, qué uso le has dado o por qué decides venderlo ahora? Cuenta su recorrido personal sin sustituir la descripción del estado ni los defectos.
        </p>
        <textarea
          id="story-input"
          name="story"
          rows={4}
          maxLength={1000}
          value={story}
          onChange={e=>setStory(e.target.value)}
          placeholder="Por ejemplo: La compré en un anticuario del Rastro en 2018 para restaurarla durante las tardes de lluvia..."
          aria-describedby="story-hint story-count"
        />
        <div className="char-counter text-right text-xs muted mb-4" id="story-count" aria-live="polite">
          {story.length} / 1.000 caracteres
        </div>
      </div>
      <h2>2. Elige cómo vender</h2>
      <div className="choice-grid">{[['sale','Precio cerrado','Quien lo quiere, lo compra.'],['auction','Subasta','Decide el precio de salida y el cierre.']].map(([v,t,d])=><label key={v} className={mode===v?'choice selected':'choice'}><input type="radio" name="mode" value={v} checked={mode===v} onChange={()=>updateDraft({mode:v})}/><strong>{t}</strong><span>{d}</span></label>)}</div>
      <div className="form-pair"><label>{mode==='sale'?'Precio (€)':'Precio de salida (€)'}<input type="number" name="price" value={draft.price} onChange={event=>updateDraft({price:event.target.value})} required min="1" max="10000" step="0.01"/></label>{mode==='auction'&&<label>Comprar ahora (€), opcional<input type="number" name="buy_now" min="1" max="10000" step="0.01"/></label>}</div>
      {mode==='auction'&&<><label>Fecha y hora de cierre<input type="datetime-local" name="ends_at" required/></label><p className="muted">Entre 1 hora y 30 días. Las pujas al final amplían el cierre 2 minutos. No puedes retirar un anuncio con pujas.</p></>}
      <h2>3. Deja clara la entrega</h2>
      <div className="form-pair"><label>Ciudad<input name="location" minLength={2} maxLength={80} required placeholder="Madrid"/></label><label>Entrega<select value={delivery} onChange={e=>setDelivery(e.target.value)}><option value="pickup">Recogida en persona</option><option value="shipping">Envío organizado por mí</option></select></label></div>
      {delivery==='shipping'&&<label>Gastos de envío (€)<input name="shipping" type="number" min="0" max="100" step="0.01" defaultValue="0" required/></label>}
      <label className="check-row"><input type="checkbox" required/> Confirmo que las fotos son del artículo y que he descrito sus defectos.</label>
      <button className="button primary w-full" disabled={busy||uploading||!images.length}>{busy?'Publicando…':'Publicar artículo'}</button>
      <p className="muted">Para recibir pagos, completa la activación de cobros en Mi cuenta.</p>
    </form>
  </div>;
}
