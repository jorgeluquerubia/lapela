import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'seller-1' },
    loading: false,
  }),
}));

jest.mock('@/lib/api', () => ({
  api: jest.fn().mockReturnValue(new Promise(() => {})),
}));

jest.mock('next/link', () => {
  return ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  );
});

jest.mock('../ProductQA', () => {
  return function MockProductQA() {
    return <div data-testid="mock-product-qa">Q&A Section</div>;
  };
});

import ProductDetailInteractive from '../ProductDetailInteractive';

describe('ProductDetailInteractive Reserved Banner and Copy (LP-FEAT-009)', () => {
  const baseItem = {
    id: 'listing-123',
    title: 'Playstation 2',
    description: 'En perfecto estado con cables.',
    category: 'Tecnología',
    condition: 'Muy bueno',
    location: 'Madrid',
    delivery: 'pickup',
    price_cents: 12000,
    shipping_cents: 0,
    images: ['https://example.com/ps2.jpg'],
    mode: 'sale',
    status: 'reserved',
    mine: true,
  };

  it('renders reserved seller banner with link to Mi actividad when seller visits own reserved item', () => {
    render(
      <ProductDetailInteractive
        initialItem={baseItem}
        user={{ id: 'seller-1' } as any}
        demo={false}
      />
    );

    expect(
      screen.getByText(/Artículo reservado · Tienes una venta en curso/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Ir a Mi actividad para chatear →/i })
    ).toHaveAttribute('href', '/my-products');

    // Sidebar promise text updated
    expect(
      screen.getByText(/El chat se habilita al reservar el artículo/i)
    ).toBeInTheDocument();
  });

  it('renders standard reserved notice when visitor is not the seller', () => {
    render(
      <ProductDetailInteractive
        initialItem={{ ...baseItem, mine: false }}
        user={{ id: 'buyer-2' } as any}
        demo={false}
      />
    );

    expect(
      screen.getByText(/Este artículo está reservado actualmente \(48 horas de reserva\)\./i)
    ).toBeInTheDocument();
  });
});
