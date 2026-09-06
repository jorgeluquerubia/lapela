import Link from 'next/link';
import {Product} from '@/types';
import {productSlug} from '@/lib/slugs';

export default function ProductCard({product:p}:{product:Product}){
  const auction=p.type==='auction';
  const time=p.auction_ends_at?Math.max(0,Math.ceil((Date.parse(p.auction_ends_at)-Date.now())/3600000)):null;
  const href=`/articulos/${p.slug||productSlug(p.id,p.name)}`;
  return <article className="product-card">
    <Link href={href} className="product-image">
      <img src={p.image} alt={p.name} loading="lazy"/>
      <span className={`sale-tag ${auction?'auction':''}`}>{auction?'↗ Subasta':'Precio cerrado'}</span>
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
    </div>
  </article>;
}
