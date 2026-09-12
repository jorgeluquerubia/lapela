import {render, screen} from '@testing-library/react';
import FeaturedAuctionSection from '../FeaturedAuctionSection';
import type {AuctionEdition} from '@/types';

// Mock BrandSpinner to keep tests simple
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

const mockEdition: AuctionEdition = {
  id: 'ed-1',
  slug: 'subasta-pela-septiembre',
  title: 'La Subasta de la Pela · Selección Septiembre',
  description: 'Una selección exclusiva de 3 piezas históricas.',
  environment: 'sandbox',
  starts_at: '2026-09-10T10:00:00.000Z',
  reference_ends_at: '2026-09-20T20:00:00.000Z',
  status: 'published',
  temporal_status: 'active',
  items_count: 2,
  items: [
    {
      id: 'p-1',
      name: 'Reloj de bolsillo suizo',
      price: 150,
      type: 'auction',
      seller: 'antiguedades_madrid',
      location: 'Madrid',
      time: '2026-09-12T10:00:00.000Z',
      image: 'https://example.com/reloj.jpg',
      status: 'available',
      buyer: null,
      updated_at: '2026-09-12T10:00:00.000Z',
      bid_count: 5,
      auction_ends_at: '2026-09-20T20:00:00.000Z',
      slug: 'reloj-de-bolsillo-suizo-p-1',
      featuredEdition: {
        id: 'ed-1',
        slug: 'subasta-pela-septiembre',
        title: 'La Subasta de la Pela · Selección Septiembre',
      },
    },
    {
      id: 'p-2',
      name: 'Moneda 5 pesetas 1870',
      price: 45,
      type: 'auction',
      seller: 'numismatica_norte',
      location: 'Bilbao',
      time: '2026-09-12T10:00:00.000Z',
      image: 'https://example.com/moneda.jpg',
      status: 'available',
      buyer: null,
      updated_at: '2026-09-12T10:00:00.000Z',
      bid_count: 12,
      auction_ends_at: '2026-09-20T19:30:00.000Z',
      slug: 'moneda-5-pesetas-1870-p-2',
      featuredEdition: {
        id: 'ed-1',
        slug: 'subasta-pela-septiembre',
        title: 'La Subasta de la Pela · Selección Septiembre',
      },
    },
  ],
};

describe('FeaturedAuctionSection (AC-02, RNF-03, RF-02)', () => {
  it('renderiza la edición activa con título, distintivos, cuenta atrás y artículos', () => {
    render(<FeaturedAuctionSection edition={mockEdition} />);

    // Insignias de marca y estado
    expect(screen.getByText('★ La Subasta de la Pela')).toBeInTheDocument();
    expect(screen.getByText('En curso')).toBeInTheDocument();

    // Título y descripción
    expect(screen.getByText('La Subasta de la Pela · Selección Septiembre')).toBeInTheDocument();
    expect(screen.getByText('Una selección exclusiva de 3 piezas históricas.')).toBeInTheDocument();

    // Cuenta atrás accesible (RNF-03)
    const timer = screen.getByRole('timer', {name: /tiempo restante de la edición/i});
    expect(timer).toBeInTheDocument();
    expect(screen.getByText('Cierre de la edición')).toBeInTheDocument();

    // Artículos renderizados
    expect(screen.getByText('Reloj de bolsillo suizo')).toBeInTheDocument();
    expect(screen.getByText('Moneda 5 pesetas 1870')).toBeInTheDocument();

    // Enlace para ver la selección completa
    const viewAll = screen.getByRole('link', {name: /ver selección \(2\)/i});
    expect(viewAll).toHaveAttribute('href', '/subastas/ediciones/subasta-pela-septiembre');
  });

  it('renderiza el estado "Próximamente" cuando la edición aún no ha comenzado', () => {
    const upcomingEdition: AuctionEdition = {
      ...mockEdition,
      temporal_status: 'upcoming',
      starts_at: '2026-09-25T10:00:00.000Z',
    };

    render(<FeaturedAuctionSection edition={upcomingEdition} />);
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
    expect(screen.getByText('Apertura de la edición')).toBeInTheDocument();
  });

  it('no renderiza nada si la edición no contiene artículos', () => {
    const emptyEdition: AuctionEdition = {
      ...mockEdition,
      items: [],
      items_count: 0,
    };

    const {container} = render(<FeaturedAuctionSection edition={emptyEdition} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('no renderiza nada si la edición es null', () => {
    const {container} = render(<FeaturedAuctionSection edition={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
