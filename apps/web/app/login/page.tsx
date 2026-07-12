'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { accessToken } = await api.post<{ accessToken: string }>('/auth/login', { email, password });
      setToken(accessToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="bg-paper p-8 rounded-3xl shadow-2xl">
          <h1 className="font-display text-3xl tracking-wide mb-1">PANEL ADMIN</h1>
          <p className="text-charcoal/60 text-sm mb-6">Ingresá con tu cuenta de negocio</p>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-charcoal/20 rounded-xl px-3 py-2.5 mb-4 outline-none focus:ring-2 focus:ring-brass transition"
          />

          <label className="block text-sm font-medium mb-1">Contraseña</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-charcoal/20 rounded-xl px-3 py-2.5 mb-6 outline-none focus:ring-2 focus:ring-brass transition"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-paper font-semibold py-3 rounded-xl disabled:opacity-50 hover:bg-brass hover:text-ink transition shadow-lg"
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <Link href="/" className="block text-center text-paper/70 hover:text-paper text-sm mt-6 transition">
          ← Volver al sitio
        </Link>
      </div>
    </main>
  );
}
