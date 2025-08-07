'use client';

import { useState, useEffect, useCallback } from 'react';
import FiltroAnuncios from '@/components/FiltroAnuncios';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (searchTerm) queryParams.append('q', searchTerm); // Use 'q' to match the global search
    if (categoryFilter && categoryFilter !== 'Todas') queryParams.append('category', categoryFilter);
    if (minPriceFilter) queryParams.append('minPrice', minPriceFilter);
    if (maxPriceFilter) queryParams.append('maxPrice', maxPriceFilter);
    if (locationFilter) queryParams.append('location', locationFilter);

    const queryString = queryParams.toString();
    const url = `/api/products${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar los anuncios');
      }
      const data = await response.json();
      setProducts(data.products as Product[]); // Correctly access the products array
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter, minPriceFilter, maxPriceFilter, locationFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleApplyFilters = (filters: { category: string; minPrice: string; maxPrice: string; location: string }) => {
    setCategoryFilter(filters.category);
    setMinPriceFilter(filters.minPrice);
    setMaxPriceFilter(filters.maxPrice);
    setLocationFilter(filters.location);
  };

  // The handleSearch function is no longer needed here as the Header now handles global search
  // const handleSearch = (search: string) => {
  //   setSearchTerm(search);
  // };

  return (
    <>
      <FiltroAnuncios onApplyFilters={handleApplyFilters} />

      <section className="product-listing">
        <section className="product-grid">
          <h2>Últimos anuncios</h2>
          {loading && <p className="text-center py-4">Cargando anuncios...</p>}
          {error && <p className="text-center py-4 text-red-600">{error}</p>}
          {!loading && !error && products.length === 0 && <p className="text-center py-4">No se encontraron anuncios.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {!loading && !error && products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </section>
    </>
  );
}
