import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import Activity from '../page';
import {useAuth} from '@/context/AuthContext';
import {api} from '@/lib/api';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/api', () => ({ api: jest.fn() }));
const mockSearchParamsGet = jest.fn();
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockSearchParamsGet })
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({children, href, className}: any) => <a href={href} className={className}>{children}</a>
}));

describe('My Products Favorites Tab (LP-FEAT-018)', () => {
  const dummyFavorites = [
    {
      id: 'fav-1',
      name: 'Bicicleta clásica',
      slug: 'bicicleta-clasica-fav-1',
      type: 'auction',
      mode: 'auction',
      price_cents: 8000,
      price: 80,
      status: 'available',
      ends_at: new Date(Date.now() + 3600000 * 2).toISOString(),
      location: 'Sevilla',
      seller: 'ciclista'
    },
    {
      id: 'fav-2',
      name: 'Lámpara de pie',
      slug: 'lampara-de-pie-fav-2',
      type: 'sale',
      mode: 'sale',
      price_cents: 2500,
      price: 25,
      status: 'sold',
      location: 'Madrid',
      seller: 'decorador'
    }
  ];

  const dummyActivityData = {
    userId: 'user-1',
    listings: [
      {
        id: 'my-listing-1',
        title: 'Mi guitarra eléctrica',
        status: 'available',
        price_cents: 20000,
        created_at: new Date().toISOString(),
        images: ['https://example.invalid/guitar.jpg'],
        favorites_count: 7
      }
    ],
    orders: [],
    bids: [],
    favorites: dummyFavorites,
    sellerQuestions: [],
    buyerQuestions: [],
    notifications: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-1' }, loading: false });
    (api as jest.Mock).mockImplementation((path: string) => {
      if (path === 'activity') return Promise.resolve(dummyActivityData);
      if (path.startsWith('favorite/')) return Promise.resolve({ success: true, is_favorite: false });
      return Promise.resolve({});
    });
  });

  it('renders the favorites tab with count and lists items (AC-01, RF-02)', async () => {
    render(<Activity />);

    const favTab = await screen.findByRole('button', { name: 'Favoritos (2)' });
    expect(favTab).toBeInTheDocument();

    fireEvent.click(favTab);

    // Both favorite items should be displayed
    expect(screen.getByRole('link', { name: 'Bicicleta clásica' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Lámpara de pie' })).toBeInTheDocument();

    // Auction active time remaining shown (AC-04)
    expect(screen.getByText(/finaliza en aprox\./i)).toBeInTheDocument();

    // Sold status shown without buy action (AC-06)
    expect(screen.getByText('Este artículo ya se ha vendido.')).toBeInTheDocument();
  });

  it('allows removing an item from favorites directly (AC-01)', async () => {
    render(<Activity />);

    const favTab = await screen.findByRole('button', { name: 'Favoritos (2)' });
    fireEvent.click(favTab);

    const removeButtons = screen.getAllByRole('button', { name: /quitar.*de favoritos/i });
    expect(removeButtons).toHaveLength(2);

    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(api).toHaveBeenCalledWith('favorite/fav-1', { active: false });
    });

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Bicicleta clásica' })).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Lámpara de pie' })).toBeInTheDocument();
    });
  });

  it('shows empty state when no favorites exist', async () => {
    (api as jest.Mock).mockImplementation((path: string) => {
      if (path === 'activity') return Promise.resolve({ ...dummyActivityData, favorites: [] });
      return Promise.resolve({});
    });

    render(<Activity />);

    const favTab = await screen.findByRole('button', { name: 'Favoritos' });
    fireEvent.click(favTab);

    expect(screen.getByRole('heading', { name: 'No tienes artículos en favoritos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar artículos' })).toHaveAttribute('href', '/');
  });

  it('displays aggregated favorites count to the seller in Mis anuncios (AC-05, RF-05)', async () => {
    render(<Activity />);

    const listingsTab = await screen.findByRole('button', { name: 'Mis anuncios' });
    fireEvent.click(listingsTab);

    expect(await screen.findByText('Mi guitarra eléctrica')).toBeInTheDocument();
    expect(screen.getByText('7 guardados')).toBeInTheDocument();
  });
});
