'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Channel {
  id: string;
  channel: 'WHATSAPP' | 'INSTAGRAM' | 'MESSENGER';
  displayLabel: string | null;
  isActive: boolean;
  updatedAt: string;
}

const CHANNEL_INFO: Record<Channel['channel'], { title: string; labelHint: string; idLabel: string; idHint: string }> = {
  WHATSAPP: {
    title: 'WhatsApp',
    labelHint: 'Número visible, ej: +54 9 351 555-1234',
    idLabel: 'ID de número de WhatsApp (Meta)',
    idHint: 'Lo obtenés en Meta Business → WhatsApp → Configuración de la API.',
  },
  INSTAGRAM: {
    title: 'Instagram',
    labelHint: 'Usuario visible, ej: @ayrtonestilistas',
    idLabel: 'ID de cuenta profesional de Instagram (Meta)',
    idHint: 'Lo obtenés en Meta Business → Instagram → Cuentas conectadas.',
  },
  MESSENGER: {
    title: 'Messenger',
    labelHint: 'Nombre visible de tu página de Facebook',
    idLabel: 'ID de página de Facebook (Meta)',
    idHint: 'Lo obtenés en Meta Business → Páginas → Configuración.',
  },
};

const CHANNEL_ORDER: Channel['channel'][] = ['WHATSAPP', 'INSTAGRAM', 'MESSENGER'];

export default function SettingsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [editing, setEditing] = useState<Channel['channel'] | null>(null);
  const [form, setForm] = useState({ displayLabel: '', externalId: '', accessToken: '' });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const load = () => api.get<Channel[]>('/tenants/me/channels').then(setChannels);
  useEffect(() => { load(); }, []);

  const byChannel = (c: Channel['channel']) => channels.find((x) => x.channel === c);

  const startEdit = (c: Channel['channel']) => {
    const existing = byChannel(c);
    setForm({ displayLabel: existing?.displayLabel ?? '', externalId: '', accessToken: '' });
    setEditing(c);
    setSavedMsg(null);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.post(`/tenants/me/channels/${editing}`, form);
      setSavedMsg(`${CHANNEL_INFO[editing].title} actualizado correctamente.`);
      setEditing(null);
      load();
    } catch (err) {
      setSavedMsg(err instanceof Error ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Canales conectados</h1>
      <p className="text-charcoal/60 text-sm mb-6">
        Desde acá conectás o actualizás vos mismo cada canal — por ejemplo, si el negocio cambia de
        número de WhatsApp, no necesitás avisarle a nadie: lo actualizás acá y queda funcionando al toque.
      </p>

      {savedMsg && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 mb-4">{savedMsg}</p>}

      <div className="space-y-4">
        {CHANNEL_ORDER.map((c) => {
          const existing = byChannel(c);
          const info = CHANNEL_INFO[c];
          const isEditing = editing === c;

          return (
            <div key={c} className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{info.title}</h2>
                  {existing ? (
                    <p className="text-sm text-charcoal/60 mt-0.5">
                      {existing.displayLabel || 'Conectado (sin etiqueta visible)'}
                      <span className={`ml-2 text-xs ${existing.isActive ? 'text-green-600' : 'text-charcoal/40'}`}>
                        {existing.isActive ? '● Activo' : '○ Inactivo'}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-charcoal/40 mt-0.5">No conectado</p>
                  )}
                </div>
                <button
                  onClick={() => (isEditing ? setEditing(null) : startEdit(c))}
                  className="text-sm font-medium text-brand hover:underline"
                >
                  {isEditing ? 'Cancelar' : existing ? 'Actualizar' : 'Conectar'}
                </button>
              </div>

              {isEditing && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">{info.labelHint}</label>
                    <input
                      value={form.displayLabel}
                      onChange={(e) => setForm({ ...form, displayLabel: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brass transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{info.idLabel}</label>
                    <input
                      value={form.externalId}
                      onChange={(e) => setForm({ ...form, externalId: e.target.value })}
                      placeholder={existing ? 'Dejalo vacío para mantener el actual' : ''}
                      className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brass transition"
                    />
                    <p className="text-xs text-charcoal/40 mt-1">{info.idHint}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Token de acceso (Meta)</label>
                    <input
                      type="password"
                      value={form.accessToken}
                      onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
                      placeholder={existing ? 'Dejalo vacío para mantener el actual' : ''}
                      className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brass transition"
                    />
                  </div>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="bg-brand text-white font-semibold px-5 py-2 rounded-lg disabled:opacity-50 hover:bg-brass hover:text-ink transition shadow-sm"
                  >
                    {saving ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
