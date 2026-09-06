'use client';
import {useState, useEffect} from 'react';
import Link from 'next/link';
import {api} from '@/lib/api';
import {money} from '@/lib/rules';
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
  const [notice, setNotice] = useState('');
  const [report, setReport] = useState(false);
  const [reason, setReason] = useState('');

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
          </div>
          <p className="whitespace-pre-wrap">{item.description}</p>
          <h3>Entrega</h3>
          <p>
            {item.delivery === 'shipping'
              ? `Envío a España · ${money(item.shipping_cents)}. El vendedor organiza el envío.`
              : `Recogida en persona en ${item.location}. La dirección exacta se acuerda tras el pago.`}
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
        <span className={`sale-tag static-tag ${auction ? 'auction' : ''}`}>
          {auction ? 'Subasta' : 'Precio cerrado'}
        </span>
        <h1>{item.title}</h1>
        <div className="detail-price">{money(item.price_cents)}</div>
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
        {item.status !== 'available' ? (
          <div className="notice">Este artículo ya no está disponible.</div>
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
                <label htmlFor="bid">Tu puja (€)</label>
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
            {(!auction || item.buy_now_cents) && (
              <button
                className={`button ${auction ? 'secondary' : 'primary'} w-full mt-3`}
                disabled={busy}
                onClick={() => action('checkout')}
              >
                {busy
                  ? 'Preparando…'
                  : `Comprar ahora · ${money(
                      (auction ? item.buy_now_cents : item.price_cents) + item.shipping_cents
                    )}`}
              </button>
            )}
          </>
        )}
        <div className="purchase-promise">
          <strong>Un trato claro, de principio a fin.</strong>
          <p>
            El chat se habilita cuando el pago está confirmado. Úsalo para acordar el envío o la
            recogida.
          </p>
          <Link href="/como-funciona" className="underline">
            Ver cómo funciona
          </Link>
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
