import { render, screen, fireEvent } from '@testing-library/react';
import ShippingAddressForm from '../ShippingAddressForm';

describe('ShippingAddressForm', () => {
  it('allows the user to fill out and submit the form', async () => {
    const handleSubmit = jest.fn();
    render(<ShippingAddressForm onSubmit={handleSubmit} isLoading={false} />);

    // Fill out the form fields
    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'Juan Pérez' },
    });
    fireEvent.change(screen.getByLabelText(/dirección/i), {
      target: { value: 'Calle Falsa 123' },
    });
    fireEvent.change(screen.getByLabelText(/ciudad/i), {
      target: { value: 'Springfield' },
    });
     fireEvent.change(screen.getByLabelText(/provincia/i), {
      target: { value: 'Provincia Falsa' },
    });
    fireEvent.change(screen.getByLabelText(/código postal/i), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByLabelText(/país/i), {
      target: { value: 'EEUU' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /guardar y continuar/i }));

    // Check if onSubmit was called with the correct data
    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({
      full_name: 'Juan Pérez',
      address_line_1: 'Calle Falsa 123',
      address_line_2: '',
      city: 'Springfield',
      state: 'Provincia Falsa',
      postal_code: '12345',
      country: 'EEUU',
      additional_details: '',
    });
  });
});
