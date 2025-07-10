'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && session) {
      router.push('/');
    }
  }, [session, authLoading, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  if (authLoading || session) {
    return <p>Cargando...</p>;
  }

  return (
    <section className="login-form-container">
      <h1>Iniciar Sesión</h1>
      <form className="login-form" onSubmit={handleSignIn}>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <label htmlFor="password">Contraseña</label>
        <input
          type="password"
          id="password"
          name="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {error && <p className="text-red-600 text-center">{error}</p>}

        <button type="submit" className="button primary" disabled={loading}>
          {loading ? 'Iniciando...' : 'Entrar'}
        </button>
        <p className="signup-link">
          ¿No tienes cuenta? <Link href="/register">Regístrate aquí</Link>
        </p>
      </form>
    </section>
  );
}
