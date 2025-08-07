'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';

interface Product {
  id: string;
  name: string;
  price: string;
  type: string;
  image: string;
  location: string;
  time: string;
  status: 'available' | 'sold' | 'paid';
}

export default function UserProfile() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshUserProfile } = useAuth();
  
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  const fetchUserProducts = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user products:', error);
    } else {
      setUserProducts(data as Product[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserProducts(user.id);
    }
  }, [user, fetchUserProducts]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMarkAsPaid = async (productId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No autenticado');

      const response = await fetch(`/api/products/${productId}/mark-as-paid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'No se pudo actualizar el estado.');
      }

      // Refresh the product list to show the new status
      fetchUserProducts(user.id);
      setMessage('Producto marcado como pagado.');

    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage('');

    let newAvatarUrl = profile?.avatar_url;

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        setMessage('Error al subir el avatar: ' + uploadError.message);
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      newAvatarUrl = publicUrl;
    }

    const { error } = await supabase.from('profiles').update({
      username: username,
      avatar_url: newAvatarUrl,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);

    if (error) {
      setMessage('Error al actualizar el perfil: ' + error.message);
    } else {
      setMessage('¡Perfil actualizado con éxito!');
      if (refreshUserProfile) {
        await refreshUserProfile();
      }
    }
    setLoading(false);
  }

  if (authLoading || loading) {
    return <p>Cargando perfil...</p>;
  }

  if (!profile) {
    return <p>No se pudo cargar el perfil. Por favor, intenta de nuevo.</p>;
  }

  return (
    <section className="user-profile">
      <div className="profile-header">
        <div className="avatar">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <span>👤</span>
          )}
        </div>
        <div>
          <h2>{profile.username || 'Usuario sin nombre'}</h2>
          <p className="user-email">{user?.email}</p>
        </div>
      </div>

      <div className="profile-update-form">
        <h3>Actualizar mi perfil</h3>
        <form onSubmit={handleUpdateProfile}>
          <div>
            <label htmlFor="username">Nombre de usuario</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Elige un nombre de usuario"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="mt-4">
            <label htmlFor="avatar-upload" className="block text-sm font-medium text-gray-700">Cambiar Avatar</label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <button type="submit" className="button mt-6" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
        {message && <p className="form-message text-sm mt-2">{message}</p>}
      </div>

      <h3>Mis Anuncios</h3>
      <div className="product-grid">
        <div className="grid-container">
          {userProducts.length > 0 ? (
            userProducts.map((product) => (
              <div className="product-card" key={product.id}>
                <Link href={`/ad-detail/${product.id}`}>
                  <div className="product-image" style={{ backgroundImage: `url('${product.image}')` }}>
                    {product.status !== 'available' && (
                      <span className={`status-badge status-${product.status}`}>
                        {product.status === 'sold' ? 'Vendido' : 'Pagado'}
                      </span>
                    )}
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className={product.type === 'auction' ? 'price auction-price' : 'price'}>
                      {product.type === 'auction' ? `Puja actual: ${product.price} €` : `${product.price} €`}
                    </p>
                    <p className="meta">{product.location} &bull; {product.time}</p>
                  </div>
                </Link>
                {product.status === 'sold' && (
                  <div className="product-actions p-4">
                    <button 
                      onClick={() => handleMarkAsPaid(product.id)}
                      className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                      disabled={loading}
                    >
                      Marcar como Pagado
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No has publicado ningún anuncio todavía.</p>
          )}
        </div>
      </div>
    </section>
  );
}
