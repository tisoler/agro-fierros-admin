import { requiereSesion } from '@/lib/sesion';
import Navegacion from '@/componentes/Navegacion';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requiereSesion();

  return (
    <div className="min-h-screen">
      <Navegacion />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
