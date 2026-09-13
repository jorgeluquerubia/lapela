import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import ProductCard from '../ProductCard';
import {useAuth} from '@/context/AuthContext';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({children, href, className}: any) => <a href={href} className={className}>{children}</a>
}));
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
}));

describe('ProductCard Favorite button (LP-FEAT-018)', () => {
  const dummyProduct: any = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    slug: 'articulo-prueba-123e4567-e89b-12d3-a456-426614174000',
    name: 'Cámara vintage',
    description: 'En excelente estado de conservación.',
    price: 45,
    type: 'sale',
    image: 'https://example.invalid/cam.jpg',
    location: 'Madrid',
    category: 'Tecnología',
    status: 'available',
    isFavorite: false
  };

  beforeEach(() => {
    mockPush.mockReset();
    jest.clearAllMocks();
  });

  it('redirects unauthenticated user to /login when clicking favorite (AC-02)', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });
    render(<ProductCard product={dummyProduct} />);

    const favButton = screen.getByRole('button', { name: 'Guardar en favoritos' });
    expect(favButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(favButton);

    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(favButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('allows authenticated user to toggle favorite idempotently (AC-01, RNF-04)', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: 'user-1' }, loading: false });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, is_favorite: true })
    });

    render(<ProductCard product={dummyProduct} />);

    const favButton = screen.getByRole('button', { name: 'Guardar en favoritos' });
    expect(favButton).toHaveAttribute('aria-pressed', 'false');

    // Click to add
    fireEvent.click(favButton);

    // Wait for first click to completely settle
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: 'Eliminar de favoritos' });
      expect(btn).toHaveAttribute('aria-pressed', 'true');
      expect(btn).not.toBeDisabled();
    });
    expect(screen.getByText('Guardado en favoritos')).toBeInTheDocument();

    // Mock response for second click (remove)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, is_favorite: false })
    });

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar de favoritos' }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: 'Guardar en favoritos' });
      expect(btn).toHaveAttribute('aria-pressed', 'false');
      expect(btn).not.toBeDisabled();
    });
    expect(screen.getByText('Eliminado de favoritos')).toBeInTheDocument();
  });
});
