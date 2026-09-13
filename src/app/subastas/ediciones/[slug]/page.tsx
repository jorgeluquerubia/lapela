import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {getAuctionEditionBySlug} from '@/models/marketplace';
import {formatCountdown} from '@/lib/featured-auctions';
import ProductCard from '@/components/ProductCard';
import {money} from '@/lib/rules';
import {pesetaEquivalence} from '@/lib/pesetas';

interface EditionPageProps {
  params: Promise<{slug: string}>;
}

export async function generateMetadata({params}: EditionPageProps): Promise<Metadata> {
  const {slug} = await params;
  const edition = await getAuctionEditionBySlug(slug);
  if (!edition) {
    return {
      title: 'Edición no encontrada · La Pela',
      robots: {index: false, follow: false},
    };
  }

  const title = `${edition.title} · La Subasta de la Pela`;
  const description = edition.description || `Selección coordinada de subastas en La Pela. Cierre concentrado y sin regateos.`;
  const url = `/subastas/ediciones/${edition.slug}`;

  return {
    title,
    description,
    alternates: {canonical: url},
    openGraph: {
      title,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function EditionPage({params}: EditionPageProps) {
  const {slug} = await params;
  const edition = await getAuctionEditionBySlug(slug);

  if (!edition) {
    notFound();
  }

  const now = new Date();
  const isUpcoming = edition.temporal_status === 'upcoming';
  const isEnded = edition.temporal_status === 'ended';
  const isActive = edition.temporal_status === 'active';

  const targetDate = isUpcoming ? edition.starts_at : edition.reference_ends_at;
  const countdownText = formatCountdown(targetDate, now);

  const formattedStarts = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(edition.starts_at));

  const formattedEnds = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(edition.reference_ends_at));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: edition.title,
    description: edition.description,
    url: `/subastas/ediciones/${edition.slug}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: '/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Subastas',
          item: '/subastas',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: edition.title,
          item: `/subastas/ediciones/${edition.slug}`,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      <div className="breadcrumbs">
        <Link href="/">Inicio</Link>
        <span>/</span>
        <Link href="/subastas">Subastas</Link>
        <span>/</span>
        <span>{edition.title}</span>
      </div>

      <div className="edition-page-layout">
        <header className="edition-hero">
          <div className="edition-hero-badges">
            <span className="featured-pill-brand">★ La Subasta de la Pela</span>
            <span
              className={`featured-pill-status ${
                isUpcoming ? 'upcoming' : isEnded ? 'ended' : 'active'
              }`}
            >
              {isUpcoming ? 'Próximamente' : isEnded ? 'Edición finalizada' : 'En curso'}
            </span>
          </div>

          <h1>{edition.title}</h1>
          {edition.description && <p className="edition-desc">{edition.description}</p>}

          <div className="edition-meta-banner">
            <div className="edition-dates">
              <div>
                <span className="meta-label">Apertura:</span>
                <strong>{formattedStarts}</strong>
              </div>
              <div>
                <span className="meta-label">Cierre de referencia:</span>
                <strong>{formattedEnds}</strong>
              </div>
            </div>

            <div className="edition-countdown-box" role="timer" aria-label="Tiempo restante de la edición">
              <span className="meta-label">
                {isUpcoming ? 'Tiempo para el inicio' : isEnded ? 'Estado' : 'Cierre de la edición'}
              </span>
              <strong className="countdown-display">{countdownText}</strong>
              <small className="muted">Ventana editorial informativa</small>
            </div>
          </div>
        </header>

        {isEnded ? (
          <section className="edition-results-section" aria-label="Resultados de la subasta">
            <div className="results-header">
              <h2>Resultados de la edición</h2>
              <p className="muted">
                Esta edición ha finalizado. A continuación se detallan los resultados de cada artículo.
              </p>
            </div>

            <div className="results-grid">
              {edition.items?.map((item) => {
                const isSold = ['sold', 'paid', 'pending_payment'].includes(item.status);
                return (
                  <article key={item.id} className="result-card">
                    <div className="result-image">
                      <img src={item.image} alt={item.name} />
                      <span className={`result-tag ${isSold ? 'sold' : 'unsold'}`}>
                        {isSold ? 'Adjudicado' : 'Sin venta'}
                      </span>
                    </div>
                    <div className="result-info">
                      <Link href={`/articulos/${item.slug || item.id}`}>
                        <h3>{item.name}</h3>
                      </Link>
                      <div className="result-price-row">
                        <strong>
                          {new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(item.price)}
                        </strong>
                        <span className="peseta-approx">
                          {pesetaEquivalence(item.price)}
                        </span>
                      </div>
                      <div className="result-details">
                        <span>{item.bid_count || 0} pujas registradas</span>
                        <span className="result-outcome">
                          {isSold ? 'Vendido a ganador' : 'Sin pujas suficientes'}
                        </span>
                      </div>
                      <Link
                        href={`/articulos/${item.slug || item.id}`}
                        className="button secondary text-xs w-full mt-2"
                      >
                        Ver ficha del artículo
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="edition-items-section" aria-label="Artículos en subasta">
            <div className="section-head">
              <h2>Artículos seleccionados ({edition.items?.length || 0})</h2>
              <p className="muted">
                Cada artículo conserva su cierre independiente y regla anti-sniping.
              </p>
            </div>

            <div className="product-grid">
              {edition.items?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
