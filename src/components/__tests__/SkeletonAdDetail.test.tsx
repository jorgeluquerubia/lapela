import { render, screen } from '@testing-library/react';
import SkeletonAdDetail from '../SkeletonAdDetail';

describe('SkeletonAdDetail', () => {
  it('debería renderizarse sin errores', () => {
    render(<SkeletonAdDetail />);
    // Como es un componente visual sin texto, podemos simplemente
    // comprobar que no lanza errores al renderizarse.
    // Para una comprobación más robusta, podríamos añadir un data-testid al div principal.
    const mainDiv = screen.getByRole('main', { hidden: true });
    expect(mainDiv).toBeInTheDocument();
  });
});
