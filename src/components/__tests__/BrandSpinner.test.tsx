import { render, screen } from '@testing-library/react';
import BrandSpinner from '../BrandSpinner';

describe('BrandSpinner component (LP-FEAT-008)', () => {
  it('renders with role="status" and default accessible label', () => {
    render(<BrandSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Cargando…');
    expect(screen.getByText('Cargando…')).toHaveClass('sr-only');
    expect(screen.getByText('lp')).toBeInTheDocument();
    expect(screen.getByText('↗')).toBeInTheDocument();
  });

  it('applies custom label and size class', () => {
    const { container, rerender } = render(<BrandSpinner size="sm" label="Buscando productos…" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Buscando productos…');
    expect(container.querySelector('.brand-spinner-sm')).toBeInTheDocument();

    rerender(<BrandSpinner size="lg" label="Cargando catálogo…" className="custom-class" />);
    expect(container.querySelector('.brand-spinner-lg')).toBeInTheDocument();
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });
});
