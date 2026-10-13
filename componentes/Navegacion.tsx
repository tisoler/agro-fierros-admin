'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cerrarSesion } from '@/acciones/auth';

const enlaces = [
  { href: '/unidades', texto: 'Unidades' },
  { href: '/carrusel', texto: 'Carrusel home' },
  { href: '/carruseles-unidades', texto: 'Carruseles' },
];

export default function Navegacion() {
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/unidades" className="flex items-center gap-2">
            <Image src="/logos/agrofierros-horizontal.svg" width={127} height={26} alt="AgroFierros" priority />
            <span className="text-sm font-bold text-marca-600">Admin</span>
          </Link>
          <nav className="flex items-center gap-4">
            {enlaces.map((enlace) => {
              const activo = pathname.startsWith(enlace.href);
              return (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  className={`text-sm font-medium transition-colors ${activo ? 'text-marca-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  {enlace.texto}
                </Link>
              );
            })}
          </nav>
        </div>
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="rounded-btn border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </header>
  );
}
