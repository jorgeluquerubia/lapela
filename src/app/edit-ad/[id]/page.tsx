'use client';

import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import Header from '@/components/Header';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: string;
  type: 'sale' | 'auction';
  seller: string;
  location: string;
  time: string;
  image: string;
  description: string;
  user_id: string;
}

export default function EditAd() {
  const router = useRouter();
  const params = useParams();
  const { id } = params; // Get the ad ID from the URL

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [productType, setProductType] = useState('sale');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch user session and product data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      if (!id) {
        setError("No se ha especificado un ID de anuncio.");
        setLoading(false);
        return;
      }

      const { data: productData, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !productData) {
        console.error('Error fetching product:', fetchError);
        setError('No se pudo cargar el anuncio para editar.');
        setLoading(false);
        return;
      }

      // Check if the current user is the owner of the product
      if (productData.user_id !== currentUser.id) {
        alert('No tienes permiso para editar este anuncio.');
        router.push(`/ad-detail/${id}`); // Redirect to ad detail page
        return;
      }

      setProduct(productData as Product);
      setName(productData.name);
      setDescription(productData.description);
      setPrice(productData.price);
      setProductType(productData.type);
      setLocation(productData.location);
      setImagePreview(productData.image); // Set current image as preview
      setLoading(false);
    }
    fetchData();
  }, [id, router]);

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
    if (!user || !product) {
      setError('Error: Usuario o producto no cargado.');
      return;
    }
    setSubmitting(true);
    setError(null);

    let imageUrl = product.image; // Default to existing image URL

    // If a new image file is selected, upload it
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) {
        setError('Error al subir la nueva imagen: ' + uploadError.message);
        setSubmitting(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (!publicUrl) {
          setError('No se pudo obtener la URL pública de la nueva imagen.');
          setSubmitting(false);
          return;
      }
      imageUrl = publicUrl;
    }

    // Update product data via API route
    const response = await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        price,
        location,
        image: imageUrl,
        type: productType,
      }),
    });

    if (response.ok) {
      alert('Anuncio actualizado exitosamente.');
      router.push(`/ad-detail/${product.id}`); // Redirect to ad detail page
    } else {
      const errorData = await response.json();
      setError(`Error al actualizar el anuncio: ${errorData.error || response.statusText}`);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <p>Cargando...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center py-10">{error}</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar Anuncio</h1>
          <form className="space-y-6" onSubmit={handleSubmit}>
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
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50" disabled={submitting}>
                {submitting ? 'Actualizando...' : 'Actualizar Anuncio'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}