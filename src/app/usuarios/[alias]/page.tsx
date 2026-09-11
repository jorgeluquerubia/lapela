import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import {getPublicProfile} from '@/models/marketplace';

export const metadata:Metadata={
  title:'Perfil de usuario',
  robots:{index:false,follow:true},
};

export default async function UserDashboard({params}:{params:Promise<{alias:string}>}){
  const {alias}=await params;
  const data=await getPublicProfile(alias);
  if(!data)notFound();
  const stars=(score:number)=>'★'.repeat(score)+'☆'.repeat(5-score);
  return <section className="public-profile">
    <div className="profile-heading">
      <div>
        <span className="eyebrow">PERFIL PÚBLICO</span>
        <h1>@{data.profile.alias}</h1>
        <p className="muted">Miembro desde {new Date(data.profile.memberSince).toLocaleDateString('es-ES',{month:'long',year:'numeric'})}</p>
      </div>
      <Link href="/" className="button">Explorar artículos</Link>
    </div>
    <div className="profile-stats" aria-label="Actividad pública">
      <div><strong>{data.stats.completedSales}</strong><span>ventas completadas</span></div>
      <div><strong>{data.stats.averageScore===null?'—':data.stats.averageScore.toLocaleString('es-ES')}</strong><span>valoración media</span></div>
      <div><strong>{data.stats.reviewCount}</strong><span>valoraciones</span></div>
    </div>
    <section className="profile-section">
      <h2>Anuncios a la venta</h2>
      {data.activeListings.length?<div className="product-grid">{data.activeListings.map((product:any)=><ProductCard key={product.id} product={product}/>)}</div>:<p className="muted">Ahora mismo no tiene artículos a la venta.</p>}
    </section>
    {data.profile.showPurchases&&<section className="profile-section">
      <h2>Compras públicas</h2>
      {data.purchases.length?<div className="product-grid">{data.purchases.map((product:any)=><ProductCard key={product.id} product={product}/>)}</div>:<p className="muted">No hay compras públicas que mostrar.</p>}
    </section>}
    <section className="profile-section">
      <h2>Valoraciones</h2>
      {data.reviews.length?<div className="review-list">{data.reviews.map((review:any)=><article className="review-card" key={review.id}><div><Link className="profile-link" href={`/usuarios/${review.author.alias}`}>@{review.author.alias}</Link><span className="review-stars" aria-label={`${review.score} de 5 estrellas`}>{stars(review.score)}</span></div>{review.comment&&<p>{review.comment}</p>}<small>{new Date(review.created_at).toLocaleDateString('es-ES')}</small></article>)}</div>:<p className="muted">Todavía no tiene valoraciones.</p>}
    </section>
  </section>;
}
