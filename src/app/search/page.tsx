'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';

interface Category {
  category: string;
}

// --- Pagination Component ---
function Pagination({ currentPage, totalCount, pageSize }: { currentPage: number, totalCount: number, pageSize: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const pageNumbers = [];
  // Logic to show a limited number of page links (e.g., << 1 ... 4 5 6 ... 10 >>)
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex justify-center items-center gap-2 mt-8">
      <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">
        Anterior
      </button>
      {startPage > 1 && (
        <>
          <button onClick={() => handlePageChange(1)} className="px-3 py-1 border rounded">1</button>
          {startPage > 2 && <span className="px-3 py-1">...</span>}
        </>
      )}
      {pageNumbers.map(num => (
        <button
          key={num}
          onClick={() => handlePageChange(num)}
          className={`px-3 py-1 border rounded ${currentPage === num ? 'bg-indigo-600 text-white' : ''}`}
        >
          {num}
        </button>
      ))}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-3 py-1">...</span>}
          <button onClick={() => handlePageChange(totalPages)} className="px-3 py-1 border rounded">{totalPages}</button>
        </>
      )}
      <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">
        Siguiente
      </button>
    </nav>
  );
}


// --- Filter Sidebar Component ---
function FilterSidebar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');

  const handleFilterChange = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set('minPrice', minPrice); else params.delete('minPrice');
    if (maxPrice) params.set('maxPrice', maxPrice); else params.delete('maxPrice');
    if (location) params.set('location', location); else params.delete('location');
    params.set('page', '1'); // Reset to first page on filter change
    router.push(`${pathname}?${params.toString()}`);
  }, [minPrice, maxPrice, location, searchParams, pathname, router]);

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get('category') === category || category === 'Todas') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    params.set('page', '1'); // Reset to first page on filter change
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <aside className="w-full lg:w-1/4 xl:w-1/5">
      <h2 className="text-xl font-bold mb-4">Filtros</h2>
      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <h3 className="font-semibold mb-2">Categoría</h3>
          <ul className="space-y-1">
            <li key="all">
              <button
                onClick={() => handleCategoryClick('Todas')}
                className={`w-full text-left px-2 py-1 rounded ${!searchParams.get('category') || searchParams.get('category') === 'Todas' ? 'bg-indigo-100 text-indigo-700 font-bold' : 'hover:bg-gray-100'}`}
              >
                Todas
              </button>
            </li>
            {categories.map(({ category }) => (
              <li key={category}>
                <button
                  onClick={() => handleCategoryClick(category)}
                  className={`w-full text-left px-2 py-1 rounded ${searchParams.get('category') === category ? 'bg-indigo-100 text-indigo-700 font-bold' : 'hover:bg-gray-100'}`}
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Price Filter */}
        <div>
          <h3 className="font-semibold mb-2">Precio (€)</h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Mín"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Máx"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        {/* Location Filter */}
        <div>
          <h3 className="font-semibold mb-2">Ubicación</h3>
          <input
            type="text"
            placeholder="Ciudad, provincia..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        
        <button
          onClick={handleFilterChange}
          className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700"
        >
          Aplicar Filtros
        </button>
      </div>
    </aside>
  );
}

// --- Search Results Component ---
function SearchResults() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 12;

  useEffect(() => {
    const fetchProducts = () => {
      setLoading(true);
      const params = new URLSearchParams(searchParams.toString());
      fetch(`/api/products?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          setProducts(data.products || []);
          setTotalCount(data.totalCount || 0);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    };
    fetchProducts();
  }, [searchParams]);

  if (loading) {
    return <p className="text-center py-10">Buscando productos...</p>;
  }
  
  const query = searchParams.get('q');

  return (
    <main className="w-full lg:w-3/4 xl:w-4/5">
      <h1 className="text-2xl font-bold mb-6">
        {query ? `Resultados para: ` : 'Explorar todos los productos'}
        {query && <span className="text-indigo-600">{query}</span>}
      </h1>
      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination currentPage={page} totalCount={totalCount} pageSize={pageSize} />
        </>
      ) : (
        <p className="text-center py-10 text-gray-600">No se encontraron productos con los criterios actuales.</p>
      )}
    </main>
  );
}

// --- Main Page Component ---
export default function SearchPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/products/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Failed to fetch categories", err));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <Suspense fallback={<p>Cargando filtros...</p>}>
          <FilterSidebar categories={categories} />
        </Suspense>
        <Suspense fallback={<p>Cargando búsqueda...</p>}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}
