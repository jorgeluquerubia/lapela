'use client';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/context/AuthContext';
import {useEffect, useRef, useState} from 'react';
import {productSlug} from '@/lib/slugs';
import Brand from './Brand';
import ProductSearch from './ProductSearch';

type Notification = {
  id:string; title:string; type:string; body?:string;
  order_id?:string; listing_id?:string; listing?:{title:string};
};

function notificationHref(notification:Notification) {
  if(notification.order_id) return '/orders/'+notification.order_id;
  if(notification.listing_id) return '/articulos/'+productSlug(notification.listing_id,notification.listing?.title||'articulo');
  return '/my-products';
}

export default function Header(){
  const {user}=useAuth();
  const router=useRouter();
  const [unreadCount,setUnreadCount]=useState(0);
  const [notifications,setNotifications]=useState<Notification[]>([]);
  const [open,setOpen]=useState(false);
  const [markingAll,setMarkingAll]=useState(false);

  useEffect(()=>{
    if(!user){setUnreadCount(0);setNotifications([]);setOpen(false);return}
    let active=true;
    const fetchNotifications=()=>fetch('/api/market/notifications').then(r=>r.json()).then(d=>{
      if(active&&typeof d.unreadCount==='number'){setUnreadCount(d.unreadCount);setNotifications(Array.isArray(d.notifications)?d.notifications:[])}
    }).catch(()=>{});
    fetchNotifications();
    const interval=setInterval(fetchNotifications,15000);
    return()=>{active=false;clearInterval(interval)};
  },[user]);

  const bell=useRef<HTMLButtonElement>(null);
  const closeButton=useRef<HTMLButtonElement>(null);
  const panel=useRef<HTMLElement>(null);
  const [notificationError,setNotificationError]=useState('');

  function closeNotifications() {
    bell.current?.focus({preventScroll:true});
    setOpen(false);
  }

  useEffect(()=>{
    if(!open)return;
    closeButton.current?.focus();
    function onKeyDown(event:KeyboardEvent){
      if(event.key!=='Escape'||event.defaultPrevented)return;
      event.preventDefault();
      closeNotifications();
    }
    function onPointerDown(event:PointerEvent){
      if(event.target instanceof Node && !panel.current?.contains(event.target) && !bell.current?.contains(event.target))setOpen(false);
    }
    window.addEventListener('keydown',onKeyDown);
    window.addEventListener('pointerdown',onPointerDown);
    return()=>{
      window.removeEventListener('keydown',onKeyDown);
      window.removeEventListener('pointerdown',onPointerDown);
    };
  },[open]);

  const openNotification=async(event:React.MouseEvent<HTMLAnchorElement>,notification:Notification,href:string)=>{
    if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    closeNotifications();
    try{
      const response=await fetch('/api/market/mark-notification-read/'+notification.id,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
      if(response.ok){
        setNotifications(current=>current.filter(item=>item.id!==notification.id));
        setUnreadCount(current=>Math.max(0,current-1));
      }
    }catch{}
    router.push(href);
  };

  const markAllAsRead=async()=>{
    if(markingAll||!notifications.length)return;
    setMarkingAll(true);
    setNotificationError('');
    try{
      const response=await fetch('/api/market/mark-all-notifications-read',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
      if(response.ok){
        setNotifications([]);
        setUnreadCount(0);
        closeButton.current?.focus();
      }else{
        setNotificationError('No se pudieron marcar las novedades. Vuelve a intentarlo.');
      }
    }catch{setNotificationError('No se pudieron marcar las novedades. Vuelve a intentarlo.');}finally{
      setMarkingAll(false);
    }
  };

  const orderGroups = new Map<string, Notification[]>();
  for (const notification of notifications) {
    const key=notification.order_id?'order-'+notification.order_id:notification.id;
    const group=orderGroups.get(key);
    if(group)group.push(notification);
    else orderGroups.set(key,[notification]);
  }
  const actionTypes=new Set(['order_created','status_changed','new_message','outbid','auction_won']);
  const rankedNotifications=[...orderGroups.values()]
    .sort((a,b)=>Number(b.some(item=>actionTypes.has(item.type)))-Number(a.some(item=>actionTypes.has(item.type))))
    .flatMap(group=>group.map((item,index)=>({item,continued:index>0})));

  return <header className="site-header">
    <div className="header-inner">
      <Brand/>
      <ProductSearch/>
      <nav className="header-actions" aria-label="Cuenta y actividad">
        {user&&<div className="notification-menu">
          <button ref={bell} className="notification-bell" type="button" aria-label={unreadCount?`${unreadCount} novedades sin leer`:'No tienes novedades sin leer'} aria-expanded={open} aria-controls="notification-panel" onClick={()=>{setNotificationError('');setOpen(v=>!v)}}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
            {unreadCount>0&&<span className="activity-dot">{unreadCount>9?'9+':unreadCount}</span>}
          </button>
          {open&&<section ref={panel} id="notification-panel" className="notification-panel" aria-labelledby="notification-title">
            <div className="notification-panel-heading">
              <strong id="notification-title">Novedades</strong>
              <button ref={closeButton} type="button" className="notification-close" onClick={closeNotifications}>Cerrar</button>
              <div className="notification-panel-actions">
                {notifications.length>0&&<button type="button" className="notification-mark-all" onClick={markAllAsRead} disabled={markingAll}>{markingAll?'Marcando...':'Marcar todas como vistas'}</button>}
                <Link href="/my-products" onClick={closeNotifications}>Ver actividad</Link>
              </div>
            </div>
            {notificationError&&<p role="alert" className="error-message">{notificationError}</p>}
            {!notifications.length?<p className="notification-empty">No tienes novedades pendientes.</p>:<ul>
              {rankedNotifications.map(({item:notification,continued})=>{
                const href=notificationHref(notification);
                const article=notification.listing_id?'/articulos/'+productSlug(notification.listing_id,notification.listing?.title||'articulo'):null;
                const summary=<><strong>{notification.title}</strong>{notification.listing?.title&&<span>{notification.listing.title}</span>}</>;
                return <li key={notification.id} className={continued?'order-notification-continuation':undefined}>
                  {article&&notification.order_id
                    ? <Link href={article} onClick={event=>openNotification(event,notification,article)} className="notification-article-link">{summary}</Link>
                    : <div className="notification-article-link">{summary}</div>}
                  {notification.body&&<p>{notification.body}</p>}
                  <Link href={href} onClick={event=>openNotification(event,notification,href)} className="notification-action-label">
                    {notification.type==='new_message'&&notification.order_id?'Abrir chat':notification.order_id?'Ver pedido':notification.listing_id?'Ver artículo':'Ver actividad'}
                  </Link>
                </li>;
              })}
            </ul>}
          </section>}
        </div>}
        <Link href="/my-products" className="account-link">{user?'Mi actividad':'Mis compras'}</Link>
        <Link href={user?'/user-profile':'/login'} className="account-link">{user?'Mi cuenta':'Entrar'}</Link>
        <Link className="button primary" href="/publish-ad"><span aria-hidden="true">＋</span> Vender</Link>
      </nav>
    </div>
    <nav className="category-nav" aria-label="Catálogo"><Link href="/">Explorar</Link><Link href="/subastas">Subastas</Link>{user&&<Link href="/my-products" className="mobile-activity-link">Mi actividad</Link>}<span className="nav-separator"/><Link prefetch={false} href="/categoria/tecnologia">Tecnología</Link><Link prefetch={false} href="/categoria/hogar">Hogar</Link><Link prefetch={false} href="/categoria/moda">Moda</Link><Link prefetch={false} href="/categoria/deporte">Deporte</Link><Link prefetch={false} href="/categoria/coleccionismo">Coleccionismo</Link><Link href="/como-funciona" className="nav-about">Así funciona La Pela ↗</Link></nav>
  </header>;
}
