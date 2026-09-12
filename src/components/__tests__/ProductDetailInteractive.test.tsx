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

  describe('Object Stories (LP-FEAT-017)', () => {
    it('renders "La historia de este objeto" and "Con historia" badges when story is present (AC-02, AC-03)', () => {
      const itemWithStory = {
        ...sampleItem,
        story: 'Este objeto perteneció a mi familia durante décadas y tiene gran valor sentimental.',
      };

      render(<ProductDetailInteractive initialItem={itemWithStory} slug="bicicleta-sevilla" />);

      // Distinct story heading and text (AC-02)
      expect(screen.getByRole('heading', { level: 3, name: /La historia de este objeto/i })).toBeInTheDocument();
      expect(screen.getByText('Este objeto perteneció a mi familia durante décadas y tiene gran valor sentimental.')).toBeInTheDocument();

      // "Con historia" badges in chips and panel (AC-03)
      const badges = screen.getAllByText('Con historia');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('does NOT render story block or "Con historia" badge when story is absent (AC-03)', () => {
      render(<ProductDetailInteractive initialItem={sampleItem} slug="bicicleta-sevilla" />);

      expect(screen.queryByRole('heading', { level: 3, name: /La historia de este objeto/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Con historia')).not.toBeInTheDocument();
    });

    it('renders story content safely as plain text without HTML execution (AC-05, RNF-01)', () => {
      const dangerousStory = '<script>window.__pwned=true</script><b>Texto en negrita</b>';
      const itemWithHtml = {
        ...sampleItem,
        story: dangerousStory,
      };

      const { container } = render(<ProductDetailInteractive initialItem={itemWithHtml} slug="bicicleta-sevilla" />);

      // It must be rendered as literal text content, not parsed HTML elements
      expect(screen.getByText(dangerousStory)).toBeInTheDocument();
      expect(container.querySelector('script')).toBeNull();
      expect(container.querySelector('b')).toBeNull();
    });

    it('allows seller to remove story from the ad (RF-04)', async () => {
      const { api } = require('@/lib/api');
      (api as jest.Mock).mockResolvedValueOnce({ success: true });

      const myItemWithStory = {
        ...sampleItem,
        mine: true,
        story: 'Historia para retirar.',
      };

      render(<ProductDetailInteractive initialItem={myItemWithStory} slug="bicicleta-sevilla" />);

      const removeBtn = screen.getByRole('button', { name: /Retirar historia/i });
      expect(removeBtn).toBeInTheDocument();

      fireEvent.click(removeBtn);

      expect(api).toHaveBeenCalledWith('remove-story/' + myItemWithStory.id, {});
    });
  });
});
