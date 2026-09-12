import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Order from '../page';
import * as apiModule from '@/lib/api';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'order-uuid-9999' }),
}));

jest.mock('next/link', () => {
  return ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  );
});

jest.mock('@/lib/api', () => ({
  api: jest.fn(),
}));

describe('Order Reviews (/orders/[id]) (LP-FEAT-013 - AC-03, AC-06)', () => {
  const buyerId = 'buyer-uuid-1111';
  const sellerId = 'seller-uuid-2222';

  const baseCompletedOrder = {
    id: 'order-uuid-9999',
    buyer_id: buyerId,
    seller_id: sellerId,
    amount_cents: 8500,
    status: 'completed',
    expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    payment_mode: 'simulated',
    tracking: 'ENVIO12345',
    shipping_address: null,
    seller: { alias: 'vendedora_pro' },
    buyer: { alias: 'comprador_feliz' },
    listing: {
      id: 'listing-uuid-5678',
      title: 'Pluma estilográfica antigua',
      images: ['https://example.com/pluma.jpg'],
      delivery: 'shipping',
      location: 'Barcelona',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders counterpart aliases in completed order (AC-03)', async () => {
    (apiModule.api as jest.Mock).mockResolvedValue({
      order: baseCompletedOrder,
      messages: [],
      reviews: [],
      userId: buyerId,
      canReview: true,
      simulated: false,
      canMessage: true,
    });

    render(<Order />);

    await waitFor(() => {
      expect(screen.getByText('Entrega completada')).toBeInTheDocument();
    });

    expect(screen.getByText('@vendedora_pro')).toBeInTheDocument();
    expect(screen.getByText('@comprador_feliz')).toBeInTheDocument();
  });

  it('renders review form when order is completed and user has not reviewed yet (AC-06)', async () => {
    (apiModule.api as jest.Mock).mockImplementation((path: string) => {
      if (path === 'order/order-uuid-9999') {
        return Promise.resolve({
          order: baseCompletedOrder,
          messages: [],
          reviews: [],
          userId: buyerId,
          canReview: true,
          simulated: false,
          canMessage: true,
        });
      }
      if (path === 'review/order-uuid-9999') {
        return Promise.resolve({ id: 'rev-new', score: 5, comment: 'Excelente servicio' });
      }
      return Promise.resolve({});
    });

    render(<Order />);

    await waitFor(() => {
      expect(screen.getByText(/valora a @vendedora_pro/i)).toBeInTheDocument();
    });

    const scoreSelect = screen.getByLabelText(/valora a @vendedora_pro/i);
    const commentInput = screen.getByLabelText(/comentario opcional/i);
    const submitBtn = screen.getByRole('button', { name: /publicar valoración/i });

    expect(scoreSelect).toHaveValue('5');
    fireEvent.change(scoreSelect, { target: { value: '4' } });
    fireEvent.change(commentInput, { target: { value: 'Envío rápido y bien protegido.' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiModule.api).toHaveBeenCalledWith('review/order-uuid-9999', {
        score: 4,
        comment: 'Envío rápido y bien protegido.',
      });
    });
  });

  it('renders existing reviews and hides review form when user already reviewed (AC-06)', async () => {
    (apiModule.api as jest.Mock).mockResolvedValue({
      order: baseCompletedOrder,
      messages: [],
      reviews: [
        {
          id: 'rev-existing-1',
          author_id: buyerId,
          recipient_id: sellerId,
          score: 5,
          comment: 'Todo perfecto, 100% recomendable.',
          author: { alias: 'comprador_feliz' },
          created_at: new Date().toISOString(),
        },
      ],
      userId: buyerId,
      canReview: false,
      simulated: false,
      canMessage: true,
    });

    render(<Order />);

    await waitFor(() => {
      expect(screen.getByText('Entrega completada')).toBeInTheDocument();
    });

    expect(screen.getByText('Todo perfecto, 100% recomendable.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /publicar valoración/i })).not.toBeInTheDocument();
  });
});
