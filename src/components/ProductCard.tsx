'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useAuth} from '@/context/AuthContext';
import {Product} from '@/types';
import {productSlug} from '@/lib/slugs';
import {pesetaEquivalence} from '@/lib/pesetas';
import BrandSpinner from './BrandSpinner';

export default function ProductCard({product:p}:{product:Product}){
  const {user}=useAuth();
  const router=useRouter();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(Boolean((p as any).isFavorite));
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [favoriteNotice, setFavoriteNotice] = useState('');
  const auction=p.type==='auction';
  const time=p.auction_ends_at?Math.max(0,Math.ceil((Date.parse(p.auction_ends_at)-Date.now())/3600000)):null;
  const href=`/articulos/${p.slug||productSlug(p.id,p.name)}`;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push('/login');
      return;
    }
    if (favoriteBusy) return;
    setFavoriteBusy(true);
    const next = !isFavorite;
    setIsFavorite(next);
    setFavoriteNotice(next ? 'Guardado en favoritos' : 'Eliminado de favoritos');
    try {
      const res = await fetch(`/api/market/favorite/${p.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: next })
      });
      const data = await res.json();
      if (data.error) {
        setIsFavorite(!next);
        setFavoriteNotice(data.error);
      } else if (typeof data.is_favorite === 'boolean') {
        setIsFavorite(data.is_favorite);
      }
    } catch {
      setIsFavorite(!next);
      setFavoriteNotice('Error al actualizar favoritos');
    } finally {
      setFavoriteBusy(false);
    }
  };

  return <article className="product-card">
    <div style={{ position: 'relative' }}>
      <Link href={href} className="product-image">
        {!imageLoaded && (
          <div className="product-image-loading">
            <BrandSpinner size="sm" label={`Cargando imagen de ${p.name}…`} />
          </div>
        )}
        <img
          src={p.image}
          alt={p.name}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={imageLoaded ? 'product-image-loaded' : 'product-image-unloaded'}
        />
        <span className={`sale-tag ${auction?'auction':''}`}>{auction?'↗ Subasta':'Precio cerrado'}</span>
      </Link>
      <button
        type="button"
        className={`favorite-button ${isFavorite ? 'active' : ''}`}
        onClick={toggleFavorite}
        disabled={favoriteBusy}
        aria-label={isFavorite ? 'Eliminar de favoritos' : 'Guardar en favoritos'}
        aria-pressed={isFavorite}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? '#dc2626' : 'none'} stroke={isFavorite ? '#dc2626' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
      {favoriteNotice && <span className="sr-only" role="status">{favoriteNotice}</span>}
    </div>
    <div className="product-info">
      <div className="price-row">
        <div className="price-stack">
          <strong>{new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(p.current_bid||p.price)}</strong>
          <span className="peseta-approx" title="Equivalencia histórica · El pago se realiza en euros">
            {pesetaEquivalence(p.current_bid || p.price)}
          </span>
        </div>
        <span>{auction?`${p.bid_count||0} pujas`:'Sin regateos'}</span>
      </div>
      <Link href={href}><h3>{p.name}</h3></Link>
      <div className="product-meta">
        <span>{p.location||'España'}</span>
        <span>{auction&&time!==null?(time===0?'Finalizada':`Quedan ${time} h`):'Segunda mano'}</span>
      </div>
      {p.sellerProfile?.alias&&<Link className="profile-link product-seller" href={`/usuarios/${p.sellerProfile.alias}`}>Vendido por @{p.sellerProfile.alias}</Link>}
    </div>
  </article>;
}
