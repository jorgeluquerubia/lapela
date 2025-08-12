'use client';

import { useState } from 'react';

interface Address {
  full_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  additional_details: string;
}

interface ShippingAddressFormProps {
  onSubmit: (address: Address) => void;
  isLoading: boolean;
}

export default function ShippingAddressForm({ onSubmit, isLoading }: ShippingAddressFormProps) {
  const [address, setAddress] = useState<Address>({
    full_name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'España',
    additional_details: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(address);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Nombre completo</label>
        <input type="text" name="full_name" id="full_name" value={address.full_name} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
      </div>
      <div>
        <label htmlFor="address_line_1" className="block text-sm font-medium text-gray-700">Dirección</label>
        <input type="text" name="address_line_1" id="address_line_1" value={address.address_line_1} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
      </div>
      <div>
        <label htmlFor="address_line_2" className="block text-sm font-medium text-gray-700">Apartamento, piso, etc. (opcional)</label>
        <input type="text" name="address_line_2" id="address_line_2" value={address.address_line_2} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">Ciudad</label>
          <input type="text" name="city" id="city" value={address.city} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">Provincia</label>
          <input type="text" name="state" id="state" value={address.state} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">Código postal</label>
          <input type="text" name="postal_code" id="postal_code" value={address.postal_code} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700">País</label>
          <input type="text" name="country" id="country" value={address.country} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
      </div>
      <div>
        <label htmlFor="additional_details" className="block text-sm font-medium text-gray-700">Detalles adicionales (opcional)</label>
        <textarea name="additional_details" id="additional_details" value={address.additional_details} onChange={handleChange} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"></textarea>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50">
          {isLoading ? 'Guardando...' : 'Guardar y continuar'}
        </button>
      </div>
    </form>
  );
}
