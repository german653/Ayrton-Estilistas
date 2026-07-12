'use client';

import { useEffect, useState } from 'react';
import { publicApi } from '@/lib/publicApi';

interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
}

interface AvailabilityResult {
  employeeId: string;
  employeeName: string;
  slots: string[];
}

function nextDays(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function BookingWidget() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [results, setResults] = useState<AvailabilityResult[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selected, setSelected] = useState<{ employeeId: string; employeeName: string; startsAt: string } | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    publicApi.getServices().then(setServices);
  }, []);

  const checkAvailability = async (svcId: string, d: string) => {
    setLoadingSlots(true);
    setResults(null);
    setSelected(null);
    try {
      const data = await publicApi.getAvailability(svcId, d);
      setResults(data);
    } finally {
      setLoadingSlots(false);
    }
  };

  const pickService = (id: string) => {
    setServiceId(id);
    setConfirmed(false);
    checkAvailability(id, date);
  };

  const pickDate = (d: string) => {
    setDate(d);
    setConfirmed(false);
    if (serviceId) checkAvailability(serviceId, d);
  };

  const confirm = async () => {
    if (!selected || !name.trim() || !phone.trim()) return;
    setConfirming(true);
    setError(null);
    try {
      await publicApi.book({
        serviceId,
        employeeId: selected.employeeId,
        startsAt: selected.startsAt,
        customerFullName: name.trim(),
        customerPhone: phone.trim(),
      });
      setConfirmed(true);
      setSelected(null);
      checkAvailability(serviceId, date); // refresca: el turno tomado ya no aparece más
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reservar. Probá con otro horario.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="bg-paper rounded-3xl border border-charcoal/10 p-6 md:p-10 max-w-3xl mx-auto shadow-xl">
      {/* Paso 1: servicio */}
      <p className="text-xs uppercase tracking-[0.25em] text-brass mb-3">Paso 1 — Elegí el servicio</p>
      <div className="flex flex-wrap gap-3 mb-8">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => pickService(s.id)}
            className={`px-5 py-3 rounded-full text-base border transition hover:shadow-md ${
              serviceId === s.id ? 'bg-ink text-paper border-ink' : 'border-charcoal/20 hover:border-ink'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Paso 2: fecha */}
      {serviceId && (
        <>
          <p className="text-xs uppercase tracking-[0.25em] text-brass mb-3">Paso 2 — Elegí el día</p>
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {nextDays(10).map((d) => {
              const iso = d.toISOString().slice(0, 10);
              const isSelected = iso === date;
              return (
                <button
                  key={iso}
                  onClick={() => pickDate(iso)}
                  className={`shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl border text-sm transition hover:shadow-md ${
                    isSelected ? 'bg-ink text-paper border-ink' : 'border-charcoal/20 hover:border-ink'
                  }`}
                >
                  <span className="uppercase text-xs">{d.toLocaleDateString('es-AR', { weekday: 'short' })}</span>
                  <span className="text-lg font-semibold">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Paso 3: horario */}
      {serviceId && (
        <>
          <p className="text-xs uppercase tracking-[0.25em] text-brass mb-3">Paso 3 — Elegí el horario</p>
          {loadingSlots && <p className="text-charcoal/50 text-sm">Buscando horarios…</p>}
          {!loadingSlots && results && results.every((r) => r.slots.length === 0) && (
            <p className="text-charcoal/50 text-sm">No quedan horarios libres ese día. Probá otra fecha.</p>
          )}
          {!loadingSlots && results && (
            <div className="space-y-5 mb-8">
              {results.filter((r) => r.slots.length > 0).map((r) => (
                <div key={r.employeeId}>
                  <p className="text-sm font-medium mb-2">{r.employeeName}</p>
                  <div className="flex flex-wrap gap-2">
                    {r.slots.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelected({ employeeId: r.employeeId, employeeName: r.employeeName, startsAt: s })}
                        className={`px-4 py-2 rounded-full text-sm border transition hover:shadow-md ${
                          selected?.startsAt === s ? 'bg-brass text-ink border-brass' : 'border-charcoal/20 hover:border-ink'
                        }`}
                      >
                        {new Date(s).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Paso 4: datos y confirmación */}
      {selected && (
        <div className="border-t border-charcoal/10 pt-6">
          <p className="text-xs uppercase tracking-[0.25em] text-brass mb-3">Paso 4 — Tus datos</p>
          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="border border-charcoal/20 rounded-xl px-4 py-3 text-base"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Tu WhatsApp (con código de área)"
              className="border border-charcoal/20 rounded-xl px-4 py-3 text-base"
            />
          </div>
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <button
            onClick={confirm}
            disabled={confirming || !name.trim() || !phone.trim()}
            className="w-full md:w-auto bg-ink text-paper font-medium px-8 py-3.5 rounded-full disabled:opacity-50 hover:bg-brass hover:text-ink transition"
          >
            {confirming ? 'Reservando…' : `Confirmar turno — ${selected.employeeName}, ${new Date(selected.startsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`}
          </button>
        </div>
      )}

      {confirmed && (
        <p className="mt-6 text-center text-base bg-green-50 text-green-700 border border-green-200 rounded-2xl px-4 py-4">
          ¡Turno confirmado! Te esperamos. Te va a llegar un recordatorio por WhatsApp el día anterior.
        </p>
      )}
    </div>
  );
}
