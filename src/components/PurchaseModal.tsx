'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import ShippingAddressForm from './ShippingAddressForm';
import { Product } from '@/types';
import toast from 'react-hot-toast';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onPurchaseComplete: () => void;
}

export default function PurchaseModal({ isOpen, onClose, product, onPurchaseComplete }: PurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddressSubmit = async (address: any) => {
    setIsLoading(true);
    try {
      // 1. Save the shipping address
      const addressResponse = await fetch('/api/shipping-addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });

      if (!addressResponse.ok) {
        throw new Error('No se pudo guardar la dirección de envío.');
      }
      const savedAddress = await addressResponse.json();

      // 2. Create the order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          seller_id: product.user_id,
          shipping_address_id: savedAddress.id,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('No se pudo crear la orden de compra.');
      }

      toast.success('¡Compra finalizada! El vendedor ha sido notificado.');
      onPurchaseComplete();
      onClose();

    } catch (error: any) {
      toast.error(error.message || 'Ocurrió un error al finalizar la compra.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Finalizar Compra">
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Producto: {product.name}</h3>
        <p className="text-xl font-bold mb-4">Precio: {product.price} €</p>
        <hr className="my-4" />
        <h4 className="text-md font-semibold mb-2">Introduce tu dirección de envío</h4>
        <ShippingAddressForm onSubmit={handleAddressSubmit} isLoading={isLoading} />
      </div>
    </Modal>
  );
}
