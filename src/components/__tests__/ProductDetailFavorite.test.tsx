import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import ProductDetailInteractive from '../ProductDetailInteractive';
import {useAuth} from '@/context/AuthContext';
import {api} from '@/lib/api';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/api', () => ({ api: jest.fn() }));
jest.mock('../ProductQA', () => ({
  __esModule: true,
  default: () => <div data-testid="product-qa" />
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({children, href, className}: any) => <a href={href} className={className}>{children}</a>
}));
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
}));

describe('ProductDetailInteractive Favorites (LP-FEAT-018)', () => {
  const dummyListing: any = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Reloj de bolsillo',
    description: 'Reloj antiguo en perfecto estado de funcionamiento.',
    price_cents: 15000,
    shipping_cents: 500,
    images: ['https://example.invalid/watch.jpg'],
    mode: 'sale',
    delivery: 'shipping',
    condition: 'Muy bueno',
    category: 'Coleccionismo',
    location: 'Barcelona',
    status: 'available',
    isFavorite: false,
    favoritesCount: 3,
    seller: { alias: 'coleccionista' }
  };

  beforeEach(() => {
    mockPush.mockReset();
    jest.clearAllMocks();
  });

  it('allows authenticated buyer to toggle favorite on detail page (AC-01, RNF-04)', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'buyer-1' }, loading: false });
    (api as jest.Mock).mockImplementation((path: string, body?: any) => {
      if (path.startsWith('listing/')) {
        return Promise.resolve({ ...dummyListing, isFavorite: false });
      }
      if (path.startsWith('favorite/')) {
        return Promise.resolve({ success: true, is_favorite: body?.active ?? true });
      }
      return Promise.resolve({});
    });

    render(<ProductDetailInteractive initialItem={dummyListing} slug="reloj-de-bolsillo" />);

    const favBtn = await screen.findByRole('button', { name: 'Guardar en favoritos' });
    expect(favBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(favBtn);

    await waitFor(() => {
      const activeBtn = screen.getByRole('button', { name: 'Eliminar de favoritos' });
      expect(activeBtn).toHaveAttribute('aria-pressed', 'true');
      expect(activeBtn).not.toBeDisabled();
    });

    expect(api).toHaveBeenCalledWith(`favorite/${dummyListing.id}`, { active: true });
    expect(screen.getByText('Guardado en favoritos. Lo encontrarás en Mi actividad.')).toBeInTheDocument();
  });

  it('displays only aggregate count to the seller without identities (AC-05, RF-05)', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'seller-1' }, loading: false });
    const sellerListing = { ...dummyListing, mine: true, favoritesCount: 5 };
    (api as jest.Mock).mockImplementation((path: string) => {
      if (path.startsWith('listing/')) {
        return Promise.resolve(sellerListing);
      }
      return Promise.resolve({});
    });

    render(<ProductDetailInteractive initialItem={sellerListing} slug="reloj-de-bolsillo" />);

    await waitFor(() => {
      expect(screen.getByText('5 personas han guardado este artículo')).toBeInTheDocument();
    });

    // Seller cannot toggle favorite for their own item
    expect(screen.queryByRole('button', { name: /guardar en favoritos/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /eliminar de favoritos/i })).not.toBeInTheDocument();
  });

  it('redirects unauthenticated user to /login when attempting to favorite (AC-02)', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });

    render(<ProductDetailInteractive initialItem={dummyListing} slug="reloj-de-bolsillo" />);

    const favBtn = screen.getByRole('button', { name: 'Guardar en favoritos' });
    fireEvent.click(favBtn);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});

