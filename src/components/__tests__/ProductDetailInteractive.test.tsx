import { render, screen, fireEvent, within } from '@testing-library/react';

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'buyer-user-123' },
    loading: false,
  }),
}));

jest.mock('@/lib/api', () => ({
  api: jest.fn().mockReturnValue(new Promise(() => {})),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../ProductQA', () => {
  return () => <div data-testid="mock-qa">Mock QA</div>;
});

import ProductDetailInteractive from '../ProductDetailInteractive';

describe('ProductDetailInteractive Confirmation and Purchase Policy (LP-FEAT-006)', () => {
  const sampleItem = {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Bicicleta de montaña',
    description: 'En perfecto estado con cambio Shimano.',
    category: 'Deporte',
    condition: 'Como nuevo',
    location: 'Sevilla',
    mode: 'sale',
    price_cents: 15000,
    shipping_cents: 1000,
    delivery: 'shipping',
    images: ['https://example.com/bike.jpg'],
    status: 'available',
    mine: false,
  };

  it('shows confirmation dialog with 48h reservation warning and policy link when clicking Comprar ahora', () => {
    render(<ProductDetailInteractive initialItem={sampleItem} slug="bicicleta-sevilla" />);

    const buyButton = screen.getByRole('button', { name: /Comprar ahora/i });
    expect(buyButton).toBeInTheDocument();

    fireEvent.click(buyButton);

    // Dialog appears
    const dialog = screen.getByRole('dialog', { name: /¿Confirmar la compra de este artículo\?/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/reservado para ti durante 48 horas/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/penalizaciones en tu cuenta/i)).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /política de compras/i })).toHaveAttribute('href', '/politica-de-compras');

    // Confirm and Cancel buttons exist
    expect(within(dialog).getByRole('button', { name: /Confirmar y reservar/i })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
  });

  it('cancels confirmation dialog when clicking Cancelar', () => {
    render(<ProductDetailInteractive initialItem={sampleItem} slug="bicicleta-sevilla" />);

    fireEvent.click(screen.getByRole('button', { name: /Comprar ahora/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Comprar ahora/i })).toBeInTheDocument();
  });
});
