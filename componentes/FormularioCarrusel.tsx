'use client';

import { useActionState } from 'react';
import { guardarItemCarrusel } from '@/acciones/carrusel';

export type ItemCarrusel = {
  id?: number;
  urlImagenDesktop: string;
  urlImagenMobile: string;
  textoAlt: string;
  urlDestino: string;
  orden: number;
  activo: boolean;
};

const claseInput = 'w-full rounded-btn border border-slate-300 px-3 py-2 text-sm focus:border-marca-600 focus:outline-none';
const claseLabel = 'mb-1 block text-xs font-semibold text-slate-600';

export default function FormularioCarrusel({ item }: { item?: ItemCarrusel }) {
  const [estado, action, pendiente] = useActionState(guardarItemCarrusel, null);

  return (
    <form action={action} className="space-y-3">
      {item?.id && <input type="hidden" name="id" value={item.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={claseLabel}>Imagen desktop (URL) *</label>
          <input type="url" name="urlImagenDesktop" required defaultValue={item?.urlImagenDesktop} className={claseInput} />
        </div>
        <div>
          <label className={claseLabel}>Imagen mobile (URL) *</label>
          <input type="url" name="urlImagenMobile" required defaultValue={item?.urlImagenMobile} className={claseInput} />
        </div>
        <div>
          <label className={claseLabel}>Texto alt *</label>
          <input type="text" name="textoAlt" required defaultValue={item?.textoAlt} className={claseInput} />
        </div>
        <div>
          <label className={claseLabel}>Destino (URL o ruta, opcional)</label>
          <input type="text" name="urlDestino" defaultValue={item?.urlDestino} className={claseInput} placeholder="Ej: /buscar?categoria=tractores" />
        </div>
        <div className="flex items-end gap-6">
          <div className="w-24">
            <label className={claseLabel}>Orden</label>
            <input type="number" name="orden" defaultValue={item?.orden ?? 0} className={claseInput} />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
            <input type="checkbox" name="activo" defaultChecked={item ? item.activo : true} className="h-4 w-4 accent-marca-600" />
            Activo
          </label>
        </div>
      </div>
      {estado?.error && <p className="rounded-btn bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>}
      <button
        type="submit"
        disabled={pendiente}
        className="rounded-btn bg-marca-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-marca-700 disabled:opacity-60"
      >
        {pendiente ? 'Guardando…' : item?.id ? 'Guardar item' : 'Agregar item'}
      </button>
    </form>
  );
}
