import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import SearchPage from '../page';

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock ProductCard component
jest.mock('@/components/ProductCard', () => {
  return function MockProductCard({ product }: { product: any }) {
    return (
      <div data-testid="product-card" className="product-card">
        <h3>{product.name}</h3>
        <p>{product.price}€</p>
      </div>
    );
  };
});

// Mock global fetch
global.fetch = jest.fn();

const mockedUseSearchParams = useSearchParams as jest.Mock;
const mockedUseRouter = useRouter as jest.Mock;
const mockedUsePathname = usePathname as jest.Mock;
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('SearchPage', () => {
  let mockPush: jest.Mock;
  let mockSearchParams: URLSearchParams;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock router
    mockPush = jest.fn();
    mockedUseRouter.mockReturnValue({
      push: mockPush,
    });
    
    mockedUsePathname.mockReturnValue('/search');
    
    // Setup mock search params
    mockSearchParams = new URLSearchParams();
    mockedUseSearchParams.mockReturnValue({
      get: jest.fn((key) => mockSearchParams.get(key)),
      toString: jest.fn(() => mockSearchParams.toString()),
    });

    // Setup default fetch responses
    mockedFetch.mockImplementation((url) => {
      if (url.includes('/api/products/categories')) {
        return Promise.resolve({
          json: () => Promise.resolve([
            { category: 'electronica' },
            { category: 'hogar' },
            { category: 'ropa' }
          ]),
        } as Response);
      }
      
      if (url.includes('/api/products')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            products: [
              {
                id: '1',
                name: 'Producto Test 1',
                price: 100,
                category: 'electronica',
                image: 'test.jpg',
                user_id: 'user1',
                status: 'available',
                buyer_id: null,
                bid_count: 0,
                type: 'direct_sale',
                seller: 'TestUser',
                location: 'Madrid',
                time: '2024-01-01T00:00:00Z',
                buyer: null,
                updated_at: '2024-01-01T00:00:00Z',
              },
              {
                id: '2',
                name: 'Producto Test 2',
                price: 200,
                category: 'hogar',
                image: 'test2.jpg',
                user_id: 'user2',
                status: 'available',
                buyer_id: null,
                bid_count: 0,
                type: 'auction',
                seller: 'TestUser2',
                location: 'Barcelona',
                time: '2024-01-01T00:00:00Z',
                buyer: null,
                updated_at: '2024-01-01T00:00:00Z',
              }
            ],
            totalCount: 2,
          }),
        } as Response);
      }
      
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('renders the search page with filters and results', async () => {
    render(<SearchPage />);

    // Wait for components to load
    await waitFor(() => {
      expect(screen.getByText('Filtros')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Explorar todos los productos')).toBeInTheDocument();
    });

    // Check if categories loaded
    await waitFor(() => {
      expect(screen.getByText('electronica')).toBeInTheDocument();
    });
    expect(screen.getByText('hogar')).toBeInTheDocument();
    expect(screen.getByText('ropa')).toBeInTheDocument();

    // Check if products loaded
    await waitFor(() => {
      expect(screen.getByText('Producto Test 1')).toBeInTheDocument();
      expect(screen.getByText('Producto Test 2')).toBeInTheDocument();
    });
  });

  it('displays search results for a query', async () => {
    // Mock search params with query
    mockSearchParams.set('q', 'test query');
    mockedUseSearchParams.mockReturnValue({
      get: jest.fn((key) => mockSearchParams.get(key)),
      toString: jest.fn(() => mockSearchParams.toString()),
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Resultados para:')).toBeInTheDocument();
      expect(screen.getByText('test query')).toBeInTheDocument();
    });
  });

  it('handles filter interactions correctly', async () => {
    render(<SearchPage />);

    // Wait for filters to load
    await waitFor(() => {
      expect(screen.getByText('Filtros')).toBeInTheDocument();
    });

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('electronica')).toBeInTheDocument();
    });

    // Test category filter
    const electronicaButton = screen.getByText('electronica');
    fireEvent.click(electronicaButton);

    expect(mockPush).toHaveBeenCalledWith('/search?category=electronica&page=1');

    // Test price filters
    const minPriceInput = screen.getByPlaceholderText('Mín');
    const maxPriceInput = screen.getByPlaceholderText('Máx');
    const applyFiltersButton = screen.getByText('Aplicar Filtros');

    fireEvent.change(minPriceInput, { target: { value: '50' } });
    fireEvent.change(maxPriceInput, { target: { value: '150' } });
    fireEvent.click(applyFiltersButton);

    expect(mockPush).toHaveBeenCalledWith('/search?minPrice=50&maxPrice=150&page=1');
  });

  it('handles location filter', async () => {
    render(<SearchPage />);

    // Wait for filters to load
    await waitFor(() => {
      expect(screen.getByText('Filtros')).toBeInTheDocument();
    });

    const locationInput = screen.getByPlaceholderText('Ciudad, provincia...');
    const applyFiltersButton = screen.getByText('Aplicar Filtros');

    fireEvent.change(locationInput, { target: { value: 'Madrid' } });
    fireEvent.click(applyFiltersButton);

    expect(mockPush).toHaveBeenCalledWith('/search?location=Madrid&page=1');
  });

  it('shows empty state when no products found', async () => {
    // Mock empty response
    mockedFetch.mockImplementation((url) => {
      if (url.includes('/api/products/categories')) {
        return Promise.resolve({
          json: () => Promise.resolve([]),
        } as Response);
      }
      
      if (url.includes('/api/products')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            products: [],
            totalCount: 0,
          }),
        } as Response);
      }
      
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText('No se encontraron productos con los criterios actuales.')).toBeInTheDocument();
    });
  });

  it('displays pagination when there are multiple pages', async () => {
    // Mock response with many products
    mockedFetch.mockImplementation((url) => {
      if (url.includes('/api/products/categories')) {
        return Promise.resolve({
          json: () => Promise.resolve([]),
        } as Response);
      }
      
      if (url.includes('/api/products')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            products: Array.from({ length: 12 }, (_, i) => ({
              id: `${i + 1}`,
              name: `Producto ${i + 1}`,
              price: 100 + i,
              category: 'electronica',
              image: 'test.jpg',
              user_id: 'user1',
              status: 'available',
              buyer_id: null,
              bid_count: 0,
              type: 'direct_sale',
              seller: 'TestUser',
              location: 'Madrid',
              time: '2024-01-01T00:00:00Z',
              buyer: null,
              updated_at: '2024-01-01T00:00:00Z',
            })),
            totalCount: 25, // More than 12, should show pagination
          }),
        } as Response);
      }
      
      return Promise.reject(new Error('Unknown endpoint'));
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText('Siguiente')).toBeInTheDocument();
      expect(screen.getByText('Anterior')).toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    // Mock fetch to reject
    mockedFetch.mockRejectedValue(new Error('Network error'));
    
    // Spy on console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<SearchPage />);

    // Should eventually stop loading even with errors
    await waitFor(() => {
      expect(screen.queryByText('Buscando productos...')).not.toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
