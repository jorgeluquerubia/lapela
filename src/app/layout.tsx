import './globals.css';
import type {Metadata} from 'next';
import {AuthProvider} from '@/context/AuthContext';
import Header from '@/components/Header';
import Brand from '@/components/Brand';
import Link from 'next/link';
import {Toaster} from 'react-hot-toast';

const baseUrl = process.env.APP_URL || 'https://lapela-nine.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'La Pela · Segunda mano, sin regateos',
    template: '%s · La Pela',
  },
  description:
    'Compra a precio cerrado o participa en una subasta. Vende sin regateos y habla de la entrega después de comprar.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'La Pela · Segunda mano, sin regateos',
    description:
      'Compra a precio cerrado o participa en una subasta. Vende sin regateos y habla de la entrega después de comprar.',
    url: baseUrl,
    siteName: 'La Pela',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La Pela · Segunda mano, sin regateos',
    description:
      'Compra a precio cerrado o participa en una subasta. Vende sin regateos y habla de la entrega después de comprar.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'La Pela',
  url: baseUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${baseUrl}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: JSON.stringify(websiteJsonLd)}}
        />
      </head>
      <body>
        <AuthProvider>
          <a className="skip-link" href="#contenido">
            Saltar al contenido
          </a>
          <Toaster position="bottom-center" />
          <Header />
          {process.env.LAPELA_PAYMENTS_MODE === 'simulated' && (
            <div className="sandbox-banner">
              BETA DE PRUEBA · Las compras y los pagos son simulados. No se mueve dinero.
            </div>
          )}
          <main id="contenido" className="page-shell">
            {children}
          </main>
          <footer className="site-footer">
            <div>
              <Brand />
              <p>
                Las cosas cambian de manos.
                <br />
                El precio no se discute.
              </p>
            </div>
            <div>
              <Link href="/como-funciona">Cómo funciona</Link>
              <Link href="/politica-de-compras">Política de compras</Link>
              <Link href="/como-funciona#reglas">Reglas de la comunidad</Link>
              <span>© {new Date().getFullYear()} La Pela</span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
