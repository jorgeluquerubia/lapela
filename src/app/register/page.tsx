'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/context/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && session) {
      router.push('/');
    }
  }, [session, authLoading, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      setMessage('¡Registro exitoso! Por favor, revisa tu correo para confirmar tu cuenta.');
    }
    setLoading(false);
  };

  if (authLoading || session) {
    return <p>Cargando...</p>;
  }

  return (
    <section className="register-form-container">
      <h1>Crear una cuenta</h1>
      
      {/* Social login buttons can be implemented here */}
      {/* <div className="social-login"> ... </div> */}
      {/* <div className="divider"><span>o</span></div> */}

      <form className="register-form" onSubmit={handleSignUp}>
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

        <label htmlFor="confirm-password">Confirmar Contraseña</label>
        <input
          type="password"
          id="confirm-password"
          name="confirm-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={loading}
        />

        {error && <p className="text-red-600 text-center">{error}</p>}
        {message && <p className="text-green-600 text-center">{message}</p>}

        <button type="submit" className="button primary" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
        <p className="login-link">
          ¿Ya tienes cuenta? <Link href="/login">Inicia sesión aquí</Link>
        </p>
      </form>
    </section>
  );
}
