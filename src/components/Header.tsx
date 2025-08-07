'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

export default function Header() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex items-center justify-between gap-4">
        <div className="logo flex-shrink-0">
          <Link href="/" className="text-2xl font-bold text-gray-800">LaPela 🪙</Link>
        </div>
        
        <form onSubmit={handleSearchSubmit} className="flex-grow mx-4 max-w-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar en LaPela..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="absolute right-0 top-0 h-full px-4 text-gray-500 hover:text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>
        
        <nav className="flex items-center space-x-4 flex-shrink-0">
          <Link href="/publish-ad" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 whitespace-nowrap">
            Publicar Anuncio
          </Link>
          
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse"></div>
          ) : user ? (
            <div className="flex items-center space-x-3">
              <Link href="/user-profile" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors duration-200">
                {profile?.avatar_url ? (
                  <Image 
                    src={profile.avatar_url}
                    alt="Avatar de usuario"
                    width={32}
                    height={32}
                    className="rounded-full object-cover w-8 h-8"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-lg">
                    👤
                  </div>
                )}
                <span className="font-medium whitespace-nowrap hidden md:inline">{profile?.username || 'Mi Perfil'}</span>
              </Link>
              <button onClick={handleLogout} className="text-gray-600 hover:text-red-500 transition-colors duration-200 whitespace-nowrap">
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 whitespace-nowrap">
                Iniciar Sesión
              </Link>
              <Link href="/register" className="text-gray-700 hover:text-indigo-600 transition-colors duration-200 whitespace-nowrap">
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
