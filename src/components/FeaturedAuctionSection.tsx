'use client';
import {useEffect, useState} from 'react';
import Link from 'next/link';
import type {AuctionEdition} from '@/types';
import ProductCard from './ProductCard';
import {formatCountdown} from '@/lib/featured-auctions';

interface FeaturedAuctionSectionProps {
  edition?: AuctionEdition | null;
}

export default function FeaturedAuctionSection({edition: initialEdition}: FeaturedAuctionSectionProps) {
  const [edition, setEdition] = useState<AuctionEdition | null | undefined>(initialEdition);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (initialEdition !== undefined) {
      setEdition(initialEdition);
      return;
    }

    let active = true;
    fetch('/api/market/featured-edition')
      .then((res) => {
        if (!res.ok) throw Error('No se pudo cargar la edición destacada');
        return res.json();
      })
      .then((data) => {
        if (active) setEdition(data || null);
      })
      .catch(() => {
        if (active) setEdition(null);
      });

    return () => {
      active = false;
    };
  }, [initialEdition]);

  // Actualización periódica del reloj para cuenta atrás textual sin animaciones forzadas
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  if (!edition || !edition.items || edition.items.length === 0) {
    return null;
  }

  const isUpcoming = edition.temporal_status === 'upcoming';
  const isEnded = edition.temporal_status === 'ended';
  const targetDate = isUpcoming ? edition.starts_at : edition.reference_ends_at;
  const countdownText = formatCountdown(targetDate, now);

  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(targetDate));

  return (
    <section className="featured-edition-block" aria-label="La Subasta de la Pela">
      <div className="featured-edition-hero">
        <div className="featured-edition-header">
          <div className="featured-edition-badges">
            <span className="featured-pill-brand">★ La Subasta de la Pela</span>
            <span
              className={`featured-pill-status ${
                isUpcoming ? 'upcoming' : isEnded ? 'ended' : 'active'
              }`}
            >
              {isUpcoming ? 'Próximamente' : isEnded ? 'Finalizada' : 'En curso'}
            </span>
          </div>
          <h2>{edition.title}</h2>
          {edition.description && <p className="featured-edition-desc">{edition.description}</p>}
        </div>

        <div className="featured-edition-meta">
          <div className="featured-countdown" role="timer" aria-label="Tiempo restante de la edición">
            <span className="countdown-label">
              {isUpcoming ? 'Apertura de la edición' : isEnded ? 'Cierre editorial' : 'Cierre de la edición'}
            </span>
            <strong className="countdown-value">{countdownText}</strong>
            <small className="countdown-absolute">Cierre de referencia: {formattedDate}</small>
          </div>

          <Link
            href={`/subastas/ediciones/${edition.slug}`}
            className="button primary featured-view-all"
          >
            Ver selección ({edition.items.length}) →
          </Link>
        </div>
      </div>

      <div className="featured-products-grid" aria-label="Artículos de esta edición">
        {edition.items.slice(0, 6).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
