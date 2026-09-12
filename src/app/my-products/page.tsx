'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { money } from '@/lib/rules';
import { useAuth } from '@/context/AuthContext';
import { productSlug } from '@/lib/slugs';

const labels: Record<string, string> = {
  available: 'A la venta',
  reserved: 'Reservado',
  sold: 'Vendido',
  expired: 'Finalizado',
  withdrawn: 'Retirado',
  pending_payment: 'Pendiente de pago',
  paid: 'Pagado',
  shipped: 'Enviado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  disputed: 'En revisión',
};

function ActivityContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState('purchases');
  const [error, setError] = useState('');
  const [withdraw, setWithdraw] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t && ['purchases', 'sales', 'bids', 'favorites', 'listings', 'questions'].includes(t)) {
      setTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      api('activity').then(setData).catch((e) => setError(e.message));
    }
  }, [user]);

  async function remove() {
    setBusy(true);
    try {
      await api('withdraw/' + withdraw, {});
      setData(await api('activity'));
      setWithdraw('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeFavorite(listingId: string) {
    setBusy(true);
    try {
      await api('favorite/' + listingId, { active: false });
      setData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          favorites: (prev.favorites || []).filter((f: any) => f.id !== listingId)
        };
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p>Cargando…</p>;

  if (!user) {
    return (
      <div className="empty-state">
        <h1>Tus tratos, en un solo sitio.</h1>
        <p>Entra para seguir tus compras, ventas y pujas.</p>
        <Link href="/login" className="button primary">
          Entrar
        </Link>
      </div>
    );
  }

  const rows = !data
    ? []
    : tab === 'listings'
    ? data.listings
    : tab === 'bids'
    ? data.bids
    : tab === 'questions'
    ? []
    : data.orders.filter((o: any) =>
        tab === 'purchases' ? o.buyer_id === user.id : o.seller_id === user.id
      );

  const pendingQuestionsCount = data?.pendingQuestionsCount || 0;
  const sellerQuestions = data?.sellerQuestions || [];
  const buyerQuestions = data?.buyerQuestions || [];
  const notifications: any[] = data?.notifications || [];
  const favorites: any[] = data?.favorites || [];

  const purchasesUnreadCount = data?.orders
    ? data.orders
        .filter((o: any) => o.buyer_id === user?.id)
        .filter((o: any) => notifications.some((n: any) => n.order_id === o.id)).length
    : 0;

  const salesUnreadCount = data?.orders
    ? data.orders
        .filter((o: any) => o.seller_id === user?.id)
        .filter((o: any) => notifications.some((n: any) => n.order_id === o.id)).length
    : 0;

  const bidsUnreadCount = data?.bids
    ? data.bids.filter((b: any) =>
        notifications.some(
          (n: any) => n.listing_id === (b.listing_id || b.id) && n.type === 'outbid'
        )
      ).length
    : 0;

  return (
    <>
      <div className="catalog-head">
        <div>
          <span className="eyebrow">TU ESPACIO</span>
          <h1>Mi actividad</h1>
        </div>
        <Link className="button primary" href="/publish-ad">
          ＋ Vender un artículo
        </Link>
      </div>

      {pendingQuestionsCount > 0 && (
        <div className="seller-alert-banner" role="status">
          <div>
            <strong>
              Tienes {pendingQuestionsCount} pregunta{pendingQuestionsCount === 1 ? '' : 's'} pendiente{pendingQuestionsCount === 1 ? '' : 's'} de responder.
            </strong>
            <p className="m-0 text-xs">
              Responde a los compradores para resolver dudas sobre tus productos.
            </p>
          </div>
          <button
            className="button text-xs py-1 px-3"
            onClick={() => setTab('questions')}
          >
            Ver preguntas
          </button>
        </div>
      )}

      <div className="mode-tabs activity-tabs">
        {[
          ['purchases', `Compras${purchasesUnreadCount > 0 ? ` (${purchasesUnreadCount})` : ''}`],
          ['sales', `Ventas${salesUnreadCount > 0 ? ` (${salesUnreadCount})` : ''}`],
          ['bids', `Mis pujas${bidsUnreadCount > 0 ? ` (${bidsUnreadCount})` : ''}`],
          ['favorites', `Favoritos${favorites.length > 0 ? ` (${favorites.length})` : ''}`],
          ['listings', 'Mis anuncios'],
          ['questions', `Preguntas${pendingQuestionsCount > 0 ? ` (${pendingQuestionsCount})` : ''}`],
        ].map(([v, t]) => (
          <button
            key={v}
            className={tab === v ? 'active' : ''}
            onClick={() => setTab(v)}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <p className="error-message">{error}</p>}

      {!data && !error ? (
        <p>Cargando actividad…</p>
      ) : tab === 'questions' ? (
        <div className="space-y-6">
          {/* Preguntas como vendedor */}
          <section className="border border-stone-200 rounded-xl p-5 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold m-0">Preguntas recibidas en tus anuncios</h2>
              {sellerQuestions.length > 0 && (
                <span className="qa-badge">{sellerQuestions.length} pendientes</span>
              )}
            </div>

            {sellerQuestions.length === 0 ? (
              <p className="muted text-sm m-0">
                No tienes preguntas pendientes de respuesta en tus productos.
              </p>
            ) : (
              <div className="activity-list">
                {sellerQuestions.map((q: any) => {
                  const l = q.listing || {};
                  const slug = productSlug(q.listing_id, l.title || 'articulo');
                  return (
                    <article key={q.id} className="activity-row">
                      {l.images?.[0] && <img src={l.images[0]} alt={l.title || ''} />}
                      <div>
                        <h3>
                          <Link href={`/articulos/${slug}#qa-heading`}>
                            {l.title || 'Artículo'}
                          </Link>
                        </h3>
                        <p className="font-medium text-sm text-stone-800 my-1">"{q.question}"</p>
                        <p className="muted text-xs">
                          Recibida el {new Date(q.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <Link className="button primary text-xs py-2 px-3" href={`/articulos/${slug}#qa-heading`}>
                        Responder →
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* Preguntas como comprador */}
          <section className="border border-stone-200 rounded-xl p-5 bg-white">
            <h2 className="text-lg font-bold m-0 mb-4">Tus preguntas sobre otros artículos</h2>
            {buyerQuestions.length === 0 ? (
              <p className="muted text-sm m-0">
                No has realizado preguntas sobre otros productos todavía.
              </p>
            ) : (
              <div className="activity-list">
                {buyerQuestions.map((q: any) => {
                  const l = q.listing || {};
                  const slug = productSlug(q.listing_id, l.title || 'articulo');
                  return (
                    <article key={q.id} className="activity-row">
                      {l.images?.[0] && <img src={l.images[0]} alt={l.title || ''} />}
                      <div>
                        <h3>
                          <Link href={`/articulos/${slug}#qa-heading`}>
                            {l.title || 'Artículo'}
                          </Link>
                        </h3>
                        <p className="font-medium text-sm text-stone-800 my-1">"{q.question}"</p>
                        {q.answer ? (
                          <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-xs text-emerald-900 mt-1">
                            <strong>Respuesta del vendedor:</strong> {q.answer}
                          </div>
                        ) : (
                          <span className="qa-answer-pending text-xs">
                            Pendiente de respuesta del vendedor
                          </span>
                        )}
                      </div>
                      <Link className="button text-xs py-2 px-3" href={`/articulos/${slug}#qa-heading`}>
                        Ver artículo →
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : tab === 'favorites' ? (
        !favorites.length ? (
          <div className="empty-state">
            <h2>No tienes artículos en favoritos</h2>
            <p>Guarda los artículos que te interesen para seguirlos de cerca y recibir avisos cuando vayan a terminar.</p>
            <Link href="/" className="button primary">
              Explorar artículos
            </Link>
          </div>
        ) : (
          <div className="activity-list">
            {favorites.map((fav: any) => {
              const slug = fav.slug || productSlug(fav.id, fav.name || fav.title);
              const title = fav.name || fav.title || 'Artículo';
              const isAuction = fav.type === 'auction' || fav.mode === 'auction';
              const isUnavailable = ['sold', 'withdrawn', 'expired'].includes(fav.status);
              const isReserved = fav.status === 'reserved';
              const timeRemaining = fav.ends_at ? Math.max(0, Math.ceil((Date.parse(fav.ends_at) - Date.now()) / 3600000)) : null;

              return (
                <article key={fav.id} className="activity-row">
                  <img src={fav.image || fav.images?.[0] || 'https://example.invalid/placeholder.jpg'} alt={title} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`sale-tag static-tag text-xs ${isAuction ? 'auction' : ''}`}>
                        {isAuction ? 'Subasta' : 'Precio cerrado'}
                      </span>
                      <span className="muted text-xs font-semibold">
                        {labels[fav.status] || fav.status}
                      </span>
                    </div>
                    <h3>
                      <Link href={'/articulos/' + slug}>
                        {title}
                      </Link>
                    </h3>
                    <p className="muted">
                      {fav.location || 'España'}{fav.seller ? ` · Vendido por @${fav.seller}` : ''}
                    </p>
                    {isAuction && fav.status === 'available' && fav.ends_at && (
                      <p className="text-xs text-emerald-800 font-medium my-1">
                        {timeRemaining !== null && timeRemaining > 0
                          ? `Finaliza en aprox. ${timeRemaining} h (${new Date(fav.ends_at).toLocaleString('es-ES')})`
                          : 'Subasta finalizada'}
                      </p>
                    )}
                    {isUnavailable && (
                      <p className="notice text-xs py-1 px-2 my-1">
                        {fav.status === 'sold'
                          ? 'Este artículo ya se ha vendido.'
                          : fav.status === 'withdrawn'
                          ? 'El vendedor ha retirado este anuncio.'
                          : 'Esta subasta ha finalizado.'}
                      </p>
                    )}
                    {isReserved && (
                      <p className="notice text-xs py-1 px-2 my-1">
                        Artículo reservado actualmente.
                      </p>
                    )}
                  </div>
                  <strong>{money(fav.price_cents || (fav.price ? Math.round(fav.price * 100) : 0))}</strong>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link className="button text-xs py-2 px-3" href={'/articulos/' + slug}>
                      Ver anuncio →
                    </Link>
                    <button
                      type="button"
                      className="button text-xs py-2 px-3"
                      disabled={busy}
                      onClick={() => removeFavorite(fav.id)}
                      aria-label={`Quitar ${title} de favoritos`}
                    >
                      Quitar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : !rows.length ? (
        <div className="empty-state">
          <h2>Todavía no hay actividad aquí</h2>
          <p>Los artículos y pedidos aparecerán aquí cuando participes.</p>
          <Link href="/" className="button">
            Explorar artículos
          </Link>
        </div>
      ) : (
        <div className="activity-list">
          {rows.map((r: any) => {
            const l = r.listing || r;
            const slug = productSlug(r.listing_id || r.id, l.title);
            const itemNotes = notifications.filter((n: any) => {
              if (tab === 'purchases' || tab === 'sales') {
                return n.order_id === r.id;
              }
              if (tab === 'bids') {
                return n.listing_id === (r.listing_id || r.id) && n.type === 'outbid';
              }
              if (tab === 'listings') {
                return n.listing_id === r.id;
              }
              return false;
            });

            const firstNote = itemNotes[0];
            const counterpart=tab==='purchases'?r.seller:tab==='sales'?r.buyer:tab==='bids'?r.seller:null;
            const chipClass = firstNote
              ? firstNote.type === 'new_message'
                ? 'notification-chip notification-chip-message'
                : firstNote.type === 'order_created'
                ? 'notification-chip notification-chip-sale'
                : firstNote.type === 'outbid'
                ? 'notification-chip notification-chip-outbid'
                : firstNote.type === 'bid_received'
                ? 'notification-chip notification-chip-bid'
                : 'notification-chip notification-chip-status'
              : '';

            return (
              <article key={r.id} className="activity-row">
                <img src={l.images[0]} alt={l.title} />
                <div>
                  <h3>
                    <Link
                      href={
                        tab === 'listings' || tab === 'bids'
                          ? '/articulos/' + slug
                          : '/orders/' + r.id
                      }
                    >
                      {l.title}
                    </Link>
                  </h3>
                  <p className="muted">
                    {labels[r.status || l.status] || r.status} ·{' '}
                    {new Date(r.created_at).toLocaleDateString('es-ES')}
                    {tab === 'listings' && (
                      <span className="seller-favorites-count ml-2 inline-flex items-center gap-1 font-medium text-stone-700">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="#dc2626" stroke="#dc2626" strokeWidth="2" aria-hidden="true">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        {r.favorites_count || 0} guardados
                      </span>
                    )}
                  </p>
                  {counterpart?.alias&&<Link className="profile-link" href={`/usuarios/${counterpart.alias}`}>{tab==='purchases'?'Vendido por':tab==='sales'?'Comprado por':'Subasta de'} @{counterpart.alias}</Link>}
                  {firstNote && (
                    <div>
                      <Link className={chipClass} role="status" href={'/articulos/' + slug} aria-label={`${firstNote.title}: ver artículo ${l.title}`}>
                        <span className="notification-dot" />
                        {firstNote.title}
                        {itemNotes.length > 1 ? ` (+${itemNotes.length - 1})` : ''}
                      </Link>
                    </div>
                  )}
                </div>
                <strong>{money(r.amount_cents || r.price_cents)}</strong>
                {tab === 'listings' ? (
                  r.status === 'available' && !r.bid_count ? (
                    <button className="button" onClick={() => setWithdraw(r.id)}>
                      Retirar
                    </button>
                  ) : null
                ) : tab !== 'bids' ? (
                  <Link className="button" href={'/orders/' + r.id}>
                    Ver pedido →
                  </Link>
                ) : (
                  <Link className="button" href={'/articulos/' + slug}>
                    Ver subasta →
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}

      {withdraw && (
        <div className="confirmation">
          <h2>¿Retirar este anuncio?</h2>
          <p>Se conservará en tu historial y dejará de estar a la venta.</p>
          <button className="button primary" disabled={busy} onClick={remove}>
            Retirar anuncio
          </button>
          <button className="button" onClick={() => setWithdraw('')}>
            Cancelar
          </button>
        </div>
      )}
    </>
  );
}

export default function Activity() {
  return (
    <Suspense fallback={<p>Cargando…</p>}>
      <ActivityContent />
    </Suspense>
  );
}

