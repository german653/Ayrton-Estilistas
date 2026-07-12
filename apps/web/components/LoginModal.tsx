'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { unifiedLogin, publicApi } from '@/lib/publicApi';

export default function LoginModal({ onClose, onCustomerLogin }: { onClose: () => void; onCustomerLogin: () => void }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await unifiedLogin(email, password);
      if (result.kind === 'staff') {
        router.push('/dashboard');
      } else {
        onCustomerLogin();
        onClose();
      }
    } catch {
      setError('Usuario o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { accessToken } = await publicApi.register({ fullName, phone, email: email || undefined, password });
      localStorage.setItem('customerAccessToken', accessToken);
      onCustomerLogin();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-4 py-10 overflow-y-auto animate-fadein"
      style={{ backgroundColor: 'rgba(11,11,10,0.8)' }}
      onClick={onClose}
    >
      <div
        className="rounded-3xl max-w-sm w-full p-8 shadow-2xl my-auto animate-scalein"
        style={{ backgroundColor: '#F7F5F1' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl tracking-wide">{mode === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="text-charcoal text-xl leading-none">✕</button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={submitLogin} className="space-y-3">
            <input
              type="text"
              required
              placeholder="Tu email o teléfono"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-charcoal/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brass transition"
            />
            <input
              type="password"
              required
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-charcoal/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brass transition"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-ink text-paper font-medium py-3 rounded-xl disabled:opacity-50 hover:bg-brass hover:text-ink transition shadow-md">
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
            <p className="text-sm text-center text-charcoal/60">
              ¿Todavía no tenés cuenta?{' '}
              <button type="button" onClick={() => setMode('register')} className="text-ink font-semibold underline">
                Creá una
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={submitRegister} className="space-y-3">
            <input
              type="text"
              required
              placeholder="Tu nombre"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-charcoal/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brass transition"
            />
            <input
              type="text"
              required
              placeholder="Tu WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-charcoal/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brass transition"
            />
            <input
              type="email"
              placeholder="Email (opcional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-charcoal/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brass transition"
            />
            <input
              type="password"
              required
              placeholder="Elegí una contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-charcoal/20 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brass transition"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-ink text-paper font-medium py-3 rounded-xl disabled:opacity-50 hover:bg-brass hover:text-ink transition shadow-md">
              {loading ? 'Creando cuenta…' : 'Crear mi cuenta'}
            </button>
            <p className="text-sm text-center text-charcoal/60">
              ¿Ya tenés cuenta?{' '}
              <button type="button" onClick={() => setMode('login')} className="text-ink font-semibold underline">
                Iniciá sesión
              </button>
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
