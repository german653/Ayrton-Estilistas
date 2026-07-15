'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Customer {
  id: string;
  fullName?: string;
  phone?: string;
  totalVisits: number;
  lastVisitAt?: string;
  tags: string[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      api
        .get<Customer[]>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`)
        .then(setCustomers)
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>
      <input
        placeholder="Buscar por nombre o teléfono…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded-lg px-3 py-2 mb-4 w-full max-w-sm outline-none focus:ring-2 focus:ring-brand"
      />
      {loading ? (
        <p>Cargando…</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-charcoal/5 text-left">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Visitas totales</th>
                <th className="p-3">Última visita</th>
                <th className="p-3">Tags</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">{c.fullName ?? '—'}</td>
                  <td className="p-3">{c.phone ?? '—'}</td>
                  <td className="p-3">{c.totalVisits}</td>
                  <td className="p-3">{c.lastVisitAt ? new Date(c.lastVisitAt).toLocaleDateString('es-AR') : '—'}</td>
                  <td className="p-3">{c.tags.join(', ')}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-charcoal/40">
                    Sin resultados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
