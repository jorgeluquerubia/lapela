import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal', () => {
  it('renders the modal with its children when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Título de Prueba">
        <div>Contenido del Modal</div>
      </Modal>
    );

    expect(screen.getByText('Contenido del Modal')).toBeInTheDocument();
    expect(screen.getByText('Título de Prueba')).toBeInTheDocument();
  });

  it('does not render the modal when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Título de Prueba">
        <div>Contenido del Modal</div>
      </Modal>
    );

    expect(screen.queryByText('Contenido del Modal')).not.toBeInTheDocument();
  });

  it('calls the onClose function when the close button is clicked', () => {
    const handleClose = jest.fn();
    const handleConfirm = jest.fn();

    render(
      <Modal 
        isOpen={true} 
        onClose={handleClose} 
        onConfirm={handleConfirm} 
        title="Título de Prueba"
      >
        <div>Contenido del Modal</div>
      </Modal>
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleConfirm).not.toHaveBeenCalled();
  });
});
