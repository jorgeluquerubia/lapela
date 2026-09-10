'use client';
import Link from 'next/link';
import {useAuth} from '@/context/AuthContext';
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {productSlug} from '@/lib/slugs';
import Brand from './Brand';

function notificationArticleHref(notification:any){return '/articulos/'+productSlug(notification.listing_id,notification.listing?.title||'articulo')}

export default function Header(){
  const {user}=useAuth();
  const [q,setQ]=useState('');
  const [unreadCount,setUnreadCount]=useState(0);
  const [notifications,setNotifications]=useState<any[]>([]);
  const [open,setOpen]=useState(false);
  const router=useRouter();

  useEffect(()=>{
    if(!user){setUnreadCount(0);setNotifications([]);setOpen(false);return}
    let active=true;
    const fetchNotifications=()=>fetch('/api/marketplace?action=notifications').then(r=>r.json()).then(d=>{
      if(active&&typeof d.unreadCount==='number'){setUnreadCount(d.unreadCount);setNotifications(Array.isArray(d.notifications)?d.notifications:[])}
    }).catch(()=>{});
    fetchNotifications();
    const interval=setInterval(fetchNotifications,15000);
    return()=>{active=false;clearInterval(interval)};
  },[user]);

  useEffect(()=>{
    const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
    window.addEventListener('keydown',onKeyDown);
    return()=>window.removeEventListener('keydown',onKeyDown);
  },[]);

  return <header className="site-header">
    <div className="header-inner">
      <Brand/>
      <form className="global-search" onSubmit={e=>{e.preventDefault();router.push('/search?q='+encodeURIComponent(q))}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/></svg>
        <input aria-label="Buscar productos" placeholder="¿Qué estás buscando?" value={q} onChange={e=>setQ(e.target.value)}/>
        <button aria-label="Buscar" type="submit">↵</button>
      </form>
      <nav className="header-actions">
        {user&&<div className="notification-menu">
          <button className="notification-bell" type="button" aria-label={unreadCount?`${unreadCount} novedades sin leer`:'No tienes novedades sin leer'} aria-expanded={open} aria-controls="notification-panel" onClick={()=>setOpen(v=>!v)}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
            {unreadCount>0&&<span className="activity-dot">{unreadCount>9?'9+':unreadCount}</span>}
          </button>
          {open&&<section id="notification-panel" className="notification-panel" aria-label="Novedades">
            <div className="notification-panel-heading"><strong>Novedades</strong><Link href="/my-products" onClick={()=>setOpen(false)}>Ver actividad</Link></div>
            {!notifications.length?<p className="notification-empty">No tienes novedades pendientes.</p>:<ul>{notifications.map(notification=><li key={notification.id}>
              <Link href={notificationArticleHref(notification)} onClick={()=>setOpen(false)} className="notification-article-link"><strong>{notification.title}</strong><span>{notification.listing?.title||'Ver artículo'}</span></Link>
              {notification.body&&<p>{notification.body}</p>}
              <div className="notification-actions"><Link href={notificationArticleHref(notification)} onClick={()=>setOpen(false)}>Ver artículo</Link>{notification.order_id&&<Link href={'/orders/'+notification.order_id} onClick={()=>setOpen(false)}>{notification.type==='new_message'?'Abrir chat':'Ver pedido'}</Link>}</div>
            </li>)}</ul>}
          </section>}
        </div>}
        <Link href="/my-products" className="account-link">{user?'Mi actividad':'Mis compras'}</Link>
        <Link href={user?'/user-profile':'/login'} className="account-link">{user?'Mi cuenta':'Entrar'}</Link>
        <Link className="button primary" href="/publish-ad"><span>＋</span> Vender</Link>
      </nav>
    </div>
    <div className="category-nav"><Link href="/">Explorar</Link><Link href="/subastas">Subastas</Link><span className="nav-separator"/><Link href="/categoria/tecnologia">Tecnología</Link><Link href="/categoria/hogar">Hogar</Link><Link href="/categoria/moda">Moda</Link><Link href="/categoria/deporte">Deporte</Link><Link href="/categoria/coleccionismo">Coleccionismo</Link><Link href="/como-funciona" className="nav-about">Así funciona La Pela ↗</Link></div>
  </header>;
}
