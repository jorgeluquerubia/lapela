import { render, screen } from '@testing-library/react';
import ProductCard from '../ProductCard';
import { Product } from '@/types';

// Mock Next.js Image component
jest.mock('next/image', () => {
  return ({ src, alt }: { src: string, alt: string }) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />;
  };
});

const mockProduct: Product = {
  id: '1',
  name: 'Producto de Prueba',
  description: 'Esta es una descripción de prueba.',
  price: 99.99,
  category: 'electronica',
  image: 'https://example.com/image.jpg',
  user_id: 'user-123',
  status: 'available',
  buyer_id: null,
  bid_count: 0,
  type: 'direct_sale',
  seller: 'Vendedor de Prueba',
  location: 'Ciudad de Prueba',
  time: new Date().toISOString(),
  buyer: null,
  updated_at: new Date().toISOString(),
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    // Check for product name
    expect(screen.getByText('Producto de Prueba')).toBeInTheDocument();

    // Check for product price
    // Note: The component formats the price with a dot and a space.
    expect(screen.getByText(/99.99\s€/)).toBeInTheDocument();

    // Check for product image
    const image = screen.getByAltText('Producto de Prueba');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });
});
