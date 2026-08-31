'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { guardarUnidad } from '@/acciones/unidades';

type MarcaOpcion = { id: number; nombre: string };
type CategoriaOpcion = { id: number; titulo: string };

type ImagenFormulario = {
  urlEscritorio: string;
  urlMobile: string;
  urlMini: string;
  textoAlt: string;
};

export type UnidadFormulario = {
  id?: number;
  titulo?: string;
  descripcion?: string;
  modelo?: string;
  idMarca?: number;
  nuevo?: boolean;
  esOportunidad?: boolean;
  esNovedad?: boolean;
  activa?: boolean;
  vendida?: boolean;
  precioDolar?: number | null;
  imagenDestacadaUrl?: string;
  imagenDestacadaTextoAlt?: string;
  idsCategorias?: number[];
  imagenes?: ImagenFormulario[];
  detalles?: string[];
};

type Props = {
  unidad?: UnidadFormulario;
  marcas: MarcaOpcion[];
  categorias: CategoriaOpcion[];
};

const IMAGEN_VACIA: ImagenFormulario = { urlEscritorio: '', urlMobile: '', urlMini: '', textoAlt: '' };

const claseInput = 'w-full rounded-btn border border-slate-300 px-3 py-2 text-sm focus:border-marca-600 focus:outline-none';
const claseLabel = 'mb-1 block text-xs font-semibold text-slate-600';
const claseSeccion = 'rounded-card bg-white p-4 shadow-card';

export default function FormularioUnidad({ unidad, marcas, categorias }: Props) {
  const [estado, action, pendiente] = useActionState(guardarUnidad, null);
  const [imagenes, setImagenes] = useState<ImagenFormulario[]>(unidad?.imagenes ?? []);
  const [detalles, setDetalles] = useState<string[]>(unidad?.detalles ?? []);

  const actualizarImagen = (indice: number, campo: keyof ImagenFormulario, valor: string) => {
    setImagenes((previas) => previas.map((imagen, i) => (i === indice ? { ...imagen, [campo]: valor } : imagen)));
  };

  const actualizarDetalle = (indice: number, valor: string) => {
    setDetalles((previos) => previos.map((detalle, i) => (i === indice ? valor : detalle)));
  };

  return (
    <form action={action} className="space-y-4">
      {unidad?.id && <input type="hidden" name="id" value={unidad.id} />}
      <input type="hidden" name="imagenesJson" value={JSON.stringify(imagenes)} />
      <input type="hidden" name="detallesJson" value={JSON.stringify(detalles)} />

      {/* Datos generales */}
      <fieldset className={`${claseSeccion} space-y-3`}>
        <legend className="sr-only">Datos generales</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="titulo" className={claseLabel}>Título *</label>
            <input id="titulo" name="titulo" type="text" required defaultValue={unidad?.titulo} className={claseInput} placeholder="Ej: Tractor John Deere 6110J" />
          </div>
          <div>
            <label htmlFor="idMarca" className={claseLabel}>Marca *</label>
            <select id="idMarca" name="idMarca" required defaultValue={unidad?.idMarca ?? ''} className={claseInput}>
              <option value="" disabled>Seleccionar…</option>
              {marcas.map((marca) => (
                <option key={marca.id} value={marca.id}>{marca.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="modelo" className={claseLabel}>Modelo *</label>
            <input id="modelo" name="modelo" type="text" required defaultValue={unidad?.modelo} className={claseInput} placeholder="Ej: 6110J" />
          </div>
          <div>
            <label htmlFor="precioDolar" className={claseLabel}>Precio (US$, opcional)</label>
            <input id="precioDolar" name="precioDolar" type="number" min="0" step="1" defaultValue={unidad?.precioDolar ?? ''} className={claseInput} placeholder="Ej: 45000" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="descripcion" className={claseLabel}>Descripción</label>
            <textarea id="descripcion" name="descripcion" rows={4} defaultValue={unidad?.descripcion} className={claseInput} />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
          {[
            { nombre: 'nuevo', texto: 'Nueva', porDefecto: unidad?.nuevo },
            { nombre: 'activa', texto: 'Activa (visible en la tienda)', porDefecto: unidad ? unidad.activa : true },
            { nombre: 'esOportunidad', texto: 'Oportunidad', porDefecto: unidad?.esOportunidad },
            { nombre: 'esNovedad', texto: 'Novedad', porDefecto: unidad?.esNovedad },
            { nombre: 'vendida', texto: 'Vendida', porDefecto: unidad?.vendida },
          ].map((opcion) => (
            <label key={opcion.nombre} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name={opcion.nombre} defaultChecked={opcion.porDefecto} className="h-4 w-4 accent-marca-600" />
              {opcion.texto}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Imagen destacada */}
      <fieldset className={`${claseSeccion} space-y-3`}>
        <legend className="sr-only">Imagen destacada</legend>
        <h2 className="text-sm font-bold text-slate-900">Imagen destacada *</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="imagenDestacadaUrl" className={claseLabel}>URL (CDN)</label>
            <input id="imagenDestacadaUrl" name="imagenDestacadaUrl" type="url" required defaultValue={unidad?.imagenDestacadaUrl} className={claseInput} placeholder="https://tisolercdn…/destacada.webp" />
          </div>
          <div>
            <label htmlFor="imagenDestacadaTextoAlt" className={claseLabel}>Texto alt</label>
            <input id="imagenDestacadaTextoAlt" name="imagenDestacadaTextoAlt" type="text" required defaultValue={unidad?.imagenDestacadaTextoAlt} className={claseInput} />
          </div>
        </div>
      </fieldset>

      {/* Categorías */}
      <fieldset className={claseSeccion}>
        <legend className="sr-only">Categorías</legend>
        <h2 className="mb-3 text-sm font-bold text-slate-900">Categorías</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {categorias.map((categoria) => (
            <label key={categoria.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="idsCategorias"
                value={categoria.id}
                defaultChecked={unidad?.idsCategorias?.includes(categoria.id)}
                className="h-4 w-4 accent-marca-600"
              />
              {categoria.titulo}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Galería de imágenes */}
      <fieldset className={`${claseSeccion} space-y-3`}>
        <legend className="sr-only">Galería</legend>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Galería de imágenes</h2>
          <button
            type="button"
            onClick={() => setImagenes((previas) => [...previas, { ...IMAGEN_VACIA }])}
            className="rounded-btn border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            + Agregar imagen
          </button>
        </div>
        {imagenes.map((imagen, indice) => (
          <div key={indice} className="grid gap-2 rounded-btn border border-slate-200 p-3 sm:grid-cols-2">
            <input type="url" placeholder="URL desktop" value={imagen.urlEscritorio} onChange={(e) => actualizarImagen(indice, 'urlEscritorio', e.target.value)} className={claseInput} />
            <input type="url" placeholder="URL mobile" value={imagen.urlMobile} onChange={(e) => actualizarImagen(indice, 'urlMobile', e.target.value)} className={claseInput} />
            <input type="url" placeholder="URL miniatura" value={imagen.urlMini} onChange={(e) => actualizarImagen(indice, 'urlMini', e.target.value)} className={claseInput} />
            <div className="flex gap-2">
              <input type="text" placeholder="Texto alt" value={imagen.textoAlt} onChange={(e) => actualizarImagen(indice, 'textoAlt', e.target.value)} className={claseInput} />
              <button
                type="button"
                onClick={() => setImagenes((previas) => previas.filter((_, i) => i !== indice))}
                className="shrink-0 rounded-btn border border-red-200 px-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
        {!imagenes.length && <p className="text-xs text-slate-400">Sin imágenes adicionales: la tienda mostrará solo la destacada.</p>}
      </fieldset>

      {/* Detalles técnicos */}
      <fieldset className={`${claseSeccion} space-y-3`}>
        <legend className="sr-only">Detalles técnicos</legend>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Detalles técnicos</h2>
          <button
            type="button"
            onClick={() => setDetalles((previos) => [...previos, ''])}
            className="rounded-btn border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            + Agregar detalle
          </button>
        </div>
        {detalles.map((detalle, indice) => (
          <div key={indice} className="flex gap-2">
            <input
              type="text"
              value={detalle}
              onChange={(e) => actualizarDetalle(indice, e.target.value)}
              className={claseInput}
              placeholder="Ej: Potencia: 110 HP"
            />
            <button
              type="button"
              onClick={() => setDetalles((previos) => previos.filter((_, i) => i !== indice))}
              className="shrink-0 rounded-btn border border-red-200 px-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              Quitar
            </button>
          </div>
        ))}
      </fieldset>

      {estado?.error && <p className="rounded-btn bg-red-50 px-3 py-2 text-sm text-red-700">{estado.error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pendiente}
          className="rounded-btn bg-marca-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-marca-700 disabled:opacity-60"
        >
          {pendiente ? 'Guardando…' : unidad?.id ? 'Guardar cambios' : 'Crear unidad'}
        </button>
        <Link href="/unidades" className="rounded-btn border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
