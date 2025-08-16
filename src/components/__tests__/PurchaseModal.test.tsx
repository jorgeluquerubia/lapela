import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PurchaseModal from '../PurchaseModal';
import { Product } from '@/types';
import toast from 'react-hot-toast';

// Mock de react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock de fetch
global.fetch = jest.fn();

const mockProduct: Product = {
  id: '1',
  name: 'Producto de prueba',
  price: 99.99,
  type: 'venta_directa',
  seller: 'test-seller',
  location: 'Test Location',
  time: new Date().toISOString(),
  image: 'http://example.com/image.png',
  description: 'Descripción de prueba',
  status: 'available',
  buyer: null,
  updated_at: new Date().toISOString(),
  user_id: 'user-123',
  category: 'Categoría de prueba',
};

describe('PurchaseModal', () => {
  const mockOnClose = jest.fn();
  const mockOnPurchaseComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('debería renderizar la información del producto y el formulario de dirección', () => {
    render(
      <PurchaseModal
        isOpen={true}
        onClose={mockOnClose}
        product={mockProduct}
        onPurchaseComplete={mockOnPurchaseComplete}
      />
    );

    expect(screen.getByText('Finalizar Compra')).toBeInTheDocument();
    expect(screen.getByText(`Producto: ${mockProduct.name}`)).toBeInTheDocument();
    expect(screen.getByText(`Precio: ${mockProduct.price} €`)).toBeInTheDocument();
    expect(screen.getByText('Introduce tu dirección de envío')).toBeInTheDocument();
    expect(screen.getByLabelText(/Dirección/i)).toBeInTheDocument();
  });

  it('debería gestionar el proceso de compra correctamente con un envío de formulario exitoso', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'addr-123' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'order-456' }),
      });

    render(
      <PurchaseModal
        isOpen={true}
        onClose={mockOnClose}
        product={mockProduct}
        onPurchaseComplete={mockOnPurchaseComplete}
      />
    );

    // Rellenar y enviar el formulario
    fireEvent.change(screen.getByLabelText(/Nombre completo/i), { target: { value: 'Homer Simpson' } });
    fireEvent.change(screen.getByLabelText(/Dirección/i), { target: { value: 'Calle Falsa 123' } });
    fireEvent.change(screen.getByLabelText(/Ciudad/i), { target: { value: 'Springfield' } });
    fireEvent.change(screen.getByLabelText(/Provincia/i), { target: { value: 'Illinois' } });
    fireEvent.change(screen.getByLabelText(/Código Postal/i), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText(/País/i), { target: { value: 'EEUU' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar y continuar/i }));

    // Esperar a que se completen las llamadas a la API y las actualizaciones de estado
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // Verificar la llamada a la API de direcciones
    expect(global.fetch).toHaveBeenCalledWith('/api/shipping-addresses', expect.any(Object));

    // Verificar la llamada a la API de órdenes
    expect(global.fetch).toHaveBeenCalledWith('/api/orders', expect.any(Object));

    // Verificar notificaciones y callbacks
    expect(toast.success).toHaveBeenCalledWith('¡Compra finalizada! El vendedor ha sido notificado.');
    expect(mockOnPurchaseComplete).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('debería mostrar un mensaje de error si falla la creación de la dirección', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(
      <PurchaseModal
        isOpen={true}
        onClose={mockOnClose}
        product={mockProduct}
        onPurchaseComplete={mockOnPurchaseComplete}
      />
    );

    // Rellenar y enviar el formulario para que se active el submit
    fireEvent.change(screen.getByLabelText(/Nombre completo/i), { target: { value: 'Homer Simpson' } });
    fireEvent.change(screen.getByLabelText(/Dirección/i), { target: { value: 'Calle Falsa 123' } });
    fireEvent.change(screen.getByLabelText(/Ciudad/i), { target: { value: 'Springfield' } });
    fireEvent.change(screen.getByLabelText(/Provincia/i), { target: { value: 'Illinois' } });
    fireEvent.change(screen.getByLabelText(/Código Postal/i), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText(/País/i), { target: { value: 'EEUU' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar y continuar/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('No se pudo guardar la dirección de envío.');
    });

    expect(mockOnPurchaseComplete).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
