'use client';

import { useEffect, useRef, useState } from 'react';
import { publicApi } from '@/lib/publicApi';

interface GalleryImage {
  id: string;
  url: string;
  caption: string | null;
}

const AUTOPLAY_MS = 5000;

export default function GalleryCarousel() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    publicApi.getGallery().then(setImages).catch(() => setImages([]));
  }, []);

  useEffect(() => {
    if (paused || images.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, images.length]);

  if (images.length === 0) return null;

  const go = (i: number) => setIndex((i + images.length) % images.length);

  return (
    <div
      className="relative max-w-3xl mx-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div className="relative aspect-[4/3] sm:aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl border border-charcoal/10 bg-ink">
        {images.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.id}
            src={img.url}
            alt={img.caption ?? 'Trabajo realizado en Ayrton Estilistas'}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {images[index]?.caption && (
          <p className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink/80 to-transparent text-paper text-sm sm:text-base px-5 py-4">
            {images[index].caption}
          </p>
        )}

        {images.length > 1 && (
          <>
            <button
              onClick={() => go(index - 1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-paper/90 text-ink flex items-center justify-center text-xl shadow-lg hover:bg-brass transition"
            >
              ‹
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-paper/90 text-ink flex items-center justify-center text-xl shadow-lg hover:bg-brass transition"
            >
              ›
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => go(i)}
              aria-label={`Ir a la foto ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? 'w-7 bg-brass' : 'w-2.5 bg-charcoal/20 hover:bg-charcoal/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
