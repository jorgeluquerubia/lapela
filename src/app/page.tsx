'use client';

import { useState, useEffect, useCallback } from 'react';
import FiltroAnuncios from '@/components/FiltroAnuncios';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import SkeletonCard from '@/components/SkeletonCard';

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

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="md:hidden mb-4">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="w-full bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM3 16a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"></path></svg>
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <FiltroAnuncios onApplyFilters={handleApplyFilters} />
        </div>

        <main className="flex-grow">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Últimos anuncios</h2>
          
          {error && <p className="text-center py-4 text-red-600">{error}</p>}
          {!loading && !error && products.length === 0 && <p className="text-center py-4">No se encontraron anuncios.</p>}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)
            ) : (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
