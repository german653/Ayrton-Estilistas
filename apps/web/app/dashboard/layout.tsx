'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearToken } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Resumen' },
  { href: '/dashboard/appointments', label: 'Turnos' },
  { href: '/dashboard/schedule', label: 'Horarios' },
  { href: '/dashboard/customers', label: 'Clientes (CRM)' },
  { href: '/dashboard/services', label: 'Servicios' },
  { href: '/dashboard/employees', label: 'Empleados' },
  { href: '/dashboard/gallery', label: 'Galería' },
  { href: '/dashboard/agent', label: 'Agente IA' },
  { href: '/dashboard/knowledge', label: 'Base de conocimientos' },
  { href: '/dashboard/promotions', label: 'Promociones' },
  { href: '/dashboard/settings', label: 'Configuración' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
      router.push('/login');
    }
  }, [router]);

  // Cierra el menú solo al cambiar de página (no hace falta que el usuario lo cierre a mano en mobile).
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const logout = () => {
    clearToken();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Barra superior — solo visible en celular/tablet */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-ink text-paper shadow-md">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
          className="text-2xl leading-none px-1"
        >
          ☰
        </button>
        <span className="font-display text-xl tracking-widest">AYRTON</span>
        <span className="w-8" /> {/* espaciador para centrar el logo */}
      </header>

      {/* Fondo oscuro detrás del menú, solo en mobile mientras está abierto */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/60 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex">
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-ink text-paper flex flex-col shrink-0
            transform transition-transform duration-300 ease-in-out
            ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
            md:static md:translate-x-0 md:w-64 md:min-h-screen
          `}
        >
          <div className="flex items-center justify-between px-5 py-6 border-b border-paper/10">
            <div>
              <span className="font-display text-2xl tracking-widest">AYRTON</span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone mt-1">Panel administrativo</p>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
              className="md:hidden text-2xl leading-none text-paper/70 hover:text-paper"
            >
              ✕
            </button>
          </div>
          <nav className="flex-1 py-4 overflow-y-auto">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-5 py-3 md:py-2.5 text-sm border-l-2 transition ${
                  pathname === item.href
                    ? 'border-brass bg-paper/5 font-semibold text-paper'
                    : 'border-transparent text-paper/70 hover:text-paper hover:bg-paper/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-paper/10">
            <Link
              href="/"
              target="_blank"
              className="block px-5 py-3.5 text-sm text-paper/70 hover:text-paper hover:bg-paper/5 transition"
            >
              ↗ Ver sitio público
            </Link>
            <button
              onClick={logout}
              className="w-full px-5 py-3.5 text-sm text-left text-paper/70 hover:text-paper hover:bg-paper/5 transition border-t border-paper/10"
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        <main className="flex-1 bg-paper p-4 md:p-8 overflow-y-auto min-w-0">{children}</main>
      </div>
    </div>
  );
}
