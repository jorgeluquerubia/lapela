import {render, screen, act} from '@testing-library/react';
import EditionDetailInteractive from '../EditionDetailInteractive';
import type {AuctionEdition} from '@/types';

// Mock BrandSpinner
jest.mock('../BrandSpinner', () => {
  return function MockBrandSpinner() {
    return <div data-testid="spinner" />;
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

const baseEdition: AuctionEdition = {
  id: 'ed-100',
  slug: 'subasta-pela-otoño',
  title: 'La Subasta de la Pela · Selección de Otoño',
  description: 'Colección selecta de artículos singulares.',
  environment: 'sandbox',
  starts_at: '2026-09-10T10:00:00.000Z',
  reference_ends_at: '2026-09-20T20:00:00.000Z',
  status: 'published',
  temporal_status: 'ended',
  items_count: 4,
  items: [
    {
      id: 'p-1',
      name: 'Cámara telemétrica Leica',
      price: 850,
      type: 'auction',
      seller: 'coleccionista_bcn',
      location: 'Barcelona',
      time: '2026-09-12T10:00:00.000Z',
      image: 'https://example.com/leica.jpg',
      status: 'reserved', // Adjudicada tras cierre por lp_close_auctions
      buyer: null,
      updated_at: '2026-09-12T10:00:00.000Z',
      bid_count: 14,
      auction_ends_at: '2026-09-20T19:58:00.000Z',
      slug: 'camara-telemetrica-leica-p-1',
    },
    {
      id: 'p-2',
      name: 'Pluma estilográfica Parker 51',
      price: 120,
      type: 'auction',
      seller: 'antiguedades_madrid',
      location: 'Madrid',
      time: '2026-09-12T10:00:00.000Z',
      image: 'https://example.com/pluma.jpg',
      status: 'sold', // Pagada y completada
      buyer: null,
      updated_at: '2026-09-12T10:00:00.000Z',
      bid_count: 6,
      auction_ends_at: '2026-09-20T19:50:00.000Z',
      slug: 'pluma-estilografica-parker-p-2',
    },
    {
      id: 'p-3',
      name: 'Gramófono La Voz de su Amo',
      price: 300,
      type: 'auction',
      seller: 'antiguedades_sevilla',
      location: 'Sevilla',
      time: '2026-09-12T10:00:00.000Z',
      image: 'https://example.com/gramofono.jpg',
      status: 'available', // En prórroga anti-sniping superando el reference_ends_at
      buyer: null,
      updated_at: '2026-09-12T10:00:00.000Z',
      bid_count: 22,
      auction_ends_at: '2026-09-20T20:04:00.000Z', // 4 minutos más tarde
      slug: 'gramofono-la-voz-de-su-amo-p-3',
    },
    {
      id: 'p-4',
      name: 'Lámpara de sobremesa Fase',
      price: 220,
      type: 'auction',
      seller: 'vintage_valencia',
      location: 'Valencia',
      time: '2026-09-12T10:00:00.000Z',
      image: 'https://example.com/lampara.jpg',
      status: 'expired', // Concluida sin pujas suficientes
      buyer: null,
      updated_at: '2026-09-12T10:00:00.000Z',
      bid_count: 0,
      auction_ends_at: '2026-09-20T20:00:00.000Z',
      slug: 'lampara-de-sobremesa-fase-p-4',
    },
  ],
};

describe('EditionDetailInteractive (AC-03, AC-04, AC-05, RNF-03)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Fijar fecha justo en el cierre de referencia (2026-09-20T20:00:00Z)
    jest.setSystemTime(new Date('2026-09-20T20:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('clasifica correctamente los artículos adjudicados en estado "reserved" y "sold"', () => {
    render(<EditionDetailInteractive initialEdition={baseEdition} />);

    // p-1 con status: reserved debe marcarse como Adjudicado (NO como Sin venta)
    expect(screen.getByText('Cámara telemétrica Leica')).toBeInTheDocument();
    expect(screen.getByText('Adjudicado, pendiente del flujo correspondiente')).toBeInTheDocument();

    // p-2 con status: sold debe marcarse como Vendido y confirmado
    expect(screen.getByText('Pluma estilográfica Parker 51')).toBeInTheDocument();
    expect(screen.getByText('Vendido y confirmado')).toBeInTheDocument();
  });

  it('cuando el ganador no paga y lp_release marca el anuncio como expired con pujas, la edición muestra No adjudicado y jamás Adjudicado', () => {
    const expiredWithBidsEdition: AuctionEdition = {
      ...baseEdition,
      items: [
        {
          id: 'p-defaulted',
          name: 'Reloj Omega Vintage',
          price: 900,
          type: 'auction',
          seller: 'relojes_bcn',
          location: 'Barcelona',
          time: '2026-09-12T10:00:00.000Z',
          image: 'https://example.com/omega.jpg',
          status: 'expired', // Ganador no pagó y lp_release pasó a expired
          buyer: null,
          updated_at: '2026-09-12T10:00:00.000Z',
          bid_count: 18,
          auction_ends_at: '2026-09-20T19:50:00.000Z',
          slug: 'reloj-omega-vintage',
        },
      ],
    };

    render(<EditionDetailInteractive initialEdition={expiredWithBidsEdition} />);

    expect(screen.getByText('Reloj Omega Vintage')).toBeInTheDocument();
    expect(screen.getByText('No adjudicado')).toBeInTheDocument();
    expect(screen.getByText('No adjudicado / venta no completada')).toBeInTheDocument();
    expect(screen.queryByText('Adjudicado')).not.toBeInTheDocument();
    expect(screen.queryByText('Adjudicado, pendiente del flujo correspondiente')).not.toBeInTheDocument();
  });

  it('reconoce artículos en prórroga anti-sniping como activos con enlace prioritario', () => {
    render(<EditionDetailInteractive initialEdition={baseEdition} />);

    // p-3 tiene ends_at en 20:04, 4 minutos después de las 20:00 y con pujas
    expect(screen.getByText('Gramófono La Voz de su Amo')).toBeInTheDocument();
    expect(screen.getByText('En prórroga anti-sniping')).toBeInTheDocument();
    expect(screen.getByText('Pujar ahora (prórroga activa)')).toBeInTheDocument();
  });

  it('muestra "En curso" de forma neutral en artículo abierto sin evidencia de prórroga activa en edición finalizada', () => {
    const neutralEdition: AuctionEdition = {
      ...baseEdition,
      items: [
        {
          id: 'p-open-normal',
          name: 'Grabado antiguo',
          price: 150,
          type: 'auction',
          seller: 'arte_madrid',
          location: 'Madrid',
          time: '2026-09-12T10:00:00.000Z',
          image: 'https://example.com/grabado.jpg',
          status: 'available',
          buyer: null,
          updated_at: '2026-09-12T10:00:00.000Z',
          bid_count: 0, // Sin pujas: no hay evidencia de prórroga anti-sniping
          auction_ends_at: '2026-09-20T20:02:00.000Z', // 2 minutos más tarde que la edición
          slug: 'grabado-antiguo',
        },
      ],
    };

    // La edición concluyó a las 20:00:00Z
    jest.setSystemTime(new Date('2026-09-20T20:00:00.000Z'));
    render(<EditionDetailInteractive initialEdition={neutralEdition} />);

    expect(screen.getByText('Grabado antiguo')).toBeInTheDocument();
    expect(screen.getAllByText('En curso').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('En prórroga anti-sniping')).not.toBeInTheDocument();
    expect(screen.getByText('Pujar ahora')).toBeInTheDocument();
    expect(screen.queryByText('Pujar ahora (prórroga activa)')).not.toBeInTheDocument();
  });

  it('marca correctamente como "Sin venta" los artículos expirados sin pujas', () => {
    render(<EditionDetailInteractive initialEdition={baseEdition} />);

    expect(screen.getByText('Lámpara de sobremesa Fase')).toBeInTheDocument();
    expect(screen.getByText('Sin pujas suficientes')).toBeInTheDocument();
  });

  it('actualiza el temporizador de forma reactiva cada segundo', () => {
    const activeEdition: AuctionEdition = {
      ...baseEdition,
      starts_at: '2026-09-20T19:00:00.000Z',
      reference_ends_at: '2026-09-20T20:15:00.000Z',
      temporal_status: 'active',
      items: [baseEdition.items![0]],
    };

    render(<EditionDetailInteractive initialEdition={activeEdition} />);

    // A las 20:00:00Z con cierre a las 20:15:00Z quedan 15 min
    expect(screen.getByText(/15 min/i)).toBeInTheDocument();

    // Avanzar 5 segundos
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Ahora quedan 14 min y 55 s
    expect(screen.getByText('14 min y 55 s')).toBeInTheDocument();
  });
});
