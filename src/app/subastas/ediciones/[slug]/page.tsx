import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Link from 'next/link';
import {getAuctionEditionBySlug} from '@/models/marketplace';
import EditionDetailInteractive from '@/components/EditionDetailInteractive';

export const dynamic = 'force-dynamic';

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

      <EditionDetailInteractive initialEdition={edition} />
    </>
  );
}
