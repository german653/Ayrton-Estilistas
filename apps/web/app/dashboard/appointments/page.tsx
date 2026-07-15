'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Appointment {
  id: string;
  startsAt: string;
  status: string;
  customer: { fullName?: string; phone?: string };
  employee: { fullName: string };
  service: { name: string };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    const from = new Date();
    const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    api
      .get<Appointment[]>(`/appointments/upcoming?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then(setAppointments)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const cancel = async (id: string) => {
    await api.patch(`/appointments/${id}/cancel`);
    load();
  };

  const complete = async (id: string) => {
    await api.patch(`/appointments/${id}/complete`);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Turnos (próximos 14 días)</h1>
      {loading ? (
        <p>Cargando…</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-charcoal/5 text-left">
              <tr>
                <th className="p-3">Fecha y hora</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Servicio</th>
                <th className="p-3">Empleado</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{new Date(a.startsAt).toLocaleString('es-AR')}</td>
                  <td className="p-3">{a.customer.fullName ?? a.customer.phone ?? '—'}</td>
                  <td className="p-3">{a.service.name}</td>
                  <td className="p-3">{a.employee.fullName}</td>
                  <td className="p-3">{a.status}</td>
                  <td className="p-3 space-x-2">
                    <button onClick={() => complete(a.id)} className="text-green-600 hover:underline">
                      Completar
                    </button>
                    <button onClick={() => cancel(a.id)} className="text-red-600 hover:underline">
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-charcoal/40">
                    No hay turnos en este rango.
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
