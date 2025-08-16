import { render, screen, fireEvent } from '@testing-library/react';
import ShippingDetailsModal from '../ShippingDetailsModal';
import { ShippingAddress } from '@/types';

const mockAddress: ShippingAddress = {
  id: 'addr-123',
  user_id: 'user-456',
  full_name: 'John Doe',
  address_line_1: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  postal_code: '12345',
  country: 'USA',
  phone_number: '555-1234',
  created_at: new Date().toISOString(),
};

describe('ShippingDetailsModal', () => {
  const mockOnClose = jest.fn();
  const mockOnMarkAsShipped = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no debería renderizar nada si no hay dirección de envío', () => {
    const { container } = render(
      <ShippingDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        shippingAddress={null}
        onMarkAsShipped={mockOnMarkAsShipped}
        isMarkingAsShipped={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('debería renderizar los detalles de la dirección de envío correctamente', () => {
    render(
      <ShippingDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        shippingAddress={mockAddress}
        onMarkAsShipped={mockOnMarkAsShipped}
        isMarkingAsShipped={false}
      />
    );

    expect(screen.getByText('Datos de Envío del Comprador')).toBeInTheDocument();
    expect(screen.getByText(mockAddress.address_line_1)).toBeInTheDocument();
    expect(screen.getByText(`${mockAddress.city}, ${mockAddress.state} ${mockAddress.postal_code}`)).toBeInTheDocument();
    expect(screen.getByText(mockAddress.country)).toBeInTheDocument();
    expect(screen.getByText(`Teléfono: ${mockAddress.phone_number}`)).toBeInTheDocument();
  });

  it('debería llamar a onMarkAsShipped cuando se hace clic en el botón', () => {
    render(
      <ShippingDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        shippingAddress={mockAddress}
        onMarkAsShipped={mockOnMarkAsShipped}
        isMarkingAsShipped={false}
      />
    );

    const button = screen.getByRole('button', { name: /Marcar como Enviado/i });
    fireEvent.click(button);
    expect(mockOnMarkAsShipped).toHaveBeenCalledTimes(1);
  });

  it('debería deshabilitar el botón y mostrar "Marcando..." cuando isMarkingAsShipped es true', () => {
    render(
      <ShippingDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        shippingAddress={mockAddress}
        onMarkAsShipped={mockOnMarkAsShipped}
        isMarkingAsShipped={true}
      />
    );

    const button = screen.getByRole('button', { name: /Marcando.../i });
    expect(button).toBeDisabled();
  });
});
