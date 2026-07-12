'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface AgentConfig {
  systemPrompt: string;
  greetingMessage: string;
  isEnabled: boolean;
  temperature: number;
}

export default function AgentConfigPage() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    api.get<AgentConfig>('/agent/config').then(setConfig);
  }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.patch('/agent/config', config);
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  };

  if (!config) return <p>Cargando…</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Configuración del agente</h1>

      <div className="bg-white rounded-xl border shadow-sm p-6 space-y-5">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.isEnabled}
            onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
          />
          <span className="font-medium">Agente activo</span>
        </label>

        <div>
          <label className="block font-medium mb-1">Mensaje de saludo</label>
          <input
            value={config.greetingMessage}
            onChange={(e) => setConfig({ ...config, greetingMessage: e.target.value })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Prompt del sistema (personalidad e instrucciones)</label>
          <textarea
            value={config.systemPrompt}
            onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
            rows={12}
            className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
          />
          <p className="text-xs text-charcoal/60 mt-1">
            El agente siempre puede usar herramientas reales: consultar disponibilidad, reservar,
            cancelar, reprogramar, buscar en la base de conocimientos y derivar a un humano.
          </p>
        </div>

        <div>
          <label className="block font-medium mb-1">Creatividad (temperature: {config.temperature})</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={config.temperature}
            onChange={(e) => setConfig({ ...config, temperature: Number(e.target.value) })}
            className="w-full"
          />
          <p className="text-xs text-charcoal/40 mt-1">
            Este control está deshabilitado temporalmente: el modelo actual no admite ajustar este parámetro.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={save}
            disabled={saving}
            className="bg-brand text-white font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
          {savedAt && <span className="text-sm text-green-600">Guardado {savedAt.toLocaleTimeString('es-AR')}</span>}
        </div>
      </div>
    </div>
  );
}
