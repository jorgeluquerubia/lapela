'use client';

import { useState } from 'react';

interface FiltroAnunciosProps {
  onApplyFilters: (filters: { category: string; minPrice: string; maxPrice: string; location: string }) => void;
}

export default function FiltroAnuncios({ onApplyFilters }: FiltroAnunciosProps) {
  const [category, setCategory] = useState('Todas');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [location, setLocation] = useState('');

  const handleApply = () => {
    onApplyFilters({
      category,
      minPrice,
      maxPrice,
      location,
    });
  };

  return (
    <aside className="w-full md:w-64 lg:w-72 bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Filtrar por</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option>Todas</option>
            <option>Electrónica</option>
            <option>Hogar</option>
            <option>Deporte</option>
            <option>Moda</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Precio</label>
          <div className="flex items-center space-x-2 mt-1">
            <input type="number" placeholder="Mín." value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            <span className="text-gray-500">-</span>
            <input type="number" placeholder="Máx." value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">Ubicación</label>
          <input type="text" id="location" placeholder="Ciudad o código postal" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200" onClick={handleApply}>
          Aplicar Filtros
        </button>
      </div>
    </aside>
  );
}
