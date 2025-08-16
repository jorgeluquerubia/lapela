'use client';

import Modal from './Modal';
import { ShippingAddress } from '@/types';

interface ShippingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shippingAddress: ShippingAddress | null;
  onMarkAsShipped: () => void;
  isMarkingAsShipped: boolean;
}

const ShippingDetailsModal = ({
  isOpen,
  onClose,
  shippingAddress,
  onMarkAsShipped,
  isMarkingAsShipped,
}: ShippingDetailsModalProps) => {
  if (!shippingAddress) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Datos de Envío del Comprador"
    >
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-800">Dirección de Envío</h3>
          <p className="text-gray-600">{shippingAddress.address_line_1}</p>
          {shippingAddress.address_line_2 && <p className="text-gray-600">{shippingAddress.address_line_2}</p>}
          <p className="text-gray-600">{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</p>
          <p className="text-gray-600">{shippingAddress.country}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Contacto</h3>
          <p className="text-gray-600">Teléfono: {shippingAddress.phone_number || 'No proporcionado'}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          onClick={onMarkAsShipped}
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={isMarkingAsShipped}
        >
          {isMarkingAsShipped ? 'Marcando...' : 'Marcar como Enviado'}
        </button>
      </div>
    </Modal>
  );
};

export default ShippingDetailsModal;
