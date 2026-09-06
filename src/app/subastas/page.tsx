import {Suspense} from 'react';
import type {Metadata} from 'next';
import Catalog from '@/components/Catalog';

export const metadata: Metadata = {
  title: 'Subastas de segunda mano',
  description: 'Participa en subastas de segunda mano en La Pela. Pujas transparentes desde el precio de salida, extensión anti-sniping y sin regateos.',
  alternates: {
    canonical: '/subastas',
  },
  openGraph: {
    title: 'Subastas de segunda mano · La Pela',
    description: 'Participa en subastas de segunda mano en La Pela. Pujas transparentes desde el precio de salida, extensión anti-sniping y sin regateos.',
    url: '/subastas',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Subastas de segunda mano · La Pela',
    description: 'Participa en subastas de segunda mano en La Pela. Pujas transparentes desde el precio de salida, extensión anti-sniping y sin regateos.',
  },
};

export default function SubastasPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Subastas de segunda mano',
    description: 'Catálogo de subastas activas de segunda mano en La Pela.',
    url: '/subastas',
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
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{__html: JSON.stringify(jsonLd)}}
      />
      <Suspense fallback={<p>Cargando subastas…</p>}>
        <Catalog initialMode="auction" />
      </Suspense>
    </>
  );
}
