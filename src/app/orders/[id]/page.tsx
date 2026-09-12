'use client';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import {useEffect,useState,useCallback} from 'react';
import {api} from '@/lib/api';
import {money} from '@/lib/rules';
import {pesetaEquivalence, PESETA_DISCLAIMER} from '@/lib/pesetas';

export default function Order(){
  const {id}=useParams<{id:string}>();
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState('');
  const [content,setContent]=useState('');
  const [tracking,setTracking]=useState('');
  const [busy,setBusy]=useState(false);
  const [confirmPayment,setConfirmPayment]=useState(false);
  const [confirmInPerson,setConfirmInPerson]=useState(false);
  const [reviewScore,setReviewScore]=useState(5);
  const [reviewComment,setReviewComment]=useState('');

  const load=useCallback(()=>api('order/'+id).then(setData).catch(e=>setError(e.message)),[id]);

  useEffect(()=>{
    load();
    const timer=setInterval(load,10000);
    return()=>clearInterval(timer);
  },[load]);

  async function action(kind:string){
    setBusy(true);
    setError('');
    try{
      const r=await api(kind+'/'+id,kind==='message'?{content}:kind==='checkout'?{order:true}:kind==='review'?{score:reviewScore,comment:reviewComment}:{tracking});
      if(r.url){
        window.location.assign(r.url);
        return;
      }
      setConfirmPayment(false);
      setConfirmInPerson(false);
      setContent('');
      await load();
    }catch(e){
      setError((e as Error).message);
    }finally{
      setBusy(false);
    }
  }

  if(!data)return (
    <div className="empty-state">
      <h1>{error?'No se pudo abrir el pedido':'Cargando pedido…'}</h1>
      <p>{error}</p>
      <Link href="/my-products" className="button">Mi actividad</Link>
    </div>
  );

  const o=data.order;
  const buyer=data.userId===o.buyer_id;
  const labels:Record<string,string>={
    pending_payment:'Pendiente de pago',
    paid:'Pago confirmado',
    shipped:'Enviado',
    completed:'Entrega completada',
    cancelled:'Cancelado',
    disputed:'En revisión',
    refunded:'Reembolsado'
  };

  return (
    <>
      <div className="breadcrumbs">
        <Link href="/my-products">Mi actividad</Link>
        <span>/</span>
        <span>Pedido {id.slice(0,8)}</span>
      </div>
      <h1>{labels[o.status]||o.status}</h1>
      <p className="order-counterparts">
        {o.seller?.alias&&<span>Vendedor: <Link className="profile-link" href={`/usuarios/${o.seller.alias}`}>@{o.seller.alias}</Link></span>}
        {o.buyer?.alias&&<span>Comprador: <Link className="profile-link" href={`/usuarios/${o.buyer.alias}`}>@{o.buyer.alias}</Link></span>}
      </p>
      {(data.simulated||o.payment_mode==='simulation')&&(
        <div className="notice">Pedido de prueba · Pago simulado, sin cargo real.</div>
      )}
      {o.payment_mode==='in_person'&&(
        <div className="notice">Pago en persona registrado · Venta finalizada directamente entre las partes.</div>
      )}
      {error&&<p className="error-message" role="alert">{error}</p>}
      <div className="order-layout">
        <section className="order-summary">
          <img src={o.listing.images[0]} alt={o.listing.title}/>
          <h2>{o.listing.title}</h2>
          <div className="order-price-box mb-2">
            <p className="detail-price m-0">{money(o.amount_cents)}</p>
            <span className="peseta-approx block text-sm">
              {pesetaEquivalence(o.amount_cents, true)}
            </span>
            <span className="peseta-help-tag mt-1 block" title={PESETA_DISCLAIMER}>
              {PESETA_DISCLAIMER}
            </span>
          </div>
          <p>{o.listing.delivery==='pickup'?'Recogida en '+o.listing.location:'Envío incluido en el total'}</p>
          
          {o.status==='pending_payment'&&(
            <>
              <div className="notice">
                Artículo reservado. Utilizad el chat para acordar si el pago se realizará en mano/en persona o a través de la plataforma, así como los detalles de entrega.
              </div>
              {buyer&&(
                <button className="button primary" disabled={busy} onClick={()=>data.simulated?setConfirmPayment(true):action('checkout')}>
                  {data.simulated?'Simular pago por plataforma':'Pagar con tarjeta'}
                </button>
              )}
              {confirmPayment&&(
                <div className="confirmation">
                  <strong>Confirmar pago simulado de {money(o.amount_cents)}</strong>
                  <span className="peseta-approx block mt-1 text-xs">
                    {pesetaEquivalence(o.amount_cents, true)}
                  </span>
                  <p className="text-xs text-stone-600 mt-1 mb-2 font-medium">
                    {PESETA_DISCLAIMER}
                  </p>
                  <p>No se realizará ningún cargo. Se registrará el pedido como pagado.</p>
                  <button className="button primary" disabled={busy} onClick={()=>action('simulate-payment')}>Confirmar simulación</button>
                  <button className="button" onClick={()=>setConfirmPayment(false)}>Volver</button>
                </div>
              )}
              {!buyer&&!confirmInPerson&&(
                <div style={{marginTop:'1rem'}}>
                  <button className="button primary" disabled={busy} onClick={()=>setConfirmInPerson(true)}>
                    Marcar pago recibido en persona
                  </button>
                </div>
              )}
              {!buyer&&confirmInPerson&&(
                <div className="confirmation" style={{marginTop:'1rem'}}>
                  <strong>Confirmar cobro en persona</strong>
                  <p>¿Confirmas que has cobrado los {money(o.amount_cents)} ({pesetaEquivalence(o.amount_cents, true)}) en mano? El pedido se dará por completado y el artículo quedará vendido.</p>
                  <p className="text-xs text-stone-600 mb-2 font-medium">
                    {PESETA_DISCLAIMER}
                  </p>
                  <button className="button primary" disabled={busy} onClick={()=>action('pay-in-person')}>
                    Sí, marcar como cobrado y vendido
                  </button>
                  <button className="button" onClick={()=>setConfirmInPerson(false)}>Cancelar</button>
                </div>
              )}
              <p className="muted">Reserva activa hasta {new Date(o.expires_at).toLocaleString('es-ES')}.</p>
            </>
          )}

          {!buyer&&o.status==='paid'&&(
            <form onSubmit={e=>{e.preventDefault();action('ship')}}>
              <label>
                {o.listing.delivery==='shipping'?'Transportista y seguimiento':'Detalle de entrega'}
                <input className="field-input" value={tracking} onChange={e=>setTracking(e.target.value)} maxLength={200} required={o.listing.delivery==='shipping'}/>
              </label>
              <button className="button primary" disabled={busy}>
                Marcar {o.listing.delivery==='shipping'?'como enviado':'entrega preparada'}
              </button>
            </form>
          )}

          {buyer&&['paid','shipped'].includes(o.status)&&(
            <button className="button primary" disabled={busy} onClick={()=>{if(window.confirm('¿Confirmas que has recibido el artículo y has revisado su estado?'))action('complete')}}>
              Confirmar recepción
            </button>
          )}

          {o.tracking&&<p className="notice">Seguimiento: {o.tracking}</p>}
          {o.shipping_address&&(
            <div>
              <h3>Dirección de envío</h3>
              <p>
                {o.shipping_address.name}<br/>
                {o.shipping_address.address?.line1}<br/>
                {o.shipping_address.address?.line2}<br/>
                {o.shipping_address.address?.postal_code} {o.shipping_address.address?.city}
              </p>
            </div>
          )}
          {o.status==='completed'&&<section className="order-reviews"><h3>Valoraciones</h3>{data.reviews.map((review:any)=><div className="review-card" key={review.id}><strong>@{review.author.alias}</strong><span className="review-stars">{'★'.repeat(review.score)+'☆'.repeat(5-review.score)}</span>{review.comment&&<p>{review.comment}</p>}</div>)}{data.canReview&&<form onSubmit={e=>{e.preventDefault();action('review')}}><label htmlFor="review-score">Valora a @{buyer?o.seller.alias:o.buyer.alias}</label><select id="review-score" className="field-input" value={reviewScore} onChange={e=>setReviewScore(Number(e.target.value))}>{[5,4,3,2,1].map(score=><option key={score} value={score}>{score} estrella{score===1?'':'s'}</option>)}</select><label htmlFor="review-comment">Comentario opcional</label><textarea id="review-comment" className="field-input" value={reviewComment} onChange={e=>setReviewComment(e.target.value)} maxLength={500} rows={3}/><button className="button primary" disabled={busy}>Publicar valoración</button></form>}</section>}
        </section>

        <section className="order-chat">
          <h2>Concretar la entrega</h2>
          {data.canMessage?(
            <>
              <p className="muted">Conversación privada entre comprador y vendedor. Coordina la forma de pago (en persona o por plataforma) y la entrega.</p>
              <div className="message-list" aria-live="polite">
                {!data.messages.length&&(
                  <div className="empty-state">
                    <h3>Ya podéis hablar.</h3>
                    <p>Acordad la forma de pago (en persona o por plataforma) y el lugar o fecha de entrega.</p>
                  </div>
                )}
                {data.messages.map((m:any)=>(
                  <div key={m.id} className={'message '+(m.sender_id===data.userId?'own':'')}>
                    <strong>{m.sender_id===data.userId?'Tú':`@${m.sender?.alias||'usuario'}`}</strong>
                    <p>{m.content}</p>
                    <small>{new Date(m.created_at).toLocaleString('es-ES')}</small>
                  </div>
                ))}
              </div>
              <form onSubmit={e=>{e.preventDefault();action('message')}}>
                <label htmlFor="message">Mensaje sobre la entrega o pago</label>
                <textarea className="field-input" id="message" value={content} onChange={e=>setContent(e.target.value)} maxLength={2000} required rows={3}/>
                <button className="button primary" disabled={busy||!content.trim()}>Enviar mensaje</button>
              </form>
            </>
          ):(
            <div className="empty-state">
              <h3>El chat no está disponible.</h3>
              <p>Solo las partes de un pedido activo pueden acceder a la conversación.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
