'use client';

import {useEffect,useState} from 'react';
import {api} from '@/lib/api';

export const supportReasons={shipping:'Envío',delivery:'Recogida o entrega',condition:'Estado del artículo'};
export type Ticket={id:string;order_id:string;reason:keyof typeof supportReasons;details:string;status:'open'|'resolved'};

export default function OrderSupport({id}:{id:string}){
  const [open,setOpen]=useState(false);
  const [tickets,setTickets]=useState<Ticket[]>([]);
  const [reason,setReason]=useState('shipping');
  const [details,setDetails]=useState('');
  const [busy,setBusy]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [error,setError]=useState('');

  useEffect(()=>{
    if(!open)return;
    let active=true;
    api('order-support/'+id).then(rows=>{if(active){setTickets(rows);setLoaded(true);}}).catch(e=>{if(active)setError(e.message);});
    return ()=>{active=false;};
  },[id,open]);

  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    setBusy(true);
    setError('');
    try{
      const ticket:Ticket=await api('order-support/'+id,{reason,details});
      setTickets(rows=>[ticket,...rows.filter(item=>item.id!==ticket.id)]);
      setDetails('');
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }

  return <section className="account-section" aria-label="Ayuda con el pedido">
    <button type="button" className="button" aria-expanded={open} onClick={()=>{setError('');setLoaded(false);setOpen(v=>!v);}}>Tengo un problema</button>
    {open&&<>
      <h2>Ayuda con el pedido</h2>
      {tickets.map(ticket=><p className="notice" role="status" key={ticket.id}>
        {supportReasons[ticket.reason]} · {ticket.status==='resolved'?'Resuelta':'En revisión'} · Referencia <strong>{ticket.id}</strong>
      </p>)}
      <form onSubmit={submit}>
        <label htmlFor="support-reason">Motivo</label>
        <select className="field-input" id="support-reason" value={reason} onChange={e=>setReason(e.target.value)}>
          {Object.entries(supportReasons).map(([key,label])=><option key={key} value={key}>{label}</option>)}
        </select>
        <label htmlFor="support-details">Cuéntanos qué ha pasado</label>
        <p className="muted" id="support-detail-help">Este mensaje lo recibe el equipo de soporte.</p>
        <textarea className="field-input" id="support-details" aria-describedby="support-detail-help" rows={3} required minLength={10} maxLength={1000} value={details} onChange={e=>setDetails(e.target.value)}/>
        <button type="submit" className="button primary" disabled={busy||!loaded||tickets.some(ticket=>ticket.reason===reason)}>{busy?'Enviando…':'Registrar incidencia'}</button>
      </form>
      {error&&<p role="alert" className="error-message">{error}</p>}
    </>}
  </section>;
}
