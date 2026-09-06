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
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
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
    setShowResend(false);
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
    });

    if (error) {
      const alreadyRegistered = /already registered|already exists|ya está registrado|ya existe/i.test(error.message);
      setError(alreadyRegistered
        ? 'Esta cuenta ya está registrada. Si no puedes entrar, inicia sesión o reenvía la verificación.'
        : error.message);
      setShowResend(alreadyRegistered);
    } else if (data.user) {
      const alreadyConfirmed = Boolean(data.user.email_confirmed_at || data.user.confirmed_at);
      setMessage(alreadyConfirmed
        ? 'Esta cuenta ya está confirmada. Puedes iniciar sesión directamente.'
        : '¡Registro exitoso! Revisa tu correo (también Spam o Promociones) para confirmar tu cuenta.');
      setShowResend(!alreadyConfirmed);
    }
    setLoading(false);
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

        {error && <p className="text-red-600 text-center" role="alert">{error}</p>}
        {message && <p className="text-green-600 text-center" role="status">{message}</p>}

        {showResend && <div className="auth-actions">
          <button type="button" className="button" onClick={handleResend} disabled={loading || resending || !email.trim()}>
            {resending ? 'Enviando…' : 'Reenviar correo de verificación'}
          </button>
          <Link href="/login" className="text-link">Ir a iniciar sesión</Link>
        </div>}

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
