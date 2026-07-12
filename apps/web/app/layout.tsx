import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ayrton Estilistas — Villa Carlos Paz',
  description: 'Estudio de estilismo en Villa Carlos Paz. Reservá tu turno por WhatsApp o acá mismo, las 24 horas.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
