'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Service {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  fullName: string;
  isActive: boolean;
  services: { service: Service }[];
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState('');
  const [newServiceIds, setNewServiceIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingServiceIds, setEditingServiceIds] = useState<string[]>([]);

  const load = () => {
    api.get<Employee[]>('/employees').then(setEmployees);
    api.get<Service[]>('/services').then(setServices);
  };
  useEffect(() => { load(); }, []);

  const toggleNewService = (id: string) => {
    setNewServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const create = async () => {
    if (!name.trim()) return;
    await api.post('/employees', { fullName: name, serviceIds: newServiceIds });
    setName('');
    setNewServiceIds([]);
    load();
  };

  const toggleActive = async (e: Employee) => {
    await api.patch(`/employees/${e.id}`, { isActive: !e.isActive });
    load();
  };

  const remove = async (e: Employee) => {
    if (!confirm(`¿Eliminar a "${e.fullName}" definitivamente? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/employees/${e.id}`);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar el empleado.');
    }
  };

  const startEdit = (e: Employee) => {
    setEditingId(e.id);
    setEditingServiceIds(e.services.map((s) => s.service.id));
  };

  const toggleEditingService = (id: string) => {
    setEditingServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveServices = async () => {
    if (!editingId) return;
    await api.patch(`/employees/${editingId}`, { serviceIds: editingServiceIds });
    setEditingId(null);
    load();
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Empleados</h1>
      <p className="text-charcoal/60 text-sm mb-6">
        Importante: un empleado solo aparece con horarios disponibles para los servicios que tenga
        tildados acá abajo. Si no le tildás ninguno, el buscador de turnos nunca le va a mostrar huecos libres.
      </p>

      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6 space-y-3">
        <input
          placeholder="Nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        <div>
          <p className="text-sm font-medium mb-2">Servicios que realiza</p>
          <div className="flex flex-wrap gap-2">
            {services.map((s) => (
              <label key={s.id} className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer ${newServiceIds.includes(s.id) ? 'bg-brand text-white border-brand' : 'border-charcoal/20'}`}>
                <input type="checkbox" className="hidden" checked={newServiceIds.includes(s.id)} onChange={() => toggleNewService(s.id)} />
                {s.name}
              </label>
            ))}
            {services.length === 0 && <p className="text-sm text-charcoal/40">Primero cargá servicios en la sección "Servicios".</p>}
          </div>
        </div>
        <button onClick={create} className="bg-brand text-white font-semibold px-5 py-2 rounded-lg">
          Agregar empleado
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm divide-y">
        {employees.map((e) => (
          <div key={e.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">{e.fullName}</span>
                <p className="text-xs text-charcoal/50 mt-0.5">
                  {e.services.length > 0 ? e.services.map((s) => s.service.name).join(', ') : 'Sin servicios asignados ⚠️'}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => startEdit(e)} className="text-brand text-sm hover:underline">Servicios</button>
                <button onClick={() => toggleActive(e)} className="text-sm hover:underline">
                  {e.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => remove(e)} className="text-red-600 text-sm hover:underline">Eliminar</button>
              </div>
            </div>

            {editingId === e.id && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex flex-wrap gap-2 mb-3">
                  {services.map((s) => (
                    <label key={s.id} className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer ${editingServiceIds.includes(s.id) ? 'bg-brand text-white border-brand' : 'border-charcoal/20'}`}>
                      <input type="checkbox" className="hidden" checked={editingServiceIds.includes(s.id)} onChange={() => toggleEditingService(s.id)} />
                      {s.name}
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={saveServices} className="bg-brand text-white text-sm font-semibold px-4 py-1.5 rounded-lg">Guardar</button>
                  <button onClick={() => setEditingId(null)} className="text-sm text-charcoal/50">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
