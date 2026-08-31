'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { cambiarFlagUnidad, eliminarUnidad } from '@/acciones/unidades';

export type FilaUnidad = {
  id: number;
  titulo: string;
  modelo: string;
  marca: string;
  activa: boolean;
  vendida: boolean;
  esOportunidad: boolean;
  esNovedad: boolean;
};

function Interruptor({
  activo,
  etiqueta,
  deshabilitado,
  onCambiar,
}: {
  activo: boolean;
  etiqueta: string;
  deshabilitado: boolean;
  onCambiar: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      title={etiqueta}
      disabled={deshabilitado}
      onClick={onCambiar}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${activo ? 'bg-marca-600' : 'bg-slate-300'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${activo ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
  );
}

export default function FilasUnidades({ filas }: { filas: FilaUnidad[] }) {
  const [pendiente, iniciarTransicion] = useTransition();

  const alternar = (id: number, campo: 'activa' | 'esOportunidad' | 'esNovedad' | 'vendida', valor: boolean) => {
    iniciarTransicion(() => cambiarFlagUnidad(id, campo, valor));
  };

  const eliminar = (id: number, titulo: string) => {
    if (confirm(`¿Desactivar la unidad "${titulo}"? Dejará de mostrarse en la tienda.`)) {
      iniciarTransicion(() => eliminarUnidad(id));
    }
  };

  if (!filas.length) {
    return <p className="rounded-card bg-white p-6 text-sm text-slate-500 shadow-card">Todavía no hay unidades cargadas.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-card bg-white shadow-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-500">
            <th className="px-4 py-2 font-semibold">Unidad</th>
            <th className="px-2 py-2 text-center font-semibold">Activa</th>
            <th className="px-2 py-2 text-center font-semibold">Oportunidad</th>
            <th className="px-2 py-2 text-center font-semibold">Novedad</th>
            <th className="px-2 py-2 text-center font-semibold">Vendida</th>
            <th className="px-4 py-2 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id} className="border-b border-slate-100 last:border-b-0">
              <td className="px-4 py-2">
                <p className="font-medium text-slate-900">{fila.titulo}</p>
                <p className="text-xs text-slate-500">
                  {fila.marca} · {fila.modelo} · #{fila.id}
                </p>
              </td>
              <td className="px-2 py-2 text-center">
                <Interruptor activo={fila.activa} etiqueta={`Activa ${fila.titulo}`} deshabilitado={pendiente} onCambiar={() => alternar(fila.id, 'activa', !fila.activa)} />
              </td>
              <td className="px-2 py-2 text-center">
                <Interruptor activo={fila.esOportunidad} etiqueta={`Oportunidad ${fila.titulo}`} deshabilitado={pendiente} onCambiar={() => alternar(fila.id, 'esOportunidad', !fila.esOportunidad)} />
              </td>
              <td className="px-2 py-2 text-center">
                <Interruptor activo={fila.esNovedad} etiqueta={`Novedad ${fila.titulo}`} deshabilitado={pendiente} onCambiar={() => alternar(fila.id, 'esNovedad', !fila.esNovedad)} />
              </td>
              <td className="px-2 py-2 text-center">
                <Interruptor activo={fila.vendida} etiqueta={`Vendida ${fila.titulo}`} deshabilitado={pendiente} onCambiar={() => alternar(fila.id, 'vendida', !fila.vendida)} />
              </td>
              <td className="px-4 py-2 text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/unidades/${fila.id}`}
                    className="rounded-btn border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    disabled={pendiente || !fila.activa}
                    onClick={() => eliminar(fila.id, fila.titulo)}
                    className="rounded-btn border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                  >
                    Desactivar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
