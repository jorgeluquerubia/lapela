import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SocialShareModal from '../SocialShareModal';

describe('SocialShareModal (LP-FEAT-020)', () => {
  const sampleItem = {
    id: '12345678-1234-4234-8234-1234567890ab',
    title: 'Reloj vintage de oro',
    price_cents: 7500,
    mode: 'sale',
    slug: 'reloj-vintage-de-oro-1234567890ab',
    images: ['https://example.com/watch.jpg'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders modal dialog with accessible title and preview image when open (AC-01, AC-05)', () => {
    render(<SocialShareModal isOpen={true} onClose={jest.fn()} item={sampleItem} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /compartir anuncio/i })).toBeInTheDocument();

    const img = screen.getByAltText(/tarjeta para compartir de reloj vintage de oro/i);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', `/api/social-card/${sampleItem.slug}`);

    // AC-05: Ensure no private data is displayed in modal
    expect(screen.queryByText(/@buyer/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/12345678-1234-4234-8234-1234567890ab/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/@example.com/i)).not.toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<SocialShareModal isOpen={false} onClose={jest.fn()} item={sampleItem} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('copies canonical link to clipboard and shows polite feedback (AC-04)', async () => {
    render(<SocialShareModal isOpen={true} onClose={jest.fn()} item={sampleItem} />);

    const copyBtn = screen.getByRole('button', { name: /copiar enlace/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining(`/articulos/${sampleItem.slug}`)
    );

    await waitFor(() => {
      expect(screen.getAllByText(/¡enlace copiado al portapapeles!/i).length).toBeGreaterThan(0);
    });
  });

  it('handles image download when clicking Descargar imagen (AC-04)', async () => {
    const mockBlob = new Blob(['fake-image-bytes'], { type: 'image/png' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(mockBlob),
    } as any);

    window.URL.createObjectURL = jest.fn().mockReturnValue('blob:http://localhost/fake-blob');
    window.URL.revokeObjectURL = jest.fn();

    const origCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = origCreateElement(tagName);
      if (tagName === 'a') {
        el.click = jest.fn();
      }
      return el;
    });

    render(<SocialShareModal isOpen={true} onClose={jest.fn()} item={sampleItem} />);

    const downloadBtn = screen.getByRole('button', { name: /descargar imagen/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/social-card/${sampleItem.slug}`);
      expect(screen.getAllByText(/descarga preparada/i).length).toBeGreaterThan(0);
    });
    createElementSpy.mockRestore();
  });

  it('calls navigator.share when available and ignores AbortError silently (AC-03)', async () => {
    const mockShare = jest.fn().mockRejectedValue(new DOMException('Share canceled', 'AbortError'));
    (navigator as any).share = mockShare;

    render(<SocialShareModal isOpen={true} onClose={jest.fn()} item={sampleItem} />);

    const shareBtn = screen.getByRole('button', { name: /^compartir$/i });
    expect(shareBtn).toBeInTheDocument();

    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Reloj vintage de oro'),
          url: expect.stringContaining(`/articulos/${sampleItem.slug}`),
        })
      );
    });

    // AbortError should not produce an error notice
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    delete (navigator as any).share;
  });

  it('closes on Escape key press or close button click (RNF-03)', () => {
    const onClose = jest.fn();
    render(<SocialShareModal isOpen={true} onClose={onClose} item={sampleItem} />);

    // Click close button
    const closeBtn = screen.getByRole('button', { name: /cerrar modal de compartir/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Press Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('handles image load failure by removing skeleton and displaying accessible retry error state', () => {
    render(<SocialShareModal isOpen={true} onClose={jest.fn()} item={sampleItem} />);

    // Initial state: skeleton is visible
    expect(screen.getByText(/cargando vista previa de la tarjeta/i)).toBeInTheDocument();

    // Trigger image error
    const img = screen.getByAltText(/tarjeta para compartir de reloj vintage de oro/i);
    fireEvent.error(img);

    // Skeleton is removed
    expect(screen.queryByText(/cargando vista previa de la tarjeta/i)).not.toBeInTheDocument();

    // Accessible error alert is shown
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/no se ha podido cargar la vista previa de la tarjeta/i);

    // Retry button is available
    const retryBtn = screen.getByRole('button', { name: /reintentar/i });
    expect(retryBtn).toBeInTheDocument();

    // Clicking retry resets error state and appends retry param
    fireEvent.click(retryBtn);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    const retriedImg = screen.getByAltText(/tarjeta para compartir de reloj vintage de oro/i);
    expect(retriedImg).toHaveAttribute('src', `/api/social-card/${sampleItem.slug}?retry=1`);
  });

  it('resets state when item changes', () => {
    const { rerender } = render(
      <SocialShareModal isOpen={true} onClose={jest.fn()} item={sampleItem} />
    );

    // Cause error on first item
    const img1 = screen.getByAltText(/tarjeta para compartir de reloj vintage de oro/i);
    fireEvent.error(img1);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Rerender with a second listing
    const sampleItem2 = {
      ...sampleItem,
      id: '87654321-4321-4321-8321-0987654321ba',
      slug: 'camara-antigua-0987654321ba',
      title: 'Cámara antigua',
    };
    rerender(<SocialShareModal isOpen={true} onClose={jest.fn()} item={sampleItem2} />);

    // Error is cleared and skeleton is visible again for the new item
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/cargando vista previa de la tarjeta/i)).toBeInTheDocument();
  });

  it('restores focus to the element that opened the modal when closed', () => {
    // Create an external trigger button and focus it
    const triggerButton = document.createElement('button');
    triggerButton.textContent = 'Abrir modal';
    document.body.appendChild(triggerButton);
    triggerButton.focus();
    expect(document.activeElement).toBe(triggerButton);

    const onClose = jest.fn();
    const { unmount } = render(
      <SocialShareModal isOpen={true} onClose={onClose} item={sampleItem} />
    );

    const closeBtn = screen.getByRole('button', { name: /cerrar modal de compartir/i });
    fireEvent.click(closeBtn);

    expect(document.activeElement).toBe(triggerButton);

    unmount();
    document.body.removeChild(triggerButton);
  });
});
