'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import Header from '@/components/Header';
import Image from 'next/image';

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
}

interface Product {
  id: string;
  name: string;
  price: string;
  type: string;
  image: string;
  location: string;
  time: string;
}

export default function PublicUserProfile() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // Get the user ID from the URL

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfileAndProducts = useCallback(async () => {
    if (!id) {
      setError("No se ha especificado un ID de usuario.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 1. Fetch the user's profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`id, username, avatar_url, email`)
      .eq('id', id)
      .single();

    if (profileError || !profileData) {
      console.error('Error fetching profile:', profileError);
      setError('No se pudo encontrar el perfil de usuario.');
      setLoading(false);
      return;
    }
    setProfile(profileData as Profile);

    // 2. Fetch the user's products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, type, image, location, time')
      .eq('user_id', id);

    if (productsError) {
      console.error('Error fetching user products:', productsError);
      // Don't set a critical error, just show no products
    } else {
      setUserProducts(productsData as Product[]);
    }

    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchUserProfileAndProducts();
  }, [fetchUserProfileAndProducts]);

  if (loading) {
    return <p className="text-center py-10">Cargando perfil...</p>;
  }

  if (error) {
    return <p className="text-center py-10 text-red-600">{error}</p>;
  }

  if (!profile) {
    return <p className="text-center py-10">Perfil no encontrado.</p>;
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <section className="user-profile bg-white p-8 rounded-lg shadow-md">
          <div className="profile-header flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="avatar w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="Avatar" width={96} height={96} className="object-cover" />
              ) : (
                <span className="text-4xl text-gray-500">👤</span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{profile.username || 'Usuario sin nombre'}</h2>
              <p className="text-gray-600">{profile.email || 'Email no disponible'}</p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-4">Anuncios de {profile.username || 'este usuario'}</h3>
          <div className="product-grid">
            <div className="grid-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userProducts.length > 0 ? (
                userProducts.map((product) => (
                  <div className="product-card bg-white rounded-lg shadow-md overflow-hidden" key={product.id}>
                    <Link href={`/ad-detail/${product.id}`}>
                      <div className="product-image w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                        <Image src={product.image} alt={product.name} width={200} height={150} className="object-cover" />
                      </div>
                      <div className="product-info p-4">
                        <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                        <p className={product.type === 'auction' ? 'text-red-600 font-bold mt-1' : 'text-green-600 font-bold mt-1'}>
                          {product.type === 'auction' ? `Puja actual: ${product.price} €` : `${product.price} €`}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{product.location} &bull; {product.time}</p>
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">Este usuario no ha publicado ningún anuncio todavía.</p>
              )}
            </div>
          </div>
        </section>
      </main>
      <footer className="text-center py-6 mt-10 border-t border-gray-200">
        <p>&copy; 2025 LaPela. Todos los derechos reservados.</p>
      </footer>
    </>
  );
}
