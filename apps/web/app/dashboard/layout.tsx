'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { clearToken } from '@/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Resumen' },
  { href: '/dashboard/appointments', label: 'Turnos' },
  { href: '/dashboard/schedule', label: 'Horarios' },
  { href: '/dashboard/customers', label: 'Clientes (CRM)' },
  { href: '/dashboard/services', label: 'Servicios' },
  { href: '/dashboard/employees', label: 'Empleados' },
  { href: '/dashboard/agent', label: 'Agente IA' },
  { href: '/dashboard/knowledge', label: 'Base de conocimientos' },
  { href: '/dashboard/promotions', label: 'Promociones' },
  { href: '/dashboard/settings', label: 'Configuración' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('accessToken')) {
      router.push('/login');
    }
  }, [router]);

  const logout = () => {
    clearToken();
    router.push('/');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-ink text-paper flex flex-col shrink-0">
        <div className="px-5 py-6 border-b border-paper/10">
          <span className="font-display text-2xl tracking-widest">AYRTON</span>
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone mt-1">Panel administrativo</p>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-5 py-2.5 text-sm border-l-2 transition ${
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
      <main className="flex-1 bg-paper p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
