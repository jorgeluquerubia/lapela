import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../page';

// Mock ProductCard component
jest.mock('@/components/ProductCard', () => {
  return function MockProductCard({ product }: { product: any }) {
    return (
      <div data-testid="product-card" className="product-card">
        <h3>{product.name}</h3>
        <p>{product.price}€</p>
        <p>{product.category}</p>
      </div>
    );
  };
});

// Mock FiltroAnuncios component
jest.mock('@/components/FiltroAnuncios', () => {
  return function MockFiltroAnuncios({ onApplyFilters }: { onApplyFilters: (filters: any) => void }) {
    return (
      <div data-testid="filtro-anuncios">
        <button 
          onClick={() => onApplyFilters({
            category: 'electronica',
            minPrice: '50',
            maxPrice: '200',
            location: 'Madrid'
          })}
        >
          Apply Test Filters
        </button>
      </div>
    );
  };
});

// Mock SkeletonCard component
jest.mock('@/components/SkeletonCard', () => {
  return function MockSkeletonCard() {
    return <div data-testid="skeleton-card">Loading...</div>;
  };
});

// Mock global fetch
global.fetch = jest.fn();

const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful fetch response
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [
          {
            id: '1',
            name: 'iPhone 13',
            price: 500,
            category: 'electronica',
            image: 'iphone.jpg',
            user_id: 'user1',
            status: 'available',
            buyer_id: null,
            bid_count: 0,
            type: 'direct_sale',
            seller: 'Juan',
            location: 'Madrid',
            time: '2024-01-01T00:00:00Z',
            buyer: null,
            updated_at: '2024-01-01T00:00:00Z',
          },
          {
            id: '2',
            name: 'Sofá',
            price: 200,
            category: 'hogar',
            image: 'sofa.jpg',
            user_id: 'user2',
            status: 'available',
            buyer_id: null,
            bid_count: 0,
            type: 'auction',
            seller: 'María',
            location: 'Barcelona',
            time: '2024-01-01T00:00:00Z',
            buyer: null,
            updated_at: '2024-01-01T00:00:00Z',
          }
        ]
      }),
    } as Response);
  });

  it('renders the home page with title and filters', async () => {
    render(<Home />);

    expect(screen.getByText('Últimos anuncios')).toBeInTheDocument();
    expect(screen.getByTestId('filtro-anuncios')).toBeInTheDocument();
    
    // Should show loading skeleton cards initially
    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(8);
  });

  it('loads and displays products correctly', async () => {
    render(<Home />);

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('iPhone 13')).toBeInTheDocument();
      expect(screen.getByText('Sofá')).toBeInTheDocument();
    });

    // Check that skeleton cards are gone
    expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);

    // Check that product cards are displayed
    expect(screen.getAllByTestId('product-card')).toHaveLength(2);

    // Verify fetch was called with correct URL
    expect(mockedFetch).toHaveBeenCalledWith('/api/products');
  });

  it('applies filters correctly', async () => {
    render(<Home />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('iPhone 13')).toBeInTheDocument();
    });

    // Apply filters
    const applyFiltersButton = screen.getByText('Apply Test Filters');
    fireEvent.click(applyFiltersButton);

    // Check that fetch is called with filter parameters
    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith(
        '/api/products?category=electronica&minPrice=50&maxPrice=200&location=Madrid'
      );
    });
  });

  it('displays error message when API fails', async () => {
    const errorMessage = 'Error al cargar los anuncios';
    mockedFetch.mockRejectedValueOnce(new Error(errorMessage));

    // Spy on console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Should not show skeleton cards when there's an error
    expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    
    consoleSpy.mockRestore();
  });

  it('displays error message when API returns error response', async () => {
    const errorMessage = 'Server error';
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    } as Response);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('displays empty state when no products are found', async () => {
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ products: [] }),
    } as Response);

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('No se encontraron anuncios.')).toBeInTheDocument();
    });

    expect(screen.queryAllByTestId('product-card')).toHaveLength(0);
    expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
  });

  it('toggles mobile filters correctly', () => {
    render(<Home />);

    const toggleButton = screen.getByText('Mostrar Filtros');
    expect(toggleButton).toBeInTheDocument();

    // Filters should be hidden initially on mobile
    const filtersContainer = screen.getByTestId('filtro-anuncios').parentElement;
    expect(filtersContainer).toHaveClass('hidden');
    expect(filtersContainer).toHaveClass('md:block');

    // Click to show filters
    fireEvent.click(toggleButton);

    expect(screen.getByText('Ocultar Filtros')).toBeInTheDocument();
    expect(filtersContainer).toHaveClass('block');

    // Click to hide filters
    fireEvent.click(screen.getByText('Ocultar Filtros'));

    expect(screen.getByText('Mostrar Filtros')).toBeInTheDocument();
    expect(filtersContainer).toHaveClass('hidden');
  });

  it('handles multiple filter parameters correctly', async () => {
    // Mock FiltroAnuncios to apply multiple filters
    jest.mock('@/components/FiltroAnuncios', () => {
      return function MockFiltroAnuncios({ onApplyFilters }: { onApplyFilters: (filters: any) => void }) {
        return (
          <div data-testid="filtro-anuncios">
            <button 
              onClick={() => onApplyFilters({
                category: 'Todas',
                minPrice: '',
                maxPrice: '100',
                location: 'Barcelona'
              })}
            >
              Apply Partial Filters
            </button>
          </div>
        );
      };
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('iPhone 13')).toBeInTheDocument();
    });

    // Apply partial filters (some empty values)
    const applyFiltersButton = screen.getByText('Apply Test Filters');
    fireEvent.click(applyFiltersButton);

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith(
        '/api/products?category=electronica&minPrice=50&maxPrice=200&location=Madrid'
      );
    });
  });

  it('shows loading state during refetch', async () => {
    let resolvePromise: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockedFetch.mockReturnValue(fetchPromise as any);

    render(<Home />);

    // Should show skeleton cards while loading
    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(8);

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ products: [] }),
    });

    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    });
  });
});
