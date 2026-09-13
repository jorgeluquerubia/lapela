'use client';

import {useEffect, useState, useCallback} from 'react';
import Link from 'next/link';
import type {AuctionEdition, Product} from '@/types';
import ProductCard from '@/components/ProductCard';
import {
  formatCountdown,
  getEditionTemporalStatus,
  getItemAuctionOutcome,
  type TemporalStatus,
} from '@/lib/featured-auctions';
import {pesetaEquivalence} from '@/lib/pesetas';

interface EditionDetailInteractiveProps {
  initialEdition: AuctionEdition;
}

export default function EditionDetailInteractive({
  initialEdition,
}: EditionDetailInteractiveProps) {
  const [edition, setEdition] = useState<AuctionEdition>(initialEdition);
  const [now, setNow] = useState<Date>(() => new Date());

  // Reloj reactivo: actualiza cada segundo para evitar cuentas atrás congeladas
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Estado temporal recalculado dinámicamente según el reloj local
  const currentTemporalStatus: TemporalStatus = getEditionTemporalStatus(
    edition.starts_at,
    edition.reference_ends_at,
    now
  );

  const isUpcoming = currentTemporalStatus === 'upcoming';
  const isEnded = currentTemporalStatus === 'ended';
  const isActive = currentTemporalStatus === 'active';

  const targetDate = isUpcoming ? edition.starts_at : edition.reference_ends_at;
  const countdownText = formatCountdown(targetDate, now);

  // Recarga silenciosa de datos cuando cambia el estado temporal o periódicamente si está activa
  const refreshEdition = useCallback(async () => {
    try {
      const res = await fetch(`/api/market/auction-edition/${edition.slug}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.id) {
          setEdition(data);
        }
      }
    } catch {
      // Si falla la red, conserva el estado previo
    }
  }, [edition.slug]);

  // Si cambia el estado temporal respecto al cargado inicialmente, recargar datos frescos
  useEffect(() => {
    if (edition.temporal_status !== currentTemporalStatus) {
      refreshEdition();
    }
  }, [currentTemporalStatus, edition.temporal_status, refreshEdition]);

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

  return (
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

          <div
            className="edition-countdown-box"
            role="timer"
            aria-label="Tiempo restante de la edición"
            aria-live="polite"
          >
            <span className="meta-label">
              {isUpcoming
                ? 'Tiempo para el inicio'
                : isEnded
                ? 'Estado'
                : 'Cierre de la edición'}
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
            {edition.items?.map((item: Product) => {
              const outcome = getItemAuctionOutcome(
                {
                  status: item.status,
                  ends_at: item.auction_ends_at,
                  bid_count: item.bid_count,
                },
                now
              );

              const isItemActive = outcome.status === 'active';
              const isAwarded = outcome.status === 'awarded';

              return (
                <article key={item.id} className="result-card">
                  <div className="result-image">
                    <img src={item.image} alt={item.name} />
                    <span
                      className={`result-tag ${
                        isItemActive ? 'active' : isAwarded ? 'sold' : 'unsold'
                      }`}
                    >
                      {outcome.label}
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
                      <span
                        className={`result-outcome ${
                          isItemActive ? 'active-extension' : ''
                        }`}
                      >
                        {outcome.detail}
                      </span>
                    </div>

                    <Link
                      href={`/articulos/${item.slug || item.id}`}
                      className={`button ${
                        isItemActive ? 'primary' : 'secondary'
                      } text-xs w-full mt-2`}
                    >
                      {isItemActive ? 'Pujar ahora (prórroga activa)' : 'Ver ficha del artículo'}
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
            {edition.items?.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
