import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MyProducts from '@/app/my-products/page';
import { useAuth } from '@/context/AuthContext';

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/link', () => {
  return ({ children, href, className, onClick }: any) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  );
});

describe('Activity Badges and Notifications (LP-FEAT-009)', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
    });
  });

  it('renders unread counts on tabs and badges on rows with notifications', async () => {
    const mockData = {
      userId: 'user-123',
      listings: [
        {
          id: 'listing-1',
          title: 'Bicicleta de montaña',
          price_cents: 25000,
          status: 'available',
          created_at: new Date().toISOString(),
          images: ['https://example.com/bike.jpg'],
        },
      ],
      orders: [
        {
          id: 'order-sale-1',
          seller_id: 'user-123',
          buyer_id: 'buyer-999',
          amount_cents: 15000,
          status: 'pending_payment',
          created_at: new Date().toISOString(),
          listing: {
            title: 'Teclado Mecánico',
            images: ['https://example.com/keyboard.jpg'],
          },
        },
        {
          id: 'order-buy-1',
          seller_id: 'seller-888',
          buyer_id: 'user-123',
          amount_cents: 8000,
          status: 'pending_payment',
          created_at: new Date().toISOString(),
          listing: {
            title: 'Auriculares Inalámbricos',
            images: ['https://example.com/headphones.jpg'],
          },
        },
      ],
      bids: [
        {
          id: 'bid-1',
          listing_id: 'auction-1',
          amount_cents: 3000,
          status: 'available',
          created_at: new Date().toISOString(),
          listing: {
            title: 'Reloj Vintage',
            images: ['https://example.com/watch.jpg'],
            price_cents: 4000,
            status: 'available',
          },
        },
      ],
      sellerQuestions: [],
      buyerQuestions: [],
      pendingQuestionsCount: 0,
      notifications: [
        {
          id: 'note-1',
          order_id: 'order-sale-1',
          type: 'order_created',
          title: 'Nueva venta · Artículo reservado',
          read: false,
        },
        {
          id: 'note-2',
          order_id: 'order-buy-1',
          type: 'new_message',
          title: 'Nuevo mensaje',
          read: false,
        },
        {
          id: 'note-3',
          listing_id: 'auction-1',
          type: 'outbid',
          title: 'Puja superada',
          read: false,
        },
      ],
    };

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('activity')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<MyProducts />);

    // Default tab is 'purchases' (Compras)
    await waitFor(() => {
      expect(screen.getByText(/Compras \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Ventas \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Mis pujas \(1\)/)).toBeInTheDocument();
    });

    // In Compras, Auriculares Inalámbricos has 'Nuevo mensaje' badge
    expect(screen.getByText('Auriculares Inalámbricos')).toBeInTheDocument();
    expect(screen.getByText('Nuevo mensaje')).toBeInTheDocument();

    // Switch to Ventas tab
    fireEvent.click(screen.getByText(/Ventas \(1\)/));

    await waitFor(() => {
      expect(screen.getByText('Teclado Mecánico')).toBeInTheDocument();
      expect(screen.getByText('Nueva venta · Artículo reservado')).toBeInTheDocument();
    });

    // Switch to Mis pujas tab
    fireEvent.click(screen.getByText(/Mis pujas \(1\)/));

    await waitFor(() => {
      expect(screen.getByText('Reloj Vintage')).toBeInTheDocument();
      expect(screen.getByText('Puja superada')).toBeInTheDocument();
    });
  });
});
