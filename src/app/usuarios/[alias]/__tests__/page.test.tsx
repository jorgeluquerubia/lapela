import { render, screen } from '@testing-library/react';
import UserDashboard, { metadata } from '../page';
import * as marketplaceModel from '@/models/marketplace';
import { notFound } from 'next/navigation';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  );
});

jest.mock('@/components/ProductCard', () => {
  return ({ product }: { product: any }) => (
    <div data-testid="product-card" data-product-id={product.id}>
      <span>{product.name || product.title}</span>
    </div>
  );
});

jest.mock('@/models/marketplace', () => ({
  getPublicProfile: jest.fn(),
}));

describe('Public Profile Dashboard (/usuarios/[alias])', () => {
  const mockProfileData = {
    profile: {
      alias: 'coleccionista_retro',
      memberSince: '2026-01-15T12:00:00.000Z',
      showPurchases: false,
    },
    stats: {
      completedSales: 8,
      averageScore: 4.8,
      reviewCount: 5,
    },
    activeListings: [
      { id: 'item-1', title: 'Cámara vintage', price_cents: 8500, images: ['https://example.com/cam.jpg'] },
      { id: 'item-2', title: 'Tocadiscos clásico', price_cents: 12000, images: ['https://example.com/toca.jpg'] },
    ],
    purchases: [
      { id: 'item-bought-1', title: 'Vinilo edición especial', price_cents: 3000, images: ['https://example.com/vinilo.jpg'] },
    ],
    reviews: [
      {
        id: 'rev-1',
        score: 5,
        comment: 'Vendedor excelente, envío rápido y muy bien embalado.',
        created_at: '2026-02-10T14:30:00.000Z',
        author: { alias: 'comprador_feliz' },
      },
      {
        id: 'rev-2',
        score: 4,
        comment: '',
        created_at: '2026-03-01T09:00:00.000Z',
        author: { alias: 'otro_usuario' },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user alias, membership date, and stats', async () => {
    (marketplaceModel.getPublicProfile as jest.Mock).mockResolvedValue(mockProfileData);

    const PageComponent = await UserDashboard({ params: Promise.resolve({ alias: 'coleccionista_retro' }) });
    render(PageComponent);

    expect(screen.getByText('@coleccionista_retro')).toBeInTheDocument();
    expect(screen.getByText(/Miembro desde enero de 2026/i)).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText(/ventas completadas/i)).toBeInTheDocument();
    expect(screen.getByText('4,8')).toBeInTheDocument();
    expect(screen.getByText(/valoración media/i)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('valoraciones', { selector: 'span' })).toBeInTheDocument();
  });

  it('renders active listings', async () => {
    (marketplaceModel.getPublicProfile as jest.Mock).mockResolvedValue(mockProfileData);

    const PageComponent = await UserDashboard({ params: Promise.resolve({ alias: 'coleccionista_retro' }) });
    render(PageComponent!);

    expect(screen.getByText('Anuncios a la venta')).toBeInTheDocument();
    expect(screen.getByText('Cámara vintage')).toBeInTheDocument();
    expect(screen.getByText('Tocadiscos clásico')).toBeInTheDocument();
  });

  it('does not render purchase history when showPurchases is false (AC-05)', async () => {
    (marketplaceModel.getPublicProfile as jest.Mock).mockResolvedValue({
      ...mockProfileData,
      profile: { ...mockProfileData.profile, showPurchases: false },
    });

    const PageComponent = await UserDashboard({ params: Promise.resolve({ alias: 'coleccionista_retro' }) });
    render(PageComponent!);

    expect(screen.queryByText('Compras públicas')).not.toBeInTheDocument();
    expect(screen.queryByText('Vinilo edición especial')).not.toBeInTheDocument();
  });

  it('renders purchase history when showPurchases is true (AC-05)', async () => {
    (marketplaceModel.getPublicProfile as jest.Mock).mockResolvedValue({
      ...mockProfileData,
      profile: { ...mockProfileData.profile, showPurchases: true },
    });

    const PageComponent = await UserDashboard({ params: Promise.resolve({ alias: 'coleccionista_retro' }) });
    render(PageComponent!);

    expect(screen.getByText('Compras públicas')).toBeInTheDocument();
    expect(screen.getByText('Vinilo edición especial')).toBeInTheDocument();
  });

  it('renders reviews list with score and author link (AC-04, AC-06)', async () => {
    (marketplaceModel.getPublicProfile as jest.Mock).mockResolvedValue(mockProfileData);

    const PageComponent = await UserDashboard({ params: Promise.resolve({ alias: 'coleccionista_retro' }) });
    render(PageComponent!);

    expect(screen.getByText('@comprador_feliz')).toBeInTheDocument();
    expect(screen.getByText('Vendedor excelente, envío rápido y muy bien embalado.')).toBeInTheDocument();
    expect(screen.getByText('@otro_usuario')).toBeInTheDocument();
  });

  it('calls notFound when profile does not exist', async () => {
    (marketplaceModel.getPublicProfile as jest.Mock).mockResolvedValue(null);

    const res = await UserDashboard({ params: Promise.resolve({ alias: 'inexistente' }) });
    expect(notFound).toHaveBeenCalled();
    expect(res).toBeNull();
  });

  it('declares noindex in metadata (RNF-03, AC-04)', () => {
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});
