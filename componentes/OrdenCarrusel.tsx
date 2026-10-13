'use client';

import { useRef, useState, useTransition } from 'react';
import { guardarOrdenCarrusel } from '@/acciones/unidades';

export type ItemOrden = { id: number; titulo: string; imagen: string };

type Props = {
  seccion: 'oportunidad' | 'novedad';
  titulo: string;
  bajada: string;
  inicial: ItemOrden[];
};

// Grilla de tarjetas angostas con la destacada + título, reordenable con
// drag and drop (y flechas para táctil). Se guarda con el botón.
export default function OrdenCarrusel({ seccion, titulo, bajada, inicial }: Props) {
  const [items, setItems] = useState<ItemOrden[]>(inicial);
  const [base, setBase] = useState<number[]>(inicial.map((item) => item.id));
  const [encima, setEncima] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciarTransicion] = useTransition();
  const arrastrado = useRef<number | null>(null);

  const sucio = items.map((item) => item.id).join(',') !== base.join(',');

  const moverA = (desde: number, hacia: number) => {
    if (hacia < 0 || hacia >= items.length || desde === hacia) return;
    setItems((previos) => {
      const copia = [...previos];
      const [item] = copia.splice(desde, 1);
      copia.splice(hacia, 0, item);
      return copia;
    });
  };

  const alSoltar = (indice: number) => {
    if (arrastrado.current !== null) {
      moverA(arrastrado.current, indice);
    }
    arrastrado.current = null;
    setEncima(null);
  };

  const guardar = () => {
    setError(null);
    iniciarTransicion(async () => {
      const resultado = await guardarOrdenCarrusel(seccion, items.map((item) => item.id));
      if (resultado?.error) {
        setError(resultado.error);
      } else {
        setBase(items.map((item) => item.id));
      }
    });
  };

  if (!items.length) {
    return (
      <section className="rounded-card bg-white p-4 shadow-card">
        <h2 className="text-sm font-bold text-slate-900">{titulo}</h2>
        <p className="mt-1 text-xs text-slate-500">Sin unidades marcadas como {bajada}.</p>
      </section>
    );
  }

  return (
    <section className="rounded-card bg-white p-4 shadow-card">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{titulo}</h2>
          <p className="text-xs text-slate-500">{bajada}. Arrastrá las tarjetas o usá las flechas.</p>
        </div>
        <button
          type="button"
          onClick={guardar}
          disabled={!sucio || pendiente}
          className="rounded-btn bg-marca-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-marca-700 disabled:opacity-40"
        >
          {pendiente ? 'Guardando…' : sucio ? 'Guardar orden' : 'Orden guardado'}
        </button>
      </div>
      {error && <p className="mb-2 rounded-btn bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2">
        {items.map((item, indice) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => {
              arrastrado.current = indice;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setEncima(indice);
            }}
            onDragLeave={() => setEncima((previo) => (previo === indice ? null : previo))}
            onDrop={() => alSoltar(indice)}
            onDragEnd={() => {
              arrastrado.current = null;
              setEncima(null);
            }}
            className={`relative cursor-grab rounded-btn border bg-white p-1.5 transition-shadow active:cursor-grabbing ${encima === indice ? 'border-marca-600 shadow-[0_0_0_1px_#ea580c]' : 'border-slate-200'}`}
          >
            <span className="absolute left-2 top-2 rounded bg-slate-900/85 px-1.5 py-0.5 text-[11px] font-bold text-white">
              #{indice + 1}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imagen} alt="" className="aspect-[4/3] w-full rounded object-cover" draggable={false} />
            <p className="mt-1 line-clamp-2 min-h-[2em] text-xs font-medium leading-4 text-slate-800">{item.titulo}</p>
            <div className="mt-1 flex gap-1">
              <button
                type="button"
                onClick={() => moverA(indice, indice - 1)}
                disabled={indice === 0 || pendiente}
                aria-label={`Subir ${item.titulo}`}
                className="flex-1 rounded border border-slate-200 px-1 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moverA(indice, indice + 1)}
                disabled={indice === items.length - 1 || pendiente}
                aria-label={`Bajar ${item.titulo}`}
                className="flex-1 rounded border border-slate-200 px-1 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                ↓
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
