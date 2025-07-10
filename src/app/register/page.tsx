'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';
import Header from '@/components/Header';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
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
      // Optionally redirect after a short delay
      // setTimeout(() => router.push('/login'), 3000);
    }
  };

  return (
    <>
      <Header />

      <main className="container">
        <section className="register-form-container">
          <h1>Crear una cuenta</h1>
          <div className="social-login">
            <button className="button social-button facebook">Registrarse con Facebook</button>
            <button className="button social-button google">Registrarse con Google</button>
          </div>

          <div className="divider"><span>o</span></div>

          <form className="register-form" onSubmit={handleSignUp}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label htmlFor="confirm-password">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirm-password"
              name="confirm-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {message && <p style={{ color: 'green' }}>{message}</p>}

            <button type="submit" className="button primary">Registrarse</button>
            <p className="login-link">¿Ya tienes cuenta? <Link href="/login">Inicia sesión aquí</Link></p>
          </form>
        </section>
      </main>

      <footer>
        <p>&copy; 2025 LaPela. Todos los derechos reservados.</p>
      </footer>
    </>
  );
}
