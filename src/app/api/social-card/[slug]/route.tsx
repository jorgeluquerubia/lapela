import {ImageResponse} from 'next/og';
import {admin} from '@/models/marketplace';
import {extractIdFromSlug, productSlug} from '@/lib/slugs';
import {money, uuid} from '@/lib/rules';
import {pesetaEquivalence, PESETA_DISCLAIMER} from '@/lib/pesetas';

export const runtime = 'nodejs';

function isAllowedImageUrl(url: unknown): boolean {
  if (!url || typeof url !== 'string') return false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;
  const allowedPrefix = `${supabaseUrl}/storage/v1/object/public/product-images/`;
  return url.startsWith(allowedPrefix);
}

async function fetchSafeImageDataUri(url: string): Promise<string | null> {
  if (!isAllowedImageUrl(url)) return null;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(2000),
      headers: {Accept: 'image/jpeg,image/png,image/webp'},
    });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

function PesetaCoin({size}: {size: number}) {
  const pSize = Math.max(6, Math.round((size * 9) / 56));
  const lpSize = Math.max(9, Math.round((size * 14) / 56));
  const pTop = Math.max(2, Math.round((size * 3) / 56));
  const lpTop = Math.max(1, Math.round((size * 1) / 56));

  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 56 56"
        style={{position: 'absolute', top: 0, left: 0}}
      >
        <circle cx="28" cy="29" r="22" fill="#c07a3e" />
        <circle cx="28" cy="27" r="22" fill="#e8c796" />
        <circle cx="28" cy="27" r="17.5" fill="none" stroke="#b77943" strokeWidth="1.5" />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${size}px`,
          height: `${size}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: `${pSize}px`,
            fontWeight: 700,
            color: '#7a4b22',
            lineHeight: 1,
            marginTop: `${pTop}px`,
          }}
        >
          1 P
        </span>
        <span
          style={{
            fontSize: `${lpSize}px`,
            fontWeight: 700,
            color: '#1b3d2f',
            lineHeight: 1,
            marginTop: `${lpTop}px`,
          }}
        >
          lp
        </span>
      </div>
    </div>
  );
}

export async function GET(
  _request: Request,
  props: {params: Promise<{slug: string}>}
) {
  const {slug} = await props.params;
  if (!slug) {
    return new Response('Slug no proporcionado', {status: 400});
  }

  const id = extractIdFromSlug(slug);
  if (!id || !uuid(id)) {
    return new Response('Artículo no encontrado', {status: 404});
  }

  const env = process.env.LAPELA_PAYMENTS_MODE === 'simulated' ? 'sandbox' : 'live';
  const db = admin();
  const {data: item, error} = await db
    .from('lp_listings')
    .select('id,title,price_cents,mode,images,environment,status')
    .eq('id', id)
    .maybeSingle();

  if (error || !item || item.environment !== env || item.status !== 'available') {
    return new Response('Artículo no disponible', {status: 404});
  }

  const canonicalSlug = productSlug(item.id, item.title);
  const rawImage = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;
  const imageUri = rawImage ? await fetchSafeImageDataUri(rawImage) : null;

  const isAuction = item.mode === 'auction';
  const displayTitle = item.title.length > 70 ? item.title.slice(0, 68) + '…' : item.title;
  const formattedEuros = money(item.price_cents);
  const formattedPesetas = pesetaEquivalence(item.price_cents, true);
  const canonicalHost = (process.env.APP_URL || 'https://lapela-nine.vercel.app')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  const canonicalDisplayUrl = `${canonicalHost}/articulos/${canonicalSlug}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          backgroundColor: '#fbf8f1',
          padding: '40px',
          boxSizing: 'border-box',
          border: '12px solid #1b3d2f',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Left Column: Photograph or Brand Fallback */}
        <div
          style={{
            width: '480px',
            height: '526px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '2px solid #e2ded5',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {imageUri ? (
            <img
              src={imageUri}
              alt={item.title}
              width={480}
              height={526}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '30px',
                textAlign: 'center',
              }}
            >
              <PesetaCoin size={120} />
              <span
                style={{
                  marginTop: '16px',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: '#1b3d2f',
                }}
              >
                la pela.
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Listing Details & Brand */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            paddingLeft: '40px',
          }}
        >
          {/* Header with Brand & Sale Mode Tag */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
              <PesetaCoin size={36} />
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#1b3d2f',
                    lineHeight: '1',
                  }}
                >
                  la pela.
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    letterSpacing: '1px',
                    color: '#b77943',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginTop: '2px',
                  }}
                >
                  Segunda mano sin regateos
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: isAuction ? '#c07a3e' : '#1b3d2f',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: '999px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              {isAuction ? 'Subasta' : 'Precio cerrado'}
            </div>
          </div>

          {/* Product Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: '10px',
            }}
          >
            <span
              style={{
                fontSize: '32px',
                fontWeight: 800,
                color: '#1b3d2f',
                lineHeight: 1.25,
              }}
            >
              {displayTitle}
            </span>
          </div>

          {/* Pricing & Historical Peseta Equivalence */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#f4eee1',
              padding: '20px 24px',
              borderRadius: '12px',
              border: '1px solid #e2ded5',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'baseline',
                gap: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '48px',
                  fontWeight: 800,
                  color: '#1b3d2f',
                  lineHeight: '1',
                }}
              >
                {formattedEuros}
              </span>
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#b77943',
                }}
              >
                {formattedPesetas}
              </span>
            </div>
            <span
              style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '6px',
              }}
            >
              {PESETA_DISCLAIMER}
            </span>
          </div>

          {/* Footer with Canonical URL */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e2ded5',
              paddingTop: '16px',
            }}
          >
            <span
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#1b3d2f',
              }}
            >
              {canonicalDisplayUrl}
            </span>
            <span
              style={{
                fontSize: '13px',
                color: '#78716c',
              }}
            >
              Segunda mano sin regateos ni contacto previo
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Content-Type': 'image/png',
      },
    }
  );
}
