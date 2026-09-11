'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {useAuth} from '@/context/AuthContext';
import {api} from '@/lib/api';
import {categories,conditions} from '@/lib/rules';
import {availableTags} from '@/lib/search';
import {productSlug} from '@/lib/slugs';

export default function Publish(){
  const {user,loading}=useAuth();
  const router=useRouter();
  const [mode,setMode]=useState('sale');
  const [delivery,setDelivery]=useState('pickup');
  const [category,setCategory]=useState(categories[0]);
  const [tags,setTags]=useState<string[]>([]);
  const [images,setImages]=useState<string[]>([]);
  const [uploading,setUploading]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  async function upload(files:FileList|null){
    if(!files)return;
    setError('');
    setUploading(true);
    try{
      if(files.length+images.length>6)throw Error('Puedes subir hasta seis fotos.');
      for(const file of Array.from(files)){
        const form=new FormData();
        form.set('file',file);
        const response=await fetch('/api/market/upload',{method:'POST',body:form});
        const data=await response.json();
        if(!response.ok)throw Error(data.error);
        setImages(previous=>[...previous,data.url]);
      }
    }catch(cause){setError((cause as Error).message)}finally{setUploading(false)}
  }

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    setBusy(true);
    setError('');
    const data=Object.fromEntries(new FormData(event.currentTarget));
    try{
      const listing=await api('publish',{
        ...data,
        category,
        tags,
        mode,
        delivery,
        images,
        ends_at:data.ends_at?new Date(String(data.ends_at)).toISOString():null,
      });
      router.push('/articulos/'+productSlug(listing.id,String(data.title||'')));
    }catch(cause){setError((cause as Error).message)}finally{setBusy(false)}
  }

  function toggleTag(tag:string){
    setTags(previous=>previous.includes(tag)?previous.filter(value=>value!==tag):previous.length<5?[...previous,tag]:previous);
  }

  if(loading)return <p>Cargando cuenta…</p>;
  if(!user)return <section className="empty-state"><h1>Dale una segunda vida.</h1><p>Entra en tu cuenta para publicar tu artículo.</p><Link href="/login" className="button primary">Entrar</Link><Link href="/register" className="button">Crear cuenta</Link></section>;

  return <div className="publish-layout">
    <div>
      <span className="eyebrow">VENDER EN LA PELA</span>
      <h1>Tu artículo.<br/>Tus condiciones.</h1>
      <p className="muted">Un buen anuncio resuelve las dudas antes de comprar.</p>
      <div className="filter-note"><strong>Sin regateos, también en el anuncio.</strong><p>No incluyas teléfonos, redes sociales ni enlaces. Describe el estado y los defectos con claridad.</p></div>
    </div>
    <form className="editor-form" onSubmit={submit}>
      <h2>1. Enséñalo como es</h2>
      <label className="upload-area">{uploading?'Subiendo fotos…':'＋ Añadir fotos'}<span>Hasta 6 fotos · JPG, PNG o WebP · 5 MB por foto</span><input aria-label="Fotos del artículo" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading||images.length>=6} onChange={event=>upload(event.target.files)}/></label>
      <div className="photo-thumbs">{images.map((url,index)=><div key={url}><img src={url} alt={`Foto ${index+1}`}/><button type="button" onClick={()=>setImages(images.filter(value=>value!==url))}>Quitar {index+1}</button></div>)}</div>
      <label>Título<input name="title" placeholder="Por ejemplo: cámara réflex con objetivo 18–55 mm" minLength={5} maxLength={100} required/></label>
      <div className="form-pair">
        <label>Categoría<select name="category" value={category} onChange={event=>{setCategory(event.target.value);setTags([])}}>{categories.map(value=><option key={value}>{value}</option>)}</select></label>
        <label>Estado<select name="condition">{conditions.map(value=><option key={value}>{value}</option>)}</select></label>
      </div>
      <fieldset className="tag-picker">
        <legend>Etiquetas para encontrarlo mejor <span>Opcional · hasta 5</span></legend>
        <p>Elige las que describan el artículo. Ayudan a encontrarlo con palabras parecidas.</p>
        <div>{availableTags(category).map(tag=><label key={tag} className={tags.includes(tag)?'selected':''}><input type="checkbox" checked={tags.includes(tag)} onChange={()=>toggleTag(tag)}/><span>{tag}</span></label>)}</div>
      </fieldset>
      <label>Descripción y defectos<textarea name="description" rows={5} minLength={30} maxLength={4000} placeholder="Qué incluye, cuánto uso tiene y cualquier detalle o defecto que deba conocer quien lo compra." required/></label>
      <h2>2. Elige cómo vender</h2>
      <div className="choice-grid">{[['sale','Precio cerrado','Quien lo quiere, lo compra.'],['auction','Subasta','Decide el precio de salida y el cierre.']].map(([value,title,description])=><label key={value} className={mode===value?'choice selected':'choice'}><input type="radio" name="mode" value={value} checked={mode===value} onChange={()=>setMode(value)}/><strong>{title}</strong><span>{description}</span></label>)}</div>
      <div className="form-pair"><label>{mode==='sale'?'Precio (€)':'Precio de salida (€)'}<input type="number" name="price" required min="1" max="10000" step="0.01"/></label>{mode==='auction'&&<label>Comprar ahora (€), opcional<input type="number" name="buy_now" min="1" max="10000" step="0.01"/></label>}</div>
      {mode==='auction'&&<><label>Fecha y hora de cierre<input type="datetime-local" name="ends_at" required/></label><p className="muted">Entre 1 hora y 30 días. Las pujas al final amplían el cierre 2 minutos. No puedes retirar un anuncio con pujas.</p></>}
      <h2>3. Deja clara la entrega</h2>
      <div className="form-pair"><label>Ciudad<input name="location" minLength={2} maxLength={80} required placeholder="Madrid"/></label><label>Entrega<select value={delivery} onChange={event=>setDelivery(event.target.value)}><option value="pickup">Recogida en persona</option><option value="shipping">Envío organizado por mí</option></select></label></div>
      {delivery==='shipping'&&<label>Gastos de envío (€)<input name="shipping" type="number" min="0" max="100" step="0.01" defaultValue="0" required/></label>}
      <label className="check-row"><input type="checkbox" required/> Confirmo que las fotos son del artículo y que he descrito sus defectos.</label>
      {error&&<p className="error-message" role="alert">{error}</p>}
      <button className="button primary w-full" disabled={busy||uploading||!images.length}>{busy?'Publicando…':'Publicar artículo'}</button>
      <p className="muted">Para recibir pagos, completa la activación de cobros en Mi cuenta.</p>
    </form>
  </div>;
}
