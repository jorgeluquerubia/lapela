import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdDetail from '../page';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { Product, Question, Bid, SellerProfile } from '@/types';
import toast from 'react-hot-toast';

// Mock de los hooks de Next.js
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

// Mock del contexto de autenticación
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock de react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock de Supabase
jest.mock('@/utils/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    auth: {
      getSession: jest.fn(),
    },
  },
}));

// Mock de fetch
global.fetch = jest.fn();

// Tipos de Mocks
const mockUseParams = useParams as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;
const mockFetch = global.fetch as jest.Mock;

const mockProduct: Product = {
  id: '1',
  name: 'Producto de Prueba Detallado',
  price: 150.00,
  slug: 'producto-de-prueba-detallado',
  user_id: 'seller-123',
  seller: 'VendedorPrueba',
  image: '/test-image.jpg',
  description: 'Una descripción muy detallada del producto.',
  type: 'venta_directa',
  location: 'Ciudad Ficticia',
  status: 'available',
  buyer: null,
  time: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockSeller: SellerProfile = {
  id: 'seller-123',
  username: 'VendedorPrueba',
  avatar_url: '/avatar.jpg',
};

const mockQuestions: Question[] = [
  {
    id: 'q1',
    question: '¿Es negociable el precio?',
    answer: 'Sí, un poco.',
    created_at: new Date().toISOString(),
    answered_at: new Date().toISOString(),
    user: { username: 'CompradorCurioso' },
  },
];

describe('AdDetail Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ slug: 'producto-de-prueba-detallado' });
    mockUseRouter.mockReturnValue({ push: jest.fn() });
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    // Mock de la cadena de llamadas de Supabase
    const supabaseMock = require('@/utils/supabase').supabase;
    supabaseMock.from.mockReturnThis();
    supabaseMock.select.mockReturnThis();
    supabaseMock.eq.mockImplementation((column: string, value: any) => {
      if (column === 'slug') {
        supabaseMock.single.mockResolvedValueOnce({ data: mockProduct, error: null });
      } else if (column === 'id') {
        supabaseMock.single.mockResolvedValueOnce({ data: mockSeller, error: null });
      }
      return supabaseMock;
    });

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/questions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockQuestions),
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  it('debería mostrar el esqueleto de carga inicialmente', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    render(<AdDetail />);
    expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
  });

  it('debería renderizar los detalles del producto después de la carga', async () => {
    render(<AdDetail />);

    await waitFor(() => {
      expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    });

    expect(screen.getByText(`${mockProduct.price} €`)).toBeInTheDocument();
    expect(screen.getByText(mockSeller.username!)).toBeInTheDocument();
    expect(screen.getByText(mockQuestions[0].question)).toBeInTheDocument();
  });

  it('debería mostrar los botones de Editar y Eliminar para el propietario', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'seller-123' }, loading: false });
    render(<AdDetail />);

    await waitFor(() => {
      expect(screen.getByText('Editar Anuncio')).toBeInTheDocument();
    });
    expect(screen.getByText('Eliminar Anuncio')).toBeInTheDocument();
  });

  it('debería mostrar el botón "Comprar ahora" para otros usuarios', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'buyer-456' }, loading: false });
    render(<AdDetail />);

    await waitFor(() => {
      expect(screen.getByText('Comprar ahora')).toBeInTheDocument();
    });
  });
});
