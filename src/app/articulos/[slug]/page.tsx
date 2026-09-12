import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {getListingByIdOrSlug} from '@/models/marketplace';
import {findDemoProduct} from '@/lib/demo-products';
import {productSlug, categoryToSlug} from '@/lib/slugs';
import {money} from '@/lib/rules';
import ProductDetailInteractive from '@/components/ProductDetailInteractive';

interface ArticuloPageProps {
  params: Promise<{slug: string}>;
}

async function getItem(slug: string) {
  const demo = findDemoProduct(slug);
  if (demo) {
    return {
      item: {
        id: demo.id,
        title: demo.name,
        description: demo.description,
        images: [demo.image],
        mode: demo.type,
        price_cents: demo.price * 100,
        condition: 'Buen estado',
        location: demo.location,
        category: demo.category,
        delivery: 'pickup',
        shipping_cents: 0,
        status: demo.status,
        bid_count: 0,
      },
      demo: true,
      canonicalSlug: demo.slug,
    };
  }

  const listing = await getListingByIdOrSlug(slug);
  if (!listing) return null;

  return {
    item: listing,
    demo: false,
    canonicalSlug: productSlug(listing.id, listing.title),
  };
}

export async function generateMetadata({params}: ArticuloPageProps): Promise<Metadata> {
  const {slug} = await params;
  const result = await getItem(slug);
  if (!result) {
    return {
      title: 'Artículo no encontrado',
      robots: {index: false, follow: false},
    };
  }

  const {item, demo, canonicalSlug} = result;
  const title = `${item.title} · ${money(item.price_cents)}`;
  const description = `${item.description.slice(0, 150)}. ${item.mode === 'auction' ? 'Subasta' : 'Compra directa'} en ${item.location}. Segunda mano sin regateos en La Pela.`;
  const canonicalUrl = `/articulos/${canonicalSlug}`;
  const socialCardUrl = !demo && item.status === 'available'
    ? `/api/social-card/${canonicalSlug}`
    : item.images?.[0];

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | La Pela`,
      description,
      url: canonicalUrl,
      type: 'website',
      images: socialCardUrl ? [{url: socialCardUrl, width: 1200, height: 630, alt: item.title}] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | La Pela`,
      description,
      images: socialCardUrl ? [socialCardUrl] : [],
    },
  };
}

export default async function ArticuloPage({params}: ArticuloPageProps) {
  const {slug} = await params;
  const result = await getItem(slug);

  if (!result) {
    notFound();
  }

  const {item, demo, canonicalSlug} = result;
  const categorySlug = categoryToSlug[item.category] || 'todas';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
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
            name: item.category,
            item: `/categoria/${categorySlug}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: item.title,
            item: `/articulos/${canonicalSlug}`,
          },
        ],
      },
      {
        '@type': 'Product',
        name: item.title,
        description: item.description,
        image: item.images,
        category: item.category,
        offers: {
          '@type': 'Offer',
          price: (item.price_cents / 100).toFixed(2),
          priceCurrency: 'EUR',
          itemCondition: 'https://schema.org/UsedCondition',
          availability:
            item.status === 'available'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/SoldOut',
          url: `/articulos/${canonicalSlug}`,
          priceValidUntil: item.ends_at ? new Date(item.ends_at).toISOString() : undefined,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      <div className="breadcrumbs">
        <Link href="/">Explorar</Link>
        <span>/</span>
        <Link href={`/categoria/${categorySlug}`}>{item.category}</Link>
        <span>/</span>
        <span>{item.title}</span>
      </div>

      {demo && (
        <div className="notice">
          Anuncio de ejemplo · Fotografía ilustrativa. Este artículo no está a la venta.
        </div>
      )}

      <ProductDetailInteractive initialItem={item} slug={slug} demo={demo} />
    </>
  );
}
