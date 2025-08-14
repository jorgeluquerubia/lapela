'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { useAuth } from '@/context/AuthContext';

const MyProductsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      // Esperamos a que el contexto de autenticación termine de cargar
      return;
    }

    if (user) {
      const fetchProducts = async () => {
        try {
          const response = await fetch('/api/user-products');
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch user products');
          }
          const data = await response.json();
          setProducts(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    } else {
      // Si no hay usuario después de que el contexto ha cargado, mostramos el error.
      setLoading(false);
      setError("Debes iniciar sesión para ver tus productos.");
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <div className="text-center py-10">Cargando tus productos...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  const mySales = products.filter(p => p.user_id === user?.id);
  const myPurchases = products.filter(p => p.buyer_id === user?.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Mis Productos</h1>

      <div>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Mis Ventas</h2>
        {mySales.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {mySales.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p>Aún no has puesto ningún producto a la venta.</p>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Mis Compras</h2>
        {myPurchases.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {myPurchases.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p>Aún no has comprado ningún producto.</p>
        )}
      </div>
    </div>
  );
};

export default MyProductsPage;
