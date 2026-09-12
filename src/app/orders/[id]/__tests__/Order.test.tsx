import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Order from '../page';
import * as apiModule from '@/lib/api';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'order-uuid-1234' }),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

jest.mock('@/lib/api', () => ({
  api: jest.fn(),
}));

describe('Order page - Chat in reservation & in-person payment (LP-FEAT-007)', () => {
  const buyerId = 'buyer-uuid-1111';
  const sellerId = 'seller-uuid-2222';

  const baseOrder = {
    id: 'order-uuid-1234',
    buyer_id: buyerId,
    seller_id: sellerId,
    amount_cents: 5000,
    status: 'pending_payment',
    expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    payment_mode: null,
    tracking: null,
    shipping_address: null,
    listing: {
      id: 'listing-uuid-5678',
      title: 'Cámara réflex profesional',
      images: ['https://example.com/camera.jpg'],
      delivery: 'pickup',
      location: 'Madrid',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat and in-person payment confirmation option for the seller during pending_payment', async () => {
    (apiModule.api as jest.Mock).mockImplementation((path: string) => {
      if (path === 'order/order-uuid-1234') {
        return Promise.resolve({
          order: baseOrder,
          messages: [
            { id: 'msg-1', sender_id: buyerId, content: 'Hola, ¿podemos quedar en Sol?', created_at: new Date().toISOString() },
          ],
          userId: sellerId,
          simulated: false,
          canMessage: true,
        });
      }
      if (path === 'pay-in-person/order-uuid-1234') {
        return Promise.resolve({ success: true });
      }
      return Promise.resolve({});
    });

    render(<Order />);

    // Wait for order to load
    await waitFor(() => {
      expect(screen.getByText('Pendiente de pago')).toBeInTheDocument();
    });

    // Chat is enabled and shows messages
    expect(screen.getByText('Hola, ¿podemos quedar en Sol?')).toBeInTheDocument();
    expect(screen.getByLabelText(/Mensaje sobre la entrega o pago/i)).toBeInTheDocument();

    // Seller sees button to mark payment received in person
    const inPersonBtn = screen.getByRole('button', { name: /Marcar pago recibido en persona/i });
    expect(inPersonBtn).toBeInTheDocument();

    // Click it to open confirmation
    fireEvent.click(inPersonBtn);
    expect(screen.getByText(/¿Confirmas que has cobrado los/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /Sí, marcar como cobrado y vendido/i });
    expect(confirmBtn).toBeInTheDocument();

    // Confirm in person payment
    fireEvent.click(confirmBtn);
    await waitFor(() => {
      expect(apiModule.api).toHaveBeenCalledWith('pay-in-person/order-uuid-1234', expect.anything());
    });
  });

  it('renders chat for buyer during pending_payment without in-person payment button', async () => {
    (apiModule.api as jest.Mock).mockResolvedValue({
      order: baseOrder,
      messages: [],
      userId: buyerId,
      simulated: false,
      canMessage: true,
    });

    render(<Order />);

    await waitFor(() => {
      expect(screen.getByText('Pendiente de pago')).toBeInTheDocument();
    });

    // Chat is open
    expect(screen.getByText('Ya podéis hablar.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Mensaje sobre la entrega o pago/i)).toBeInTheDocument();

    // Buyer should NOT see seller's in-person payment button
    expect(screen.queryByRole('button', { name: /Marcar pago recibido en persona/i })).not.toBeInTheDocument();
  });

  it('renders peseta equivalence and payment disclaimer in order summary (LP-FEAT-016)', async () => {
    (apiModule.api as jest.Mock).mockResolvedValue({
      order: baseOrder,
      messages: [],
      userId: buyerId,
      simulated: false,
      canMessage: true,
    });

    render(<Order />);

    await waitFor(() => {
      expect(screen.getByText('Pendiente de pago')).toBeInTheDocument();
    });

    // 50.00 € -> ≈ 8.319 ptas.
    expect(screen.getByText('≈ 8.319 ptas.')).toBeInTheDocument();
    expect(screen.getAllByText(/Equivalencia histórica · El pago se realiza en euros/i).length).toBeGreaterThanOrEqual(1);
  });
});
