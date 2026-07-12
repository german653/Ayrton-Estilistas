'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Document {
  id: string;
  title: string;
  sourceType: string;
  createdAt: string;
}

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get<Document[]>('/knowledge').then(setDocuments);

  useEffect(() => {
    load();
  }, []);

  const addDocument = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await api.post('/knowledge', { title, content, sourceType: 'manual' });
      setTitle('');
      setContent('');
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await api.delete(`/knowledge/${id}`);
    load();
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Base de conocimientos</h1>

      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6 space-y-3">
        <h2 className="font-semibold">Agregar documento</h2>
        <input
          placeholder="Título (ej: Políticas de cancelación)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        <textarea
          placeholder="Contenido: precios, políticas, preguntas frecuentes, dirección, etc."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full border rounded-lg px-3 py-2"
        />
        <button
          onClick={addDocument}
          disabled={saving}
          className="bg-brand text-white font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
        >
          {saving ? 'Procesando…' : 'Agregar a la base de conocimientos'}
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm divide-y">
        {documents.map((d) => (
          <div key={d.id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{d.title}</p>
              <p className="text-xs text-charcoal/60">{d.sourceType} · {new Date(d.createdAt).toLocaleDateString('es-AR')}</p>
            </div>
            <button onClick={() => remove(d.id)} className="text-red-600 text-sm hover:underline">
              Eliminar
            </button>
          </div>
        ))}
        {documents.length === 0 && <p className="p-6 text-center text-charcoal/40">Todavía no hay documentos.</p>}
      </div>
    </div>
  );
}
