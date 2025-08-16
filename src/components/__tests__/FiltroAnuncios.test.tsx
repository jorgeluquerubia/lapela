import { render, screen, fireEvent } from '@testing-library/react';
import FiltroAnuncios from '../FiltroAnuncios';

describe('FiltroAnuncios', () => {
  it('calls onApplyFilters with the correct filter values when the form is submitted', () => {
    const handleApplyFilters = jest.fn();
    render(<FiltroAnuncios onApplyFilters={handleApplyFilters} />);

    // Change category
    fireEvent.change(screen.getByLabelText(/categoría/i), {
      target: { value: 'Electrónica' },
    });

    // Change price range
    fireEvent.change(screen.getByPlaceholderText(/mín./i), {
      target: { value: '100' },
    });
    fireEvent.change(screen.getByPlaceholderText(/máx./i), {
      target: { value: '500' },
    });

    // Change location
    fireEvent.change(screen.getByLabelText(/ubicación/i), {
      target: { value: 'Madrid' },
    });

    // Click the apply button
    fireEvent.click(screen.getByRole('button', { name: /aplicar filtros/i }));

    // Check if onApplyFilters was called with the correct data
    expect(handleApplyFilters).toHaveBeenCalledTimes(1);
    expect(handleApplyFilters).toHaveBeenCalledWith({
      category: 'Electrónica',
      minPrice: '100',
      maxPrice: '500',
      location: 'Madrid',
    });
  });
});
