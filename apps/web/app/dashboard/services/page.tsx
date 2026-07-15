'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  isActive: boolean;
}

interface FormState {
  name: string;
  durationMin: number;
  pricePesos: number;
}

const emptyForm: FormState = { name: '', durationMin: 30, pricePesos: 0 };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [newForm, setNewForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

  const load = () => api.get<Service[]>('/services').then(setServices);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newForm.name.trim()) return;
    await api.post('/services', {
      name: newForm.name,
      durationMin: newForm.durationMin,
      priceCents: Math.round(newForm.pricePesos * 100),
    });
    setNewForm(emptyForm);
    load();
  };

  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setEditForm({ name: s.name, durationMin: s.durationMin, pricePesos: s.priceCents / 100 });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await api.patch(`/services/${editingId}`, {
      name: editForm.name,
      durationMin: editForm.durationMin,
      priceCents: Math.round(editForm.pricePesos * 100),
    });
    setEditingId(null);
    load();
  };

  const toggleActive = async (s: Service) => {
    await api.patch(`/services/${s.id}`, { isActive: !s.isActive });
    load();
  };

  const remove = async (s: Service) => {
    if (!confirm(`¿Eliminar "${s.name}" definitivamente? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/services/${s.id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el servicio.');
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Servicios</h1>

      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Duración (min)</label>
          <input type="number" value={newForm.durationMin} onChange={(e) => setNewForm({ ...newForm, durationMin: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Precio (en pesos)</label>
          <input type="number" value={newForm.pricePesos} onChange={(e) => setNewForm({ ...newForm, pricePesos: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <button onClick={create} className="col-span-3 bg-brand text-white font-semibold px-5 py-2 rounded-lg hover:bg-brass hover:text-ink transition shadow-sm">
          Agregar servicio
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm divide-y">
        {services.map((s) => (
          <div key={s.id} className="p-4">
            {editingId === s.id ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
                <input type="number" value={editForm.durationMin} onChange={(e) => setEditForm({ ...editForm, durationMin: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" placeholder="Duración (min)" />
                <input type="number" value={editForm.pricePesos} onChange={(e) => setEditForm({ ...editForm, pricePesos: Number(e.target.value) })} className="w-full border rounded-lg px-3 py-2" placeholder="Precio (pesos)" />
                <div className="col-span-3 flex gap-3">
                  <button onClick={saveEdit} className="bg-brand text-white text-sm font-semibold px-4 py-1.5 rounded-lg">Guardar</button>
                  <button onClick={() => setEditingId(null)} className="text-sm text-charcoal/50">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-charcoal/60">{s.durationMin} min · ${(s.priceCents / 100).toLocaleString('es-AR')}</p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => startEdit(s)} className="text-brand text-sm hover:underline">Editar</button>
                  <button onClick={() => toggleActive(s)} className="text-sm hover:underline">
                    {s.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => remove(s)} className="text-red-600 text-sm hover:underline">Eliminar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
