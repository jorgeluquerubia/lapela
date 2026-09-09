'use client';
import Link from 'next/link';
import {useAuth} from '@/context/AuthContext';
import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import Brand from './Brand';

export default function Header(){
  const {user}=useAuth();
  const [q,setQ]=useState('');
  const [unreadCount,setUnreadCount]=useState(0);
  const router=useRouter();

  useEffect(()=>{
    if(!user){
      setUnreadCount(0);
      return;
    }
    let active = true;
    const fetchNotifications = () => {
      fetch('/api/marketplace?action=notifications')
        .then(r => r.json())
        .then(d => {
          if (active && typeof d.unreadCount === 'number') {
            setUnreadCount(d.unreadCount);
          }
        })
        .catch(()=>{});
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user]);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand/>
        <form className="global-search" onSubmit={e=>{e.preventDefault();router.push('/search?q='+encodeURIComponent(q))}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <circle cx="10" cy="10" r="6.5"/>
            <path d="m15 15 5 5"/>
          </svg>
          <input aria-label="Buscar productos" placeholder="¿Qué estás buscando?" value={q} onChange={e=>setQ(e.target.value)}/>
          <button aria-label="Buscar" type="submit">↵</button>
        </form>
        <nav className="header-actions">
          <Link href="/my-products" className="account-link" style={{display:'inline-flex',alignItems:'center'}}>
            {user?'Mi actividad':'Mis compras'}
            {user && unreadCount > 0 && (
              <span className="activity-dot" aria-label={`${unreadCount} novedades sin leer`}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link href={user?'/user-profile':'/login'} className="account-link">{user?'Mi cuenta':'Entrar'}</Link>
          <Link className="button primary" href="/publish-ad"><span>＋</span> Vender</Link>
        </nav>
      </div>
      <div className="category-nav">
        <Link href="/">Explorar</Link>
        <Link href="/subastas">Subastas</Link>
        <span className="nav-separator"/>
        <Link href="/categoria/tecnologia">Tecnología</Link>
        <Link href="/categoria/hogar">Hogar</Link>
        <Link href="/categoria/moda">Moda</Link>
        <Link href="/categoria/deporte">Deporte</Link>
        <Link href="/categoria/coleccionismo">Coleccionismo</Link>
        <Link href="/como-funciona" className="nav-about">Así funciona La Pela ↗</Link>
      </div>
    </header>
  );
}
