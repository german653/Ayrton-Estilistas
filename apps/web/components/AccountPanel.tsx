'use client';

import { useEffect, useState } from 'react';
import { publicApi, clearCustomerToken } from '@/lib/publicApi';

interface Me {
  fullName: string;
  totalVisits: number;
  loyalty: { tier: string; discountPercent: number; nextTier: { tier: string; visitsNeeded: number } | null };
}

export default function AccountPanel({ onLogout }: { onLogout: () => void }) {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    publicApi.me().then(setMe).catch(() => setError(true));
  }, []);

  const logout = () => {
    clearCustomerToken();
    onLogout();
  };

  if (error) return null;
  if (!me) return <div className="bg-paper rounded-3xl p-8 text-center text-charcoal/50">Cargando tu cuenta…</div>;

  return (
    <div className="bg-paper rounded-3xl border border-charcoal/10 p-8 max-w-md mx-auto text-center shadow-xl">
      <p className="text-xs uppercase tracking-[0.25em] text-brass mb-2">Tu cuenta</p>
      <h2 className="font-display text-3xl tracking-wide mb-6">HOLA, {me.fullName?.split(' ')[0]?.toUpperCase() ?? 'CLIENTE'}</h2>

      <div className="flex justify-center gap-10 mb-6">
        <div>
          <p className="font-display text-4xl text-ink">{me.totalVisits}</p>
          <p className="text-xs uppercase tracking-widest text-charcoal/50 mt-1">Cortes hechos</p>
        </div>
        <div>
          <p className="font-display text-4xl text-brass">{me.loyalty.discountPercent}%</p>
          <p className="text-xs uppercase tracking-widest text-charcoal/50 mt-1">Nivel {me.loyalty.tier}</p>
        </div>
      </div>

      {me.loyalty.nextTier && (
        <p className="text-sm text-charcoal/70 mb-6">
          Te faltan <strong>{me.loyalty.nextTier.visitsNeeded}</strong> corte{me.loyalty.nextTier.visitsNeeded === 1 ? '' : 's'} más
          para llegar a nivel <strong>{me.loyalty.nextTier.tier}</strong>.
        </p>
      )}

      <button onClick={logout} className="text-sm text-charcoal/50 underline">
        Cerrar sesión
      </button>
    </div>
  );
}
