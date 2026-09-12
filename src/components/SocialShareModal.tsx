'use client';
import {useEffect, useState, useRef} from 'react';
import {money} from '@/lib/rules';
import {pesetaEquivalence} from '@/lib/pesetas';

export interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    price_cents: number;
    mode: string;
    slug: string;
    images?: string[];
  };
}

export default function SocialShareModal({isOpen, onClose, item}: SocialShareModalProps) {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanShare(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Focus close button on open
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cardImageUrl = `/api/social-card/${item.slug}`;
  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/articulos/${item.slug}`;
    }
    return `/articulos/${item.slug}`;
  };

  const handleNativeShare = async () => {
    if (!canShare || typeof navigator === 'undefined') return;
    const shareUrl = getShareUrl();
    try {
      await navigator.share({
        title: `${item.title} · ${money(item.price_cents)} en La Pela`,
        text: `${item.title} · ${money(item.price_cents)} (${pesetaEquivalence(
          item.price_cents,
          true
        )}) en La Pela. Segunda mano sin regateos.`,
        url: shareUrl,
      });
    } catch (err: unknown) {
      // User cancelled native share: do not treat as an error (AC-03)
      if ((err as Error)?.name === 'AbortError') {
        return;
      }
    }
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = getShareUrl();
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback silent
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadNotice('');
    try {
      const response = await fetch(cardImageUrl);
      if (!response.ok) throw new Error('No se ha podido generar la tarjeta');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `la-pela-${item.slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      setDownloadNotice('Descarga preparada');
      setTimeout(() => setDownloadNotice(''), 3000);
    } catch {
      setDownloadNotice('Error al descargar la tarjeta');
      setTimeout(() => setDownloadNotice(''), 3000);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="share-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="share-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="share-modal-header">
          <div>
            <h2 id="share-modal-title" className="share-modal-heading">
              Compartir anuncio
            </h2>
            <p className="share-modal-subtitle">
              Comparte la tarjeta visual con fotografía, precio en euros y pesetas
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="share-modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal de compartir"
          >
            ✕
          </button>
        </div>

        {/* Card visual preview */}
        <div className="share-card-preview-container">
          {!imgLoaded && (
            <div className="share-card-skeleton" aria-hidden="true">
              <span>Cargando vista previa de la tarjeta…</span>
            </div>
          )}
          <img
            src={cardImageUrl}
            alt={`Tarjeta para compartir de ${item.title}`}
            className={`share-card-preview-img ${imgLoaded ? 'loaded' : 'loading'}`}
            onLoad={() => setImgLoaded(true)}
          />
        </div>

        {/* Live status announcements */}
        <div className="sr-only" role="status" aria-live="polite">
          {copied ? '¡Enlace copiado al portapapeles!' : ''}
          {downloadNotice ? downloadNotice : ''}
        </div>

        {/* Feedback badges */}
        {copied && (
          <div className="share-feedback-notice" role="status">
            ✓ ¡Enlace copiado al portapapeles!
          </div>
        )}
        {downloadNotice && (
          <div className="share-feedback-notice" role="status">
            ✓ {downloadNotice}
          </div>
        )}

        {/* Share actions */}
        <div className="share-actions-grid">
          {canShare && (
            <button
              type="button"
              className="button primary share-action-btn"
              onClick={handleNativeShare}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Compartir
            </button>
          )}

          <button
            type="button"
            className="button secondary share-action-btn"
            onClick={handleCopyLink}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? '¡Copiado!' : 'Copiar enlace'}
          </button>

          <button
            type="button"
            className="button secondary share-action-btn"
            disabled={downloading}
            onClick={handleDownload}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloading ? 'Preparando…' : 'Descargar imagen'}
          </button>
        </div>

        <div className="share-modal-footer">
          <button
            type="button"
            className="button share-modal-cancel-btn"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
