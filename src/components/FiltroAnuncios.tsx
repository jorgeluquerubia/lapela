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
    <aside className="filter-sidebar">
      <h3>Filtrar por</h3>
      <div className="filter-group">
        <h4>Categoría</h4>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>Todas</option>
          <option>Electrónica</option>
          <option>Hogar</option>
          <option>Deporte</option>
          <option>Moda</option>
        </select>
      </div>
      <div className="filter-group">
        <h4>Precio</h4>
        <input type="number" placeholder="Mín." value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        <input type="number" placeholder="Máx." value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
      </div>
      <div className="filter-group">
        <h4>Ubicación</h4>
        <input type="text" placeholder="Ciudad o código postal" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <button className="button" onClick={handleApply}>Aplicar Filtros</button>
    </aside>
  );
}