import {Suspense} from 'react';
import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import Catalog from '@/components/Catalog';
import {slugToCategory} from '@/lib/slugs';

interface CategoryPageProps {
  params: Promise<{categorySlug: string}>;
}

export async function generateMetadata({params}: CategoryPageProps): Promise<Metadata> {
  const {categorySlug} = await params;
  const categoryName = slugToCategory[categorySlug];
  if (!categoryName) {
    return {
      title: 'Categoría no encontrada',
      robots: {index: false, follow: false},
    };
  }

  const title = `${categoryName} de segunda mano`;
  const description = `Explora artículos de ${categoryName.toLowerCase()} de segunda mano en La Pela. Compra directa a precio cerrado o subastas transparentes sin regateos.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/categoria/${categorySlug}`,
    },
    openGraph: {
      title: `${title} · La Pela`,
      description,
      url: `/categoria/${categorySlug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · La Pela`,
      description,
    },
  };
}

export default async function CategoryPage({params}: CategoryPageProps) {
  const {categorySlug} = await params;
  const categoryName = slugToCategory[categorySlug];

  if (!categoryName) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${categoryName} de segunda mano`,
    description: `Catálogo de artículos de ${categoryName.toLowerCase()} de segunda mano sin regateos en La Pela.`,
    url: `/categoria/${categorySlug}`,
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
          name: categoryName,
          item: `/categoria/${categorySlug}`,
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
      <Suspense fallback={<p>Cargando catálogo…</p>}>
        <Catalog initialCategory={categoryName} />
      </Suspense>
    </>
  );
}
