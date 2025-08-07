'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { User } from '@supabase/supabase-js';
import Image from 'next/image'; // Using Next.js Image component for optimization

export default function PublishAd() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [productType, setProductType] = useState('sale');
  const [location, setLocation] = useState('');
  const [auctionEndsAt, setAuctionEndsAt] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Set default auction end date to 7 days from now
  useEffect(() => {
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 7);
    // Format for datetime-local input (YYYY-MM-DDTHH:mm)
    const year = defaultEndDate.getFullYear();
    const month = (defaultEndDate.getMonth() + 1).toString().padStart(2, '0');
    const day = defaultEndDate.getDate().toString().padStart(2, '0');
    const hours = defaultEndDate.getHours().toString().padStart(2, '0');
    const minutes = defaultEndDate.getMinutes().toString().padStart(2, '0');
    setAuctionEndsAt(`${year}-${month}-${day}T${hours}:${minutes}`);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !imageFile) {
      setError('Debes iniciar sesión y seleccionar una imagen para publicar.');
      return;
    }
    setSubmitting(true);
    setError(null);

    // 1. Upload image to Supabase Storage
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile);

    if (uploadError) {
      setError('Error al subir la imagen: ' + uploadError.message);
      setSubmitting(false);
      return;
    }

    // 2. Get public URL of the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    if (!publicUrl) {
        setError('No se pudo obtener la URL pública de la imagen.');
        setSubmitting(false);
        return;
    }

    // 3. Get seller's username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.username) {
      setError('No se pudo encontrar tu perfil. Asegúrate de tener un nombre de usuario.');
      setSubmitting(false);
      return;
    }

    // 4. Generate slug
    const generateSlug = (title: string) => {
      const randomString = Math.random().toString(36).substring(2, 8);
      return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // remove special chars
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .trim() + '-' + randomString;
    };

    // 5. Insert product data into the database
    const productData: any = {
      user_id: user.id,
      name,
      description,
      price: parseFloat(price),
      location,
      image: publicUrl,
      seller: profile.username,
      type: productType,
      time: new Date().toISOString(), // Use ISO string for consistency
      detailImage: publicUrl,
      slug: generateSlug(name),
    };

    if (productType === 'auction') {
      productData.auction_ends_at = new Date(auctionEndsAt).toISOString();
    }

    const { data: newProduct, error: insertError } = await supabase
      .from('products')
      .insert([productData])
      .select('slug')
      .single();

    if (insertError) {
      setError('Error al publicar el anuncio: ' + insertError.message);
    } else if (newProduct) {
      router.push(`/ad-detail/${newProduct.slug}`);
    } else {
      setError('No se pudo obtener el ID del nuevo anuncio. Redirigiendo al perfil.');
      router.push('/user-profile');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <p>Cargando...</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Publicar un nuevo anuncio</h1>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Form fields for name, description, etc. remain the same */}
          <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Título del anuncio</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Venta</label>
              <div className="mt-2 flex space-x-4">
                <label className="flex items-center">
                  <input type="radio" name="productType" value="sale" checked={productType === 'sale'} onChange={() => setProductType('sale')} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                  <span className="ml-2 text-sm text-gray-700">Precio Fijo</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="productType" value="auction" checked={productType === 'auction'} onChange={() => setProductType('auction')} className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300" />
                  <span className="ml-2 text-sm text-gray-700">Subasta</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">{productType === 'sale' ? 'Precio (€)' : 'Puja Inicial (€)'}</label>
                <input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">Ubicación</label>
                <input id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>

            {productType === 'auction' && (
              <div>
                <label htmlFor="auction-ends-at" className="block text-sm font-medium text-gray-700">Finalización de la subasta</label>
                <input 
                  id="auction-ends-at" 
                  type="datetime-local" 
                  value={auctionEndsAt} 
                  onChange={(e) => setAuctionEndsAt(e.target.value)} 
                  required 
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Imagen del Producto</label>
              <div className="mt-2 flex items-center justify-center w-full">
                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Vista previa" width={256} height={256} className="object-contain h-full" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                      <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 800x400px)</p>
                    </div>
                  )}
                  <input id="image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/png, image/jpeg, image/gif" />
                </label>
              </div> 
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50" disabled={submitting || !imageFile}>
                {submitting ? 'Publicando...' : 'Publicar Anuncio'}
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}
