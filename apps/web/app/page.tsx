'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import ChatWidget from '@/components/ChatWidget';
import BookingWidget from '@/components/BookingWidget';
import LoginModal from '@/components/LoginModal';
import AccountPanel from '@/components/AccountPanel';
import { hasCustomerSession, publicApi } from '@/lib/publicApi';

interface ApiService {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceCents: number;
}

const TeardropClip = () => (
  <svg width="0" height="0" className="absolute">
    <defs>
      <clipPath id="teardrop" clipPathUnits="objectBoundingBox">
        <path d="M0.5,0.02 C0.8,0.02 0.98,0.26 0.98,0.5 C0.98,0.76 0.76,0.97 0.5,0.98 C0.24,0.97 0.02,0.76 0.02,0.5 C0.02,0.26 0.2,0.02 0.5,0.02 Z" />
      </clipPath>
    </defs>
  </svg>
);

function ScissorsIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className={className}>
      <circle cx="6" cy="6" r="2.4" />
      <circle cx="6" cy="18" r="2.4" />
      <line x1="20" y1="4" x2="8.2" y2="14.4" />
      <line x1="8.2" y1="9.6" x2="20" y2="20" />
    </svg>
  );
}

export default function HomePage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [services, setServices] = useState<ApiService[]>([]);

  useEffect(() => {
    setLoggedIn(hasCustomerSession());
    publicApi.getServices().then(setServices).catch(() => setServices([]));
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <main className="bg-paper text-ink">
      <TeardropClip />

      {/* NAV */}
      <header
        className={`fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 md:px-12 py-4 transition-colors ${
          scrolled ? 'bg-paper/95 backdrop-blur border-b border-charcoal/10 text-ink' : 'bg-transparent text-paper'
        }`}
      >
        <span className="font-display text-2xl tracking-widest">AYRTON</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => (loggedIn ? scrollTo('cuenta') : setLoginOpen(true))}
            className={`text-xs uppercase tracking-[0.2em] rounded-full px-4 py-2 border transition ${
              scrolled
                ? 'border-ink text-ink hover:bg-ink hover:text-paper'
                : 'border-paper text-paper hover:bg-paper hover:text-ink'
            }`}
          >
            {loggedIn ? 'Mi cuenta' : 'Iniciar sesión'}
          </button>
          <a
            href="https://wa.me/549XXXXXXXXX"
            target="_blank"
            className={`text-xs uppercase tracking-[0.2em] rounded-full px-4 py-2 border transition hidden sm:inline-block ${
              scrolled
                ? 'border-ink text-ink hover:bg-ink hover:text-paper'
                : 'border-paper text-paper hover:bg-paper hover:text-ink'
            }`}
          >
            WhatsApp
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen bg-ink text-paper overflow-hidden flex items-center">
        <div className="max-w-6xl mx-auto px-6 md:px-12 grid md:grid-cols-2 gap-12 items-center py-32">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone mb-6">Villa Carlos Paz · Córdoba</p>
            <h1 className="font-display text-[15vw] md:text-7xl leading-[0.85] tracking-wide">
              ESTILISTAS
            </h1>
            <p className="mt-8 text-lg text-paper/80 max-w-md">
              Un estudio, un oficio. Mirá los horarios libres y reservá vos mismo, sin llamar a nadie.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button
                onClick={() => scrollTo('reservar')}
                className="bg-paper text-ink font-medium px-7 py-3.5 rounded-full hover:bg-brass hover:text-ink transition shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Ver turnos y reservar
              </button>
              <a
                href="#servicios"
                className="border border-paper/40 px-7 py-3.5 rounded-full hover:border-paper hover:-translate-y-0.5 transition text-paper/90"
              >
                Ver servicios
              </a>
            </div>
          </div>

          <div className="relative aspect-square w-full max-w-md mx-auto drop-shadow-2xl">
            <div className="absolute inset-0" style={{ clipPath: 'url(#teardrop)' }}>
              <Image src="/images/fachada-ayrton.png" alt="Fachada de Ayrton Estilistas" fill className="object-cover" priority />
            </div>
            <ScissorsIcon className="absolute bottom-4 right-2 w-10 h-10 text-paper drop-shadow" />
          </div>
        </div>
      </section>

      {/* EL ESTUDIO */}
      <section className="py-24 px-6 md:px-12 border-b border-charcoal/10">
        <div className="max-w-3xl mx-auto text-center">
          <ScissorsIcon className="w-8 h-8 mx-auto mb-6 text-brass" />
          <p className="font-display text-3xl md:text-4xl leading-tight tracking-wide">
            "No apuramos un corte. Lo hacemos bien, y después vemos la hora."
          </p>
          <p className="mt-6 text-charcoal/70">
            Así trabajamos desde siempre. Ahora, además, podés ver los horarios libres vos mismo desde
            el celular, y reservar en un minuto — sin llamar, sin esperar a que alguien te conteste.
          </p>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className="py-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-brass mb-3 text-center">Servicios</p>
          <h2 className="font-display text-4xl md:text-5xl text-center mb-14 tracking-wide">
            LO QUE HACEMOS
          </h2>
          <div className="divide-y divide-charcoal/10 border-y border-charcoal/10">
            {services.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-6 gap-6 transition hover:bg-charcoal/[0.02] hover:px-2 rounded-xl">
                <div>
                  <h3 className="font-display text-2xl tracking-wide">{s.name.toUpperCase()}</h3>
                  {s.description && <p className="text-sm text-charcoal/60 mt-1">{s.description}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-2xl text-brass">${(s.priceCents / 100).toLocaleString('es-AR')}</p>
                  <p className="text-xs uppercase tracking-widest text-charcoal/50">{s.durationMin} min</p>
                </div>
              </div>
            ))}
            {services.length === 0 && (
              <p className="text-center text-charcoal/40 py-10">Todavía no hay servicios cargados.</p>
            )}
          </div>
        </div>
      </section>

      {/* RESERVAR */}
      <section id="reservar" className="py-24 px-6 md:px-12 bg-charcoal/[0.03]">
        <p className="text-xs uppercase tracking-[0.3em] text-brass mb-3 text-center">Turnos disponibles</p>
        <h2 className="font-display text-4xl md:text-5xl text-center mb-4 tracking-wide">RESERVÁ VOS MISMO</h2>
        <p className="text-center text-charcoal/60 max-w-md mx-auto mb-12">
          Elegí el servicio, el día y el horario que te quede mejor. En cuanto lo confirmás, ese horario
          deja de estar disponible para cualquier otra persona.
        </p>
        <BookingWidget />
      </section>

      {/* CUENTA / FIDELIZACIÓN */}
      <section id="cuenta" className="py-24 px-6 md:px-12">
        <p className="text-xs uppercase tracking-[0.3em] text-brass mb-3 text-center">Clientes frecuentes</p>
        <h2 className="font-display text-4xl md:text-5xl text-center mb-4 tracking-wide">SUMÁ CORTES, GANÁ DESCUENTOS</h2>
        <p className="text-center text-charcoal/60 max-w-md mx-auto mb-12">
          Creá tu cuenta gratis y cada corte que te hagas acá queda registrado. A partir del tercero,
          empezás a tener descuentos.
        </p>
        {loggedIn ? (
          <AccountPanel onLogout={() => setLoggedIn(false)} />
        ) : (
          <div className="text-center">
            <button
              onClick={() => setLoginOpen(true)}
              className="bg-ink text-paper font-medium px-8 py-3.5 rounded-full hover:bg-brass hover:text-ink transition shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Crear mi cuenta / Iniciar sesión
            </button>
          </div>
        )}
      </section>

      {/* CTA WHATSAPP */}
      <section className="bg-ink text-paper py-24 px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl tracking-wide mb-6">¿PREFERÍS ESCRIBIR?</h2>
          <p className="text-paper/70 mb-10">
            También podés reservar, cambiar o cancelar tu turno charlando por WhatsApp o por este chat —
            el asistente te contesta al toque.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setChatOpen(true)}
              className="bg-paper text-ink font-medium px-8 py-3.5 rounded-full hover:bg-brass hover:shadow-xl hover:-translate-y-0.5 transition"
            >
              Abrir el chat
            </button>
            <a
              href="https://wa.me/549XXXXXXXXX"
              target="_blank"
              className="border border-paper/40 px-8 py-3.5 rounded-full hover:border-paper hover:-translate-y-0.5 transition"
            >
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-charcoal/60">
        <span className="font-display text-lg tracking-widest text-ink">AYRTON ESTILISTAS</span>
        <span>Villa Carlos Paz, Córdoba, Argentina</span>
      </footer>

      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} tenantSlug="ayrton-estilistas" />
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-30 bg-ink text-paper rounded-full w-14 h-14 shadow-lg flex items-center justify-center hover:bg-brass transition"
          aria-label="Abrir chat"
        >
          <ScissorsIcon className="w-6 h-6" />
        </button>
      )}

      {loginOpen && (
        <LoginModal
          onClose={() => setLoginOpen(false)}
          onCustomerLogin={() => setLoggedIn(true)}
        />
      )}
    </main>
  );
}
