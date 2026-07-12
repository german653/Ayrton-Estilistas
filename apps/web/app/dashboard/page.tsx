'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AnalyticsSummary {
  totalCustomers: number;
  upcomingAppointments: number;
  completedThisMonth: number;
  openConversations: number;
}

export default function DashboardHomePage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<AnalyticsSummary>('/tenants/me/analytics')
      .then(setSummary)
      .catch((err) => setError(err.message));
  }, []);

  const cards = summary
    ? [
        { label: 'Clientes totales', value: summary.totalCustomers },
        { label: 'Turnos próximos', value: summary.upcomingAppointments },
        { label: 'Completados este mes', value: summary.completedThisMonth },
        { label: 'Conversaciones abiertas', value: summary.openConversations },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Resumen</h1>
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-charcoal/60 text-sm">{c.label}</p>
            <p className="text-3xl font-bold mt-2">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
