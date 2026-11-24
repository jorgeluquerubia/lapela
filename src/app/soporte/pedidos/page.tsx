'use client';

import {useEffect,useState} from 'react';
import Link from 'next/link';
import {api} from '@/lib/api';
import {supportReasons,type Ticket} from '@/components/OrderSupport';

export default function SupportQueue(){
  const [tickets,setTickets]=useState<Ticket[]|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState('');
  useEffect(()=>{
    let active=true;
    api('support-queue').then(rows=>{if(active)setTickets(rows);}).catch(e=>{if(active)setError(e.message);});
    return ()=>{active=false;};
  },[]);
  async function resolve(id:string){
    setBusy(id);
    setError('');
    try{
      await api('support-queue/'+id,{});
      setTickets(rows=>rows?.filter(ticket=>ticket.id!==id)||[]);
    }catch(e){setError((e as Error).message);}finally{setBusy('');}
  }
  return <section className="prose-page">
    <h1>Soporte de pedidos</h1>
    {error&&<p role="alert" className="error-message">{error}</p>}
    {tickets===null&&!error&&<p role="status">Cargando incidencias…</p>}
    {tickets?.length===0&&<p>No hay incidencias abiertas.</p>}
    {tickets?.map(ticket=><article className="account-section" key={ticket.id}>
      <h2>{supportReasons[ticket.reason]}</h2>
      <p><strong>Referencia</strong> {ticket.id}</p>
      <p><strong>Pedido</strong> {ticket.order_id}</p>
      <p className="whitespace-pre-wrap break-words">{ticket.details}</p>
      <button type="button" className="button" disabled={Boolean(busy)} onClick={()=>resolve(ticket.id)}>Marcar como resuelta</button>
    </article>)}
    <Link href="/" className="underline">Volver a La Pela</Link>
  </section>;
}
