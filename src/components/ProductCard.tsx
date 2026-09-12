'use client';
import {useState} from 'react';
import Link from 'next/link';
import {Product} from '@/types';
import {productSlug} from '@/lib/slugs';
import BrandSpinner from './BrandSpinner';

export default function ProductCard({product:p}:{product:Product}){
  const [imageLoaded, setImageLoaded] = useState(false);
  const auction=p.type==='auction';
  const time=p.auction_ends_at?Math.max(0,Math.ceil((Date.parse(p.auction_ends_at)-Date.now())/3600000)):null;
  const href=`/articulos/${p.slug||productSlug(p.id,p.name)}`;
  return <article className="product-card">
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
      {(p.has_story || Boolean(p.story)) && <span className="story-badge">Con historia</span>}
    </Link>
    <div className="product-info">
      <div className="price-row">
        <strong>{new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(p.current_bid||p.price)}</strong>
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
