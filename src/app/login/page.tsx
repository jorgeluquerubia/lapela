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
  const [showResend, setShowResend] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
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
    setMessage(null);
    setShowResend(false);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setShowResend(/email not confirmed|email no confirmado|confirm your email|confirma tu correo/i.test(error.message));
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    setResending(true);
    const resend = (supabase.auth as typeof supabase.auth & { resend?: typeof supabase.auth.resend }).resend;
    if (!resend) {
      setError('No se ha podido preparar el reenvío. Recarga la página e inténtalo de nuevo.');
      setResending(false);
      return;
    }
    const { error: resendError } = await resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
    });
    if (resendError) {
      setError(/rate limit|too many|frecuencia/i.test(resendError.message)
        ? 'Has solicitado varios correos seguidos. Espera unos minutos antes de volver a intentarlo.'
        : resendError.message);
    } else {
      setMessage('Te hemos enviado otro correo de verificación. Revisa también Spam o Promociones.');
    }
    setResending(false);
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

        {error && <p className="text-red-600 text-center" role="alert">{error}</p>}
        {message && <p className="text-green-600 text-center" role="status">{message}</p>}

        {showResend && <div className="auth-actions">
          <button type="button" className="button" onClick={handleResend} disabled={loading || resending || !email.trim()}>
            {resending ? 'Enviando…' : 'Reenviar correo de verificación'}
          </button>
          <Link href="/register" className="text-link">Volver al registro</Link>
        </div>}

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
