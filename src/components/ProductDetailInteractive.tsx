'use client';
import {useState, useEffect} from 'react';
import Link from 'next/link';
import {api} from '@/lib/api';
import {money} from '@/lib/rules';
import {pesetaEquivalence, PESETA_DISCLAIMER, trackPesetaHelp} from '@/lib/pesetas';
import {useAuth} from '@/context/AuthContext';
import ProductQA from './ProductQA';

interface ProductDetailInteractiveProps {
  initialItem: any;
  slug: string;
  demo?: boolean;
}

export default function ProductDetailInteractive({initialItem, slug, demo = false}: ProductDetailInteractiveProps) {
  const {user} = useAuth();
  const [item, setItem] = useState<any>(initialItem);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [bid, setBid] = useState(
    initialItem ? String((initialItem.price_cents + (initialItem.bid_count ? 100 : 0)) / 100) : ''
  );
  const [selected, setSelected] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [confirmBuy, setConfirmBuy] = useState(false);
  const [notice, setNotice] = useState('');
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    trackPesetaHelp('peseta_help_view', { source: 'product_detail', item_id: initialItem?.id });
  }, [initialItem?.id]);

  // Fetch updated user-specific state (mine, isHighestBidder) if user is logged in
  useEffect(() => {
    if (demo || !user || !initialItem?.id) return;
    let active = true;
    api('listing/' + initialItem.id)
      .then((l) => {
        if (active) {
          setItem((prev: any) => ({...prev, ...l}));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user, initialItem?.id, demo]);

  async function action(kind: string) {
    setBusy(true);
    setError('');
    const target = item?.id || slug;
    try {
      if (kind === 'bid') {
        await api('bid/' + target, {amount: bid});
        const updated = await api('listing/' + target);
        setItem(updated);
        setBid(String((updated.price_cents + (updated.bid_count ? 100 : 0)) / 100));
        setNotice('Tu puja se ha registrado. Encontrarás el seguimiento en Mi actividad.');
        setConfirm(false);
      } else if (kind === 'report') {
        await api('report/' + target, {reason});
        setNotice('Aviso registrado para revisión.');
        setReport(false);
      } else {
        const r = await api('checkout/' + target, {});
        window.location.assign(r.url);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function removeStory() {
    if (!item?.id) return;
    setBusy(true);
    setError('');
    try {
      await api('remove-story/' + item.id, {});
      setItem((prev: any) => ({...prev, story: null}));
      setNotice('La historia se ha retirado del anuncio.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!item) {
    return (
      <div className="empty-state">
        <h1>{error ? 'No se encuentra el artículo' : 'Cargando artículo…'}</h1>
        <p>{error}</p>
        <Link href="/" className="button">Volver al catálogo</Link>
      </div>
    );
  }

  const auction = item.mode === 'auction';

  return (
    <div className="detail-layout">
      <section>
        <div className="detail-photo">
          <img src={item.images[selected]} alt={item.title} />
        </div>
        {item.images.length > 1 && (
          <div className="photo-thumbs">
            {item.images.map((url: string, i: number) => (
              <button
                key={url}
                onClick={() => setSelected(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-pressed={selected === i}
              >
                <img src={url} alt="" />
              </button>
            ))}
          </div>
        )}
        <div className="detail-description">
          {item.mine && (item.pendingQuestionsCount || 0) > 0 && (
            <div className="seller-alert-banner" role="status">
              <div>
                <strong>Tienes {item.pendingQuestionsCount} pregunta{item.pendingQuestionsCount === 1 ? '' : 's'} sin responder.</strong>
                <p className="m-0 text-xs text-emerald-900">Los compradores potenciales tienen dudas sobre este artículo.</p>
              </div>
              <a href="#qa-heading" className="button text-xs py-1 px-3">
                Ver preguntas ↓
              </a>
            </div>
          )}
          <h2>Todo sobre este artículo</h2>
          <div className="detail-chips">
            <span>{item.condition}</span>
            <span>{item.category}</span>
            <span>{item.location}</span>
            {item.story && <span className="story-chip">Con historia</span>}
          </div>
          <p className="whitespace-pre-wrap">{item.description}</p>
          {item.story && (
            <section className="detail-story-box" aria-labelledby="story-heading">
              <h3 id="story-heading">La historia de este objeto</h3>
              <p className="whitespace-pre-wrap">{item.story}</p>
              {item.mine && !demo && (
                <div className="story-actions">
                  <button
                    type="button"
                    onClick={removeStory}
                    disabled={busy}
                    className="button secondary text-xs py-1 px-3"
                  >
                    Retirar historia
                  </button>
                </div>
              )}
            </section>
          )}
          <h3>Entrega</h3>
          <p>
            {item.delivery === 'shipping'
              ? `Envío a España · ${money(item.shipping_cents)}. El vendedor organiza el envío.`
              : `Recogida en persona en ${item.location}. La dirección exacta se acuerda por el chat tras la reserva.`}
          </p>
        </div>

        <ProductQA
          listingId={item.id}
          isSeller={!!item.mine}
          user={user}
          demo={demo}
        />
      </section>

      <aside className="purchase-panel">
        <div className="detail-panel-tags">
          <span className={`sale-tag static-tag ${auction ? 'auction' : ''}`}>
            {auction ? 'Subasta' : 'Precio cerrado'}
          </span>
          {item.story && (
            <span className="sale-tag static-tag story-badge-panel">Con historia</span>
          )}
        </div>
        <h1>{item.title}</h1>
        {item.seller?.alias&&<Link className="profile-link detail-seller" href={`/usuarios/${item.seller.alias}`}>Vendido por @{item.seller.alias}</Link>}
        <div className="detail-price-box">
          <div className="detail-price">{money(item.price_cents)}</div>
          <div className="peseta-badge-row">
            <span className="peseta-approx">{pesetaEquivalence(item.price_cents, true)}</span>
            <button
              type="button"
              className="peseta-help-tag"
              title={PESETA_DISCLAIMER}
              onClick={() => trackPesetaHelp('peseta_help_click', { source: 'detail_price_tag' })}
            >
              {PESETA_DISCLAIMER}
            </button>
          </div>
        </div>
        <p className="muted">
          {auction
            ? `${item.bid_count} pujas · ${
                item.ends_at
                  ? 'Finaliza ' + new Date(item.ends_at).toLocaleString('es-ES')
                  : 'Ejemplo de subasta'
              }`
            : 'Este es el precio. Sin ofertas ni regateos.'}
        </p>
        {notice && (
          <div className="notice" role="status">
            {notice}
          </div>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        {auction&&<section className="bid-history" aria-label="Historial de pujas">
          <h2>Últimas pujas</h2>
          {item.bids?.length?item.bids.map((entry:any)=><div className="bid-row" key={entry.id}>
            <Link className="profile-link" href={`/usuarios/${entry.bidder.alias}`}>@{entry.bidder.alias}</Link>
            <div className="bid-price-cell text-right">
              <strong>{money(entry.amount_cents)}</strong>
              <span className="peseta-approx block text-xs">{pesetaEquivalence(entry.amount_cents, true)}</span>
            </div>
            <small>{new Date(entry.created_at).toLocaleString('es-ES')}</small>
          </div>):<p className="muted">Todavía no hay pujas.</p>}
        </section>}
        {item.status !== 'available' ? (
          item.mine && item.status === 'reserved' ? (
            <div className="seller-alert-banner" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', flexDirection: 'column', alignItems: 'stretch' }}>
              <div>
                <strong className="text-emerald-950 block mb-1">Artículo reservado · Tienes una venta en curso</strong>
                <p className="m-0 text-xs text-emerald-900">
                  Un comprador ha reservado este artículo. Entra a Mi actividad para chatear, acordar la entrega o confirmar el cobro en persona.
                </p>
              </div>
              <Link href="/my-products" className="button primary text-xs py-2 px-3 text-center mt-2">
                Ir a Mi actividad para chatear →
              </Link>
            </div>
          ) : (
            <div className="notice">
              {item.status === 'reserved'
                ? 'Este artículo está reservado actualmente (48 horas de reserva).'
                : 'Este artículo ya no está disponible.'}
            </div>
          )
        ) : demo ? (
          <Link className="button primary w-full" href="/register">
            Crear mi cuenta
          </Link>
        ) : item.mine ? (
          <div className="notice">
            Este es tu anuncio.{' '}
            <Link className="underline" href="/my-products">
              Gestionar en Mi actividad
            </Link>
          </div>
        ) : !user ? (
          <Link href="/login" className="button primary w-full">
            Entrar para {auction ? 'pujar' : 'comprar'}
          </Link>
        ) : (
          <>
            {auction && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setConfirm(true);
                }}
              >
                <div className="flex justify-between items-baseline">
                  <label htmlFor="bid">Tu puja (€)</label>
                  {Number(bid) > 0 && (
                    <span className="peseta-approx text-xs">
                      {pesetaEquivalence(Number(bid))}
                    </span>
                  )}
                </div>
                <input
                  className="field-input"
                  id="bid"
                  type="number"
                  step="0.01"
                  min={(item.price_cents + (item.bid_count ? 100 : 0)) / 100}
                  value={bid}
                  onChange={(e) => setBid(e.target.value)}
                  required
                />
                <button className="button primary w-full" disabled={busy} type="submit">
                  Revisar puja
                </button>
              </form>
            )}
            {confirm && (
              <div className="confirmation" role="group" aria-label="Confirmar puja">
                <strong>Confirmar una puja de {money(Math.round(Number(bid) * 100))}</strong>
                <span className="peseta-approx block mt-1 text-xs">
                  {pesetaEquivalence(Number(bid))}
                </span>
                <p className="text-xs text-stone-600 mt-1 mb-2 font-medium">
                  {PESETA_DISCLAIMER}
                </p>
                <p>
                  Si ganas, tendrás 24 horas para pagar. Las pujas en los últimos 2 minutos amplían
                  el cierre otros 2 minutos.
                </p>
                <button className="button primary" disabled={busy} onClick={() => action('bid')}>
                  Confirmar puja
                </button>
                <button className="button" onClick={() => setConfirm(false)}>
                  Volver
                </button>
              </div>
            )}
            {confirmBuy ? (
              <div className="confirmation mt-3" role="dialog" aria-labelledby="confirm-buy-title">
                <strong id="confirm-buy-title" className="block text-base mb-1">
                  ¿Confirmar la compra de este artículo?
                </strong>
                <p className="mb-1">
                  Total a abonar:{' '}
                  <strong>
                    {money((auction ? item.buy_now_cents : item.price_cents) + item.shipping_cents)}
                  </strong>
                  {item.shipping_cents > 0 ? ' (envío incluido)' : ' (recogida en persona)'}.
                </p>
                <p className="peseta-approx text-xs mb-1">
                  {pesetaEquivalence(
                    (auction ? item.buy_now_cents : item.price_cents) + item.shipping_cents,
                    true
                  )}
                </p>
                <p className="text-xs text-stone-600 mb-2 font-medium">
                  {PESETA_DISCLAIMER}
                </p>
                <div className="notice text-xs mb-3">
                  Al confirmar, el artículo quedará <strong>reservado para ti durante 48 horas</strong> para formalizar el pago y acordar la entrega. Recuerda que no abonar una reserva en plazo puede conllevar <strong>penalizaciones en tu cuenta</strong> según nuestra{' '}
                  <Link href="/politica-de-compras" target="_blank" className="underline font-semibold">
                    política de compras
                  </Link>.
                </div>
                <div className="flex gap-2">
                  <button
                    className="button primary flex-1"
                    disabled={busy}
                    onClick={() => action('checkout')}
                  >
                    {busy ? 'Reservando…' : 'Confirmar y reservar'}
                  </button>
                  <button
                    type="button"
                    className="button"
                    disabled={busy}
                    onClick={() => setConfirmBuy(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              (!auction || item.buy_now_cents) && (
                <div>
                  <button
                    className={`button ${auction ? 'secondary' : 'primary'} w-full mt-3`}
                    disabled={busy}
                    onClick={() => setConfirmBuy(true)}
                  >
                    {busy
                      ? 'Preparando…'
                      : `Comprar ahora · ${money(
                          (auction ? item.buy_now_cents : item.price_cents) + item.shipping_cents
                        )}`}
                  </button>
                  <span className="peseta-approx text-center block mt-1 text-xs">
                    {pesetaEquivalence(
                      (auction ? item.buy_now_cents : item.price_cents) + item.shipping_cents,
                      true
                    )}
                  </span>
                </div>
              )
            )}
          </>
        )}
        <div className="purchase-promise">
          <strong>Un trato claro, de principio a fin.</strong>
          <p>
            El chat se habilita al reservar el artículo. Úsalo para acordar la forma de pago (en persona o por plataforma) y los detalles de entrega.
          </p>
          <div className="flex flex-col gap-1 mt-2 text-sm">
            <Link href="/como-funciona" className="underline">
              Ver cómo funciona
            </Link>
            <Link href="/politica-de-compras" className="underline">
              Política de compras y reservas de 48 h
            </Link>
          </div>
        </div>
        {!demo && user && (
          <button className="text-link" onClick={() => setReport(!report)}>
            Informar de este anuncio
          </button>
        )}
        {report && (
          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              action('report');
            }}
          >
            <label htmlFor="report">¿Qué ocurre con el anuncio?</label>
            <textarea
              id="report"
              className="field-input"
              required
              minLength={10}
              maxLength={2000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <button className="button" disabled={busy}>
              Enviar aviso
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
