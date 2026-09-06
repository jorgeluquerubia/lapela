'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase';

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (active) {
        setReady(Boolean(data.session));
        setChecking(false);
      }
    };
    checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) {
        setReady(true);
        setChecking(false);
      }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage('Contraseña actualizada. Ya puedes iniciar sesión con ella.');
      await supabase.auth.signOut();
      setReady(false);
    }
    setSaving(false);
  };

  if (checking) return <p>Cargando…</p>;

  return <section className="login-form-container">
    <h1>Crear contraseña nueva</h1>
    {ready ? <form className="login-form" onSubmit={handleSubmit}>
      <p className="muted">Elige una contraseña segura para tu cuenta de La Pela.</p>
      <label htmlFor="new-password">Nueva contraseña</label>
      <input id="new-password" type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} disabled={saving} autoFocus />
      <label htmlFor="confirm-new-password">Repite la contraseña</label>
      <input id="confirm-new-password" type="password" minLength={8} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={saving} />
      {error && <p className="text-red-600 text-center" role="alert">{error}</p>}
      <button className="button primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar contraseña'}</button>
    </form> : <div>
      {message ? <p className="text-green-600 text-center" role="status">{message}</p> : <p className="muted">Este enlace ha caducado o ya se ha utilizado. Solicita otro desde el acceso.</p>}
      <Link className="button primary w-full" href="/login">Ir a iniciar sesión</Link>
    </div>}
  </section>;
}
