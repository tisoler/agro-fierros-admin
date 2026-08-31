'use client';

import { useTransition } from 'react';
import { cambiarActivoItemCarrusel, eliminarItemCarrusel } from '@/acciones/carrusel';
import FormularioCarrusel, { ItemCarrusel } from '@/componentes/FormularioCarrusel';

export default function ListaCarrusel({ items }: { items: ItemCarrusel[] }) {
  const [pendiente, iniciarTransicion] = useTransition();

  const alternarActivo = (id: number, activo: boolean) => {
    iniciarTransicion(() => cambiarActivoItemCarrusel(id, activo));
  };

  const eliminar = (id: number) => {
    if (confirm('¿Eliminar este item del carrusel?')) {
      iniciarTransicion(() => eliminarItemCarrusel(id));
    }
  };

  if (!items.length) {
    return (
      <p className="rounded-card bg-white p-6 text-sm text-slate-500 shadow-card">
        No hay items cargados: la tienda muestra el carrusel por defecto.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-card bg-white p-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.urlImagenMobile || item.urlImagenDesktop} alt={item.textoAlt} className="h-12 w-20 rounded-btn object-cover" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  #{item.orden} · {item.textoAlt}
                  {!item.activo && <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">inactivo</span>}
                </p>
                <p className="text-xs text-slate-500">{item.urlDestino ? `Destino: ${item.urlDestino}` : 'Sin destino'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pendiente}
                onClick={() => alternarActivo(item.id!, !item.activo)}
                className="rounded-btn border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
              >
                {item.activo ? 'Desactivar' : 'Activar'}
              </button>
              <button
                type="button"
                disabled={pendiente}
                onClick={() => eliminar(item.id!)}
                className="rounded-btn border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-marca-600">Editar</summary>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <FormularioCarrusel item={item} />
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
