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

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
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

  describe('Peseta equivalence and payment disclaimers (LP-FEAT-016)', () => {
    it('renders AC-01 peseta equivalence for 75.00 € product (≈ 12.479 ptas.) in detail price', () => {
      const item75 = { ...sampleItem, price_cents: 7500 };
      render(<ProductDetailInteractive initialItem={item75} slug="bicicleta-sevilla" />);

      // Main euro price and peseta equivalence
      expect(screen.getByText('≈ 12.479 ptas.')).toBeInTheDocument();
      expect(screen.getByText(/Equivalencia histórica · El pago se realiza en euros/i)).toBeInTheDocument();
    });

    it('shows peseta equivalence and payment reminder in buy confirmation dialog (AC-04)', () => {
      render(<ProductDetailInteractive initialItem={sampleItem} slug="bicicleta-sevilla" />);

      fireEvent.click(screen.getByRole('button', { name: /Comprar ahora/i }));

      const dialog = screen.getByRole('dialog');
      // 150.00 € + 10.00 € shipping = 160.00 € -> 160 * 166.386 = 26621.76 -> ≈ 26.622 ptas.
      expect(within(dialog).getByText('≈ 26.622 ptas.')).toBeInTheDocument();
      expect(within(dialog).getByText(/Equivalencia histórica · El pago se realiza en euros/i)).toBeInTheDocument();
    });

    it('recalculates peseta equivalence dynamically when bidding in auctions (AC-02 & AC-04)', () => {
      const auctionItem = {
        ...sampleItem,
        mode: 'auction',
        type: 'auction',
        price_cents: 5000,
        bid_count: 1,
        bids: [
          {
            id: 'b1',
            amount_cents: 5000,
            created_at: new Date().toISOString(),
            bidder: { alias: 'pujador1' },
          },
        ],
      };

      render(<ProductDetailInteractive initialItem={auctionItem} slug="bicicleta-sevilla" />);

      // Bid history shows equivalence for 50.00 € (50 * 166.386 = 8319.3 -> 8.319 ptas.)
      expect(screen.getAllByText('≈ 8.319 ptas.').length).toBeGreaterThanOrEqual(1);

      // Change bid to 75 €
      const bidInput = screen.getByLabelText(/Tu puja \(€\)/i);
      fireEvent.change(bidInput, { target: { value: '75' } });

      // Live equivalence in bid form updates without external request (AC-02)
      expect(screen.getByText('≈ 12.479 ptas.')).toBeInTheDocument();

      // Click Revisar puja
      fireEvent.click(screen.getByRole('button', { name: /Revisar puja/i }));

      // Confirmation displays equivalence and explicit disclaimer (AC-04)
      const confirmGroup = screen.getByRole('group', { name: /Confirmar puja/i });
      expect(within(confirmGroup).getByText('≈ 12.479 ptas.')).toBeInTheDocument();
      expect(within(confirmGroup).getByText(/Equivalencia histórica · El pago se realiza en euros/i)).toBeInTheDocument();
    });

    it('muestra el distintivo y enlace a la edición destacada (RF-03)', () => {
      const featuredAuction = {
        ...sampleItem,
        mode: 'auction',
        featuredEdition: {
          id: 'ed-1',
          slug: 'edicion-1',
          title: 'Selección Septiembre',
        },
      };

      render(<ProductDetailInteractive initialItem={featuredAuction} slug="bicicleta-sevilla" />);
      const link = screen.getByRole('link', { name: /La Subasta de la Pela · Selección Septiembre/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/subastas/ediciones/edicion-1');
    });
  });

  describe('Social share action (LP-FEAT-020)', () => {
    it('shows Compartir anuncio button on active available listings and opens share modal (AC-01)', () => {
      render(<ProductDetailInteractive initialItem={sampleItem} slug="bicicleta-sevilla" />);

      const shareBtn = screen.getByRole('button', { name: /compartir anuncio/i });
      expect(shareBtn).toBeInTheDocument();

      fireEvent.click(shareBtn);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByRole('heading', { name: /compartir anuncio/i })).toBeInTheDocument();
    });

    it('does not show Compartir button on demo listings or unavailable items (AC-06)', () => {
      const { unmount } = render(
        <ProductDetailInteractive initialItem={sampleItem} slug="bicicleta-sevilla" demo={true} />
      );
      expect(screen.queryByRole('button', { name: /compartir anuncio/i })).not.toBeInTheDocument();
      unmount();

      const soldItem = { ...sampleItem, status: 'sold' };
      render(<ProductDetailInteractive initialItem={soldItem} slug="bicicleta-sevilla" />);
      expect(screen.queryByRole('button', { name: /compartir anuncio/i })).not.toBeInTheDocument();
    });
  });
});
