'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

// Define the structure of a Product and a Seller's Profile
interface Product {
  id: string;
  name: string;
  price: number;
  type: 'sale' | 'auction';
  seller: string;
  location: string;
  time: string;
  image: string;
  description: string;
  user_id: string;
  current_bid?: number;
  bid_count?: number;
}

interface SellerProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export default function AdDetail() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { user, loading: authLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductAndSeller = useCallback(async () => {
    if (!id) {
      setError("No se ha especificado un ID de anuncio.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: productData, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !productData) {
      console.error('Error fetching product:', fetchError);
      setError('No se pudo encontrar el anuncio.');
      setLoading(false);
      return;
    }
    
    setProduct(productData as Product);

    const { data: sellerData, error: sellerError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', productData.user_id)
      .single();

    if (sellerError) {
      console.error("Error fetching seller's profile:", sellerError);
    } else {
      setSeller(sellerData);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProductAndSeller();
  }, [fetchProductAndSeller]);

  const handleDelete = async () => {
    if (!product || !user || product.user_id !== user.id) {
      alert('No tienes permiso para eliminar este anuncio.');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar este anuncio?')) {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Anuncio eliminado exitosamente.');
        router.push('/');
      } else {
        const errorData = await response.json();
        alert(`Error al eliminar el anuncio: ${errorData.error || response.statusText}`);
      }
    }
  };

  if (loading || authLoading) {
    return <div className="text-center py-10">Cargando anuncio...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-600">{error}</div>;
  }

  if (!product) {
    return <div className="text-center py-10">Anuncio no encontrado.</div>;
  }

  const isOwner = user && product.user_id === user.id;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row gap-8 md:gap-12">
        {/* Left Column: Image Gallery */}
        <div className="md:w-1/2 lg:w-3/5">
          <div className="w-full h-[500px] relative overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
            <Image 
              src={product.image} 
              alt={`Imagen de ${product.name}`} 
              layout="fill"
              objectFit="contain"
              className="hover:opacity-90 transition-opacity"
            />
          </div>
        </div>

        {/* Right Column: Info and Actions */}
        <div className="md:w-1/2 lg:w-2/5">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.name}</h1>
          <p className="text-3xl text-gray-700 mt-2">{product.price} €</p>
          <p className="text-sm text-gray-500 mt-1">{product.type === 'auction' ? 'Puja actual' : 'Precio'}</p>

          {/* Seller Card */}
          {seller && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-600">Vendido por</h3>
              <Link href={`/user-profile/${seller.id}`} className="flex items-center gap-4 mt-2 p-4 border rounded-lg hover:bg-gray-50">
                <div className="relative h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                  {seller.avatar_url ? (
                    <Image src={seller.avatar_url} alt={`Avatar de ${seller.username}`} layout="fill" objectFit="cover" />
                  ) : (
                    <span className="absolute text-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">👤</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{seller.username}</p>
                  <p className="text-sm text-blue-600">Ver perfil</p>
                </div>
              </Link>
            </div>
          )}

          {isOwner && (
            <div className="mt-8 flex gap-4">
              <Link href={`/edit-ad/${product.id}`} className="flex-1 text-center bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors">
                Editar Anuncio
              </Link>
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors">
                Eliminar Anuncio
              </button>
            </div>
          )}

          {/* Description */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800">Descripción</h3>
            <p className="mt-2 text-gray-600 whitespace-pre-wrap">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Q&A Section */}
      <section className="q-and-a mt-12 border-t pt-8">
        <h2 className="text-2xl font-bold mb-6">Preguntas y Respuestas</h2>
        <div className="q-list space-y-6">
          {/* Example Q&A Item */}
          <div className="q-item">
            <p className="question font-semibold"><b>P:</b> ¿Sigue disponible?</p>
            <p className="answer mt-1"><b>R:</b> Sí, mientras el anuncio esté activo, sigue disponible.</p>
          </div>
          <div className="q-item">
            <p className="question font-semibold"><b>P:</b> ¿Haces envíos?</p>
            <p className="answer mt-1"><b>R:</b> Sí, los gastos de envío corren a cargo del comprador.</p>
          </div>
        </div>
        <div className="q-form mt-8">
          <h3 className="text-xl font-semibold mb-3">Haz una pregunta</h3>
          <form>
            <textarea 
              placeholder="Escribe tu pregunta..." 
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            ></textarea>
            <button 
              type="submit" 
              className="mt-4 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Enviar Pregunta
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
