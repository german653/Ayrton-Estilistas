'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Promotion {
  id: string;
  title: string;
  message: string;
  sentAt?: string;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState({ title: '', message: '' });
  const [sendingId, setSendingId] = useState<string | null>(null);

  const load = () => api.get<Promotion[]>('/promotions').then(setPromotions);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    await api.post('/promotions', form);
    setForm({ title: '', message: '' });
    load();
  };

  const send = async (id: string) => {
    setSendingId(id);
    try {
      const result = await api.post<{ sent: number; total: number }>(`/promotions/${id}/send`);
      alert(`Enviado a ${result.sent} de ${result.total} clientes.`);
      load();
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Promociones</h1>

      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6 space-y-3">
        <input
          placeholder="Título de la campaña"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border rounded-lg px-3 py-2"
        />
        <textarea
          placeholder="Mensaje que van a recibir los clientes por WhatsApp"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={3}
          className="w-full border rounded-lg px-3 py-2"
        />
        <button onClick={create} className="bg-brand text-white font-semibold px-5 py-2 rounded-lg">
          Crear promoción
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm divide-y">
        {promotions.map((p) => (
          <div key={p.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="text-xs text-charcoal/60">{p.sentAt ? `Enviada el ${new Date(p.sentAt).toLocaleString('es-AR')}` : 'No enviada'}</p>
            </div>
            {!p.sentAt && (
              <button
                onClick={() => send(p.id)}
                disabled={sendingId === p.id}
                className="text-brand text-sm font-semibold hover:underline disabled:opacity-50"
              >
                {sendingId === p.id ? 'Enviando…' : 'Enviar ahora'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
