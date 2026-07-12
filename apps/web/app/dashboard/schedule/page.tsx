'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Range = [string, string];
type WeeklyHours = Record<string, Range[]>;

const DAYS: { key: string; label: string }[] = [
  { key: 'mon', label: 'Lunes' },
  { key: 'tue', label: 'Martes' },
  { key: 'wed', label: 'Miércoles' },
  { key: 'thu', label: 'Jueves' },
  { key: 'fri', label: 'Viernes' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

function emptyWeek(): WeeklyHours {
  return DAYS.reduce((acc, d) => ({ ...acc, [d.key]: [] }), {} as WeeklyHours);
}

function HoursEditor({
  hours,
  onChange,
}: {
  hours: WeeklyHours;
  onChange: (h: WeeklyHours) => void;
}) {
  const addRange = (day: string) => {
    const ranges = hours[day] ?? [];
    onChange({ ...hours, [day]: [...ranges, ['09:00', '13:00']] });
  };

  const updateRange = (day: string, idx: number, pos: 0 | 1, value: string) => {
    const ranges = [...(hours[day] ?? [])];
    ranges[idx] = pos === 0 ? [value, ranges[idx][1]] : [ranges[idx][0], value];
    onChange({ ...hours, [day]: ranges });
  };

  const removeRange = (day: string, idx: number) => {
    const ranges = (hours[day] ?? []).filter((_, i) => i !== idx);
    onChange({ ...hours, [day]: ranges });
  };

  return (
    <div className="space-y-3">
      {DAYS.map((d) => {
        const ranges = hours[d.key] ?? [];
        return (
          <div key={d.key} className="flex items-start gap-4 py-2 border-b last:border-b-0">
            <span className="w-24 pt-2 text-sm font-medium">{d.label}</span>
            <div className="flex-1 space-y-2">
              {ranges.length === 0 && <span className="text-sm text-charcoal/40">Cerrado</span>}
              {ranges.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={r[0]}
                    onChange={(e) => updateRange(d.key, idx, 0, e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <span className="text-charcoal/40">a</span>
                  <input
                    type="time"
                    value={r[1]}
                    onChange={(e) => updateRange(d.key, idx, 1, e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <button onClick={() => removeRange(d.key, idx)} className="text-red-500 text-sm hover:underline">
                    Quitar
                  </button>
                </div>
              ))}
              <button onClick={() => addRange(d.key)} className="text-brand text-sm hover:underline">
                + Agregar horario
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SchedulePage() {
  const [businessHours, setBusinessHours] = useState<WeeklyHours>(emptyWeek());
  const [employees, setEmployees] = useState<{ id: string; fullName: string; workingHours: WeeklyHours | null }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [employeeHours, setEmployeeHours] = useState<WeeklyHours>(emptyWeek());
  const [useCustomHours, setUseCustomHours] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ businessHours: WeeklyHours | null }>('/tenants/me/profile').then((p) => {
      if (p.businessHours) setBusinessHours(p.businessHours);
    });
    api.get<{ id: string; fullName: string; workingHours: WeeklyHours | null }[]>('/employees').then(setEmployees);
  }, []);

  const selectEmployee = (id: string) => {
    setSelectedEmployee(id);
    const emp = employees.find((e) => e.id === id);
    setUseCustomHours(!!emp?.workingHours);
    setEmployeeHours(emp?.workingHours ?? emptyWeek());
  };

  const saveBusinessHours = async () => {
    setSaving(true);
    try {
      await api.patch('/tenants/me/profile', { businessHours });
      setSavedMsg('Horario general del negocio guardado.');
    } finally {
      setSaving(false);
    }
  };

  const saveEmployeeHours = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    try {
      await api.patch(`/employees/${selectedEmployee}`, {
        workingHours: useCustomHours ? employeeHours : null,
      });
      setSavedMsg('Horario del empleado guardado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Horarios</h1>
      <p className="text-charcoal/60 text-sm mb-6">
        Estos horarios son los que usa el agente para ofrecer turnos disponibles — no hace falta tocar
        nada técnico, se guarda al instante.
      </p>

      {savedMsg && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4">{savedMsg}</p>}

      <section className="bg-white rounded-xl border shadow-sm p-6 mb-8">
        <h2 className="font-semibold mb-4">Horario general del negocio</h2>
        <HoursEditor hours={businessHours} onChange={setBusinessHours} />
        <button
          onClick={saveBusinessHours}
          disabled={saving}
          className="mt-4 bg-brand text-white font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar horario general'}
        </button>
      </section>

      <section className="bg-white rounded-xl border shadow-sm p-6">
        <h2 className="font-semibold mb-4">Horario específico por empleado (opcional)</h2>
        <select
          value={selectedEmployee}
          onChange={(e) => selectEmployee(e.target.value)}
          className="border rounded-lg px-3 py-2 mb-4"
        >
          <option value="">Elegí un empleado…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.fullName}</option>
          ))}
        </select>

        {selectedEmployee && (
          <>
            <label className="flex items-center gap-2 mb-4">
              <input type="checkbox" checked={useCustomHours} onChange={(e) => setUseCustomHours(e.target.checked)} />
              <span className="text-sm">Este empleado tiene un horario distinto al general</span>
            </label>
            {useCustomHours && <HoursEditor hours={employeeHours} onChange={setEmployeeHours} />}
            <button
              onClick={saveEmployeeHours}
              disabled={saving}
              className="mt-4 bg-brand text-white font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar horario del empleado'}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
