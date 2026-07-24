'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => api.get<GalleryImage[]>('/gallery').then(setImages);
  useEffect(() => { load(); }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (caption.trim()) formData.append('caption', caption.trim());
      await api.upload('/gallery', formData);
      setCaption('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const remove = async (img: GalleryImage) => {
    if (!confirm('¿Eliminar esta foto de la galería pública?')) return;
    await api.delete(`/gallery/${img.id}`);
    load();
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Galería</h1>
      <p className="text-charcoal/60 text-sm mb-6">
        Estas fotos aparecen en el carrusel de la web pública. Elegí trabajos que muestren bien el
        estilo del local — cortes, el espacio, detalles. Se suben directo desde la galería o la
        cámara de tu celular.
      </p>

      <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
        <label className="block text-sm font-medium mb-1">Descripción (opcional)</label>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Ej: Corte degradado"
          className="w-full border rounded-lg px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-brass transition"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm"
        />
        {uploading && <p className="text-sm text-charcoal/50 mt-2">Subiendo…</p>}
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((img) => (
          <div key={img.id} className="relative group rounded-xl overflow-hidden border shadow-sm aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.caption ?? 'Foto de la galería'} className="w-full h-full object-cover" />
            <button
              onClick={() => remove(img)}
              className="absolute top-2 right-2 bg-ink/80 text-paper text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition"
            >
              Eliminar
            </button>
            {img.caption && (
              <p className="absolute bottom-0 inset-x-0 bg-ink/70 text-paper text-xs px-2 py-1 truncate">
                {img.caption}
              </p>
            )}
          </div>
        ))}
        {images.length === 0 && (
          <p className="col-span-full text-center text-charcoal/40 py-10">Todavía no subiste ninguna foto.</p>
        )}
      </div>
    </div>
  );
}
