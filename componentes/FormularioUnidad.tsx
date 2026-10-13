'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState } from 'react';
import { guardarUnidad } from '@/acciones/unidades';
import EditorEncuadre from '@/componentes/EditorEncuadre';
import {
  FOCO_CENTRO,
  FORMATOS,
  MAX_IMAGENES,
  procesarFoto,
  validarOriginal,
  type DerivadosFoto,
  type FocosFoto,
  type Variante,
} from '@/lib/procesarImagen';

type MarcaOpcion = { id: number; nombre: string };
type CategoriaOpcion = { id: number; titulo: string };

export type ImagenFormulario = {
  urlEscritorio: string;
  urlMobile: string;
  urlMini: string;
  textoAlt: string;
  orden?: number;
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
  monedaPrecio?: string;
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

type ItemGaleria = {
  clave: string;
  nuevo: boolean;
  // Conservada (ya está en el CDN)
  urlEscritorio?: string;
  urlMobile?: string;
  urlMini?: string;
  // Nueva (derivados webp ya procesados en el navegador)
  original?: File;
  vistaOriginal?: string;
  archivos?: DerivadosFoto;
  vistaEscritorio?: string;
  vistaMobile?: string;
  alt: string;
  focos: FocosFoto;
  procesando: boolean;
  error?: string;
};

const claseInput = 'w-full rounded-btn border border-slate-300 px-3 py-2 text-sm focus:border-marca-600 focus:outline-none';
const claseLabel = 'mb-1 block text-xs font-semibold text-slate-600';
const claseSeccion = 'rounded-card bg-white p-4 shadow-card';

const crearClave = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const focosCentro = (): FocosFoto => ({ escritorio: { ...FOCO_CENTRO }, mobile: { ...FOCO_CENTRO } });
const enKb = (bytes?: number) => (bytes == null ? '' : `${Math.max(1, Math.round(bytes / 1024))} KB`);

const liberarVistas = (item: ItemGaleria, conservarOriginal = false) => {
  const urls = conservarOriginal ? [item.vistaEscritorio, item.vistaMobile] : [item.vistaOriginal, item.vistaEscritorio, item.vistaMobile];
  for (const url of urls) {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
  }
};

// Revoca diferido: la vista anterior sigue visible hasta que la nueva termina
// de decodificar, evitando el parpadeo al reencuadrar.
const revocarPronto = (item: ItemGaleria) => {
  const urls = [item.vistaEscritorio, item.vistaMobile].filter((u): u is string => !!u?.startsWith('blob:'));
  if (!urls.length) return;
  window.setTimeout(() => {
    for (const url of urls) URL.revokeObjectURL(url);
  }, 1500);
};

const PESTANAS: { id: Variante; titulo: string }[] = [
  { id: 'escritorio', titulo: `Desktop · ${FORMATOS.escritorio.ancho}×${FORMATOS.escritorio.alto}` },
  { id: 'mobile', titulo: `Mobile · ${FORMATOS.mobile.ancho}×${FORMATOS.mobile.alto}` },
];

// Imagen final sin parpadeo: mantiene la vista anterior montada hasta que la
// nueva termina de decodificar, y recién ahí la reemplaza.
function ImagenFinal({ src, activo }: { src: string; activo?: boolean }) {
  const [visible, setVisible] = useState(src);
  useEffect(() => {
    if (src === visible) return;
    let viva = true;
    const precarga = new window.Image();
    precarga.src = src;
    precarga.onload = () => {
      if (viva) setVisible(src);
    };
    return () => {
      viva = false;
    };
  }, [src, visible]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={visible}
      alt=""
      className={`h-[205px] w-full rounded-btn border bg-slate-50 object-contain ${activo ? 'border-marca-600 shadow-[0_0_0_1px_#ea580c]' : 'border-slate-200'}`}
    />
  );
}

function TarjetaFoto({
  item,
  indice,
  esDestacada,
  total,
  onElegirDestacada,
  onMover,
  onQuitar,
  onAlt,
  onTerminarEncuadre,
}: {
  item: ItemGaleria;
  indice: number;
  esDestacada: boolean;
  total: number;
  onElegirDestacada: () => void;
  onMover: (direccion: -1 | 1) => void;
  onQuitar: () => void;
  onAlt: (valor: string) => void;
  onTerminarEncuadre: (formato: 'escritorio' | 'mobile', foco: { x: number; y: number }) => void;
}) {
  const [pestana, setPestana] = useState<Variante>('escritorio');
  const formato = FORMATOS[pestana];

  return (
    <div className={`rounded-btn border p-3 sm:p-4 ${esDestacada ? 'border-marca-600 bg-marca-50/40' : 'border-slate-200'}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-700">Foto {indice + 1}</span>
        <span className={`text-[11px] ${item.procesando ? 'text-slate-400' : 'select-none text-transparent'}`}>Actualizando vista…</span>
        <button
          type="button"
          onClick={onElegirDestacada}
          title="Usar como destacada"
          className={`rounded-btn px-2 py-0.5 text-xs font-bold transition-colors ${esDestacada ? 'bg-marca-600 text-white' : 'border border-slate-300 text-slate-500 hover:bg-slate-100'}`}
        >
          ★ Destacada
        </button>
        <span className="ml-auto flex gap-1">
                      <button type="button" onClick={() => onMover(-1)} disabled={indice <= 1} title={indice === 1 ? 'La destacada queda fija primera' : undefined} className="rounded-btn border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-40">↑</button>
                      <button type="button" onClick={() => onMover(1)} disabled={indice === 0 || indice === total - 1} title={indice === 0 ? 'La destacada queda fija primera' : undefined} className="rounded-btn border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-40">↓</button>
          <button
            type="button"
            onClick={onQuitar}
            className="rounded-btn border border-red-200 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Quitar
          </button>
        </span>
      </div>

      <div>
        <label className={claseLabel}>Texto alt *</label>
        <input
          type="text"
          value={item.alt}
          onChange={(e) => onAlt(e.target.value)}
          className={claseInput}
          placeholder="Ej: Tractor John Deere 6110J, vista lateral"
        />
      </div>

      {/* El editor queda montado mientras se reprocesa en segundo plano:
          desmontarlo colapsa el layout y recarga la foto (parpadeo). */}
      {item.nuevo && !item.error && item.vistaOriginal ? (
        <div className="space-y-2 mt-2">
          <div className="flex gap-1 rounded-btn bg-slate-100 p-1">
            {PESTANAS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPestana(p.id)}
                className={`flex-1 rounded px-2 py-1 text-xs font-semibold transition-colors ${pestana === p.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {p.titulo}
              </button>
            ))}
          </div>
          <EditorEncuadre
            src={item.vistaOriginal}
            ancho={formato.ancho}
            alto={formato.alto}
            foco={pestana === 'escritorio' ? item.focos.escritorio : item.focos.mobile}
            onTerminar={(focoFin) => onTerminarEncuadre(pestana === 'escritorio' ? 'escritorio' : 'mobile', focoFin)}
          />
          <p className="text-[11px] text-slate-500">
            Arrastrá el recuadro naranja para encuadrar. Lo nítido es lo que se guarda, lo borroso se recorta.
          </p>
        </div>
      ) : null}

      {/* Resultado final en proporciones reales (sin recorte): desktop y mobile
          centradas en la misma fila; se remarca la que se está editando arriba. */}
      <div className="mt-3 flex flex-wrap items-start justify-center gap-4">
        <div className="w-full max-w-[400px]">
          <div className="mb-1 flex items-baseline justify-between">
            <span className={claseLabel}>Desktop final · 640×490</span>
            {item.nuevo && item.archivos && <span className="text-[11px] text-slate-400">webp · {enKb(item.archivos.escritorio.size)}</span>}
          </div>
          {(item.nuevo ? item.vistaEscritorio : item.urlEscritorio) ? (
            <ImagenFinal
              src={(item.nuevo ? item.vistaEscritorio : item.urlEscritorio) ?? ''}
              activo={item.nuevo && pestana === 'escritorio'}
            />
          ) : (
            <div className="flex h-[205px] w-full items-center justify-center rounded-btn bg-slate-100 text-xs text-slate-400">
              {item.procesando ? 'Procesando…' : item.error ?? 'Sin vista'}
            </div>
          )}
        </div>
        <div className="w-[150px] shrink-0">
          <div className="mb-1 flex items-baseline justify-between">
            <span className={claseLabel}>Mobile final · 800×1000</span>
          </div>
          {(item.nuevo ? item.vistaMobile : item.urlMobile) ? (
            <ImagenFinal
              src={(item.nuevo ? item.vistaMobile : item.urlMobile) ?? ''}
              activo={item.nuevo && pestana === 'mobile'}
            />
          ) : (
            <div className="flex h-[205px] w-full items-center justify-center rounded-btn bg-slate-100 text-[11px] text-slate-400">…</div>
          )}
          {item.nuevo && item.archivos && <p className="mt-1 text-right text-[11px] text-slate-400">{enKb(item.archivos.mobile.size)}</p>}
        </div>
      </div>

      {!item.nuevo && (
        <p className="mt-2 text-[11px] text-slate-400">Foto actual del CDN. Para reencuadrarla, quitala y volvé a subirla.</p>
      )}
      {item.error && <p className="mt-2 text-xs text-red-600">{item.error}</p>}
    </div>
  );
}

export default function FormularioUnidad({ unidad, marcas, categorias }: Props) {
  const esEdicion = Boolean(unidad?.id);
  const [estado, action, pendiente] = useActionState(guardarUnidad, null);
  const [galeria, setGaleria] = useState<ItemGaleria[]>(() =>
    (unidad?.imagenes ?? []).map((imagen) => ({
      clave: crearClave(),
      nuevo: false,
      urlEscritorio: imagen.urlEscritorio,
      urlMobile: imagen.urlMobile,
      urlMini: imagen.urlMini,
      alt: imagen.textoAlt,
      focos: focosCentro(),
      procesando: false,
    }))
  );
  const [indiceDestacada, setIndiceDestacada] = useState(0);
  const [destacadaCambiada, setDestacadaCambiada] = useState(false);
  const [detalles, setDetalles] = useState<string[]>(unidad?.detalles ?? []);
  const [aviso, setAviso] = useState<string | null>(null);
  const entradaArchivos = useRef<HTMLInputElement>(null);
  const entradaDerivados = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<ItemGaleria[]>(galeria);
  useEffect(() => {
    galeriaRef.current = galeria;
  }, [galeria]);

  // Los derivados viajan como archivos del formulario (no se pueden poner en
  // hidden inputs): se sincronizan a un input file oculto vía DataTransfer.
  useEffect(() => {
    const transferencia = new DataTransfer();
    galeria.forEach((item, slot) => {
      if (!item.nuevo || item.procesando || !item.archivos) return;
      (Object.keys(item.archivos) as (keyof DerivadosFoto)[]).forEach((variante) => {
        const archivo = item.archivos?.[variante];
        if (archivo) {
          transferencia.items.add(new File([archivo], `${slot}-${variante}.webp`, { type: 'image/webp' }));
        }
      });
    });
    if (entradaDerivados.current) {
      entradaDerivados.current.files = transferencia.files;
    }
  }, [galeria]);

  // Reprocesa los derivados con focos explícitos (al soltar el recuadro).
  const reprocesar = async (clave: string, original: File, focos: FocosFoto) => {
    setGaleria((previos) => previos.map((i) => (i.clave === clave ? { ...i, focos, procesando: true } : i)));
    try {
      const derivados = await procesarFoto(original, focos, () => 'tmp.webp');
      const vistaEscritorio = URL.createObjectURL(derivados.escritorio);
      const vistaMobile = URL.createObjectURL(derivados.mobile);
      const previo = galeriaRef.current.find((i) => i.clave === clave);
      if (!previo) {
        URL.revokeObjectURL(vistaEscritorio);
        URL.revokeObjectURL(vistaMobile);
        return;
      }
      revocarPronto(previo);
      setGaleria((previos) =>
        previos.map((i) =>
          i.clave === clave
            ? { ...i, focos, archivos: derivados, vistaEscritorio, vistaMobile, procesando: false, error: undefined }
            : i
        )
      );
    } catch (error) {
      setGaleria((previos) =>
        previos.map((previo) =>
          previo.clave === clave
            ? { ...previo, procesando: false, error: error instanceof Error ? error.message : 'No se pudo procesar la imagen.' }
            : previo
        )
      );
    }
  };

  // Al soltar el recuadro: usa valores explícitos, sin depender del ref
  // (que aún tiene los focos anteriores al re-render).
  const alTerminarEncuadre = (clave: string, formato: 'escritorio' | 'mobile', foco: { x: number; y: number }) => {
    const item = galeriaRef.current.find((i) => i.clave === clave);
    if (!item?.original) return;
    void reprocesar(clave, item.original, { ...item.focos, [formato]: foco });
  };

  const agregarOriginales = async (lista: FileList | null) => {
    if (!lista?.length) return;
    setAviso(null);
    const archivos = Array.from(lista);
    if (entradaArchivos.current) entradaArchivos.current.value = '';
    const lugar = MAX_IMAGENES - galeria.length;
    if (lugar <= 0) {
      setAviso(`Máximo ${MAX_IMAGENES} imágenes por unidad.`);
      return;
    }
    if (archivos.length > lugar) {
      setAviso(`Solo se agregaron ${lugar}: máximo ${MAX_IMAGENES} imágenes por unidad.`);
    }
    for (const archivo of archivos.slice(0, lugar)) {
      const invalido = validarOriginal(archivo);
      const item: ItemGaleria = {
        clave: crearClave(),
        nuevo: true,
        original: archivo,
        vistaOriginal: invalido ? undefined : URL.createObjectURL(archivo),
        alt: '',
        focos: focosCentro(),
        procesando: !invalido,
        error: invalido ?? undefined,
      };
      setGaleria((previos) => [...previos, item]);
      if (!invalido) {
        void procesarFoto(archivo, item.focos, () => `tmp.webp`).then(
          (derivados) => {
            setGaleria((previos) =>
              previos.map((previo) =>
                previo.clave === item.clave
                  ? {
                    ...previo,
                    archivos: derivados,
                    vistaEscritorio: URL.createObjectURL(derivados.escritorio),
                    vistaMobile: URL.createObjectURL(derivados.mobile),
                    procesando: false,
                  }
                  : previo
              )
            );
          },
          (error: unknown) => {
            setGaleria((previos) =>
              previos.map((previo) =>
                previo.clave === item.clave
                  ? { ...previo, procesando: false, error: error instanceof Error ? error.message : 'No se pudo procesar la imagen.' }
                  : previo
              )
            );
          }
        );
      }
    }
  };

  const mover = (indice: number, direccion: -1 | 1) => {
    const destino = indice + direccion;
    if (destino < 0 || destino >= galeria.length) return;
    if (indice === 0 || destino === 0) return; // la destacada queda fija primera
    setGaleria((previos) => {
      const copia = [...previos];
      [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
      return copia;
    });
  };

  const quitar = (indice: number) => {
    setGaleria((previos) => {
      const item = previos[indice];
      if (item) liberarVistas(item);
      return previos.filter((_, i) => i !== indice);
    });
    if (indice === 0) {
      // Si se quita la destacada, la nueva primera pasa a serlo
      setDestacadaCambiada(true);
    }
    setIndiceDestacada(0);
  };

  // La destacada va siempre primera: al marcarla se mueve al inicio.
  // Así lo que muestra el formulario coincide con lo guardado y con la tienda.
  const elegirDestacada = (indice: number) => {
    setGaleria((previos) => {
      if (indice <= 0 || indice >= previos.length) return previos;
      const copia = [...previos];
      const [item] = copia.splice(indice, 1);
      copia.unshift(item);
      return copia;
    });
    setIndiceDestacada(0);
    setDestacadaCambiada(true);
  };

  const actualizarDetalle = (indice: number, valor: string) => {
    setDetalles((previos) => previos.map((detalle, i) => (i === indice ? valor : detalle)));
  };

  const faltanAlt = galeria.some((item) => !item.alt.trim());
  const hayProcesando = galeria.some((item) => item.procesando);
  const puedeGuardar = !pendiente && galeria.length > 0 && !hayProcesando && !faltanAlt;

  const galeriaJson = JSON.stringify(
    galeria.map((item) =>
      item.nuevo
        ? { alt: item.alt.trim(), nuevo: true }
        : {
          alt: item.alt.trim(),
          nuevo: false,
          urlEscritorio: item.urlEscritorio,
          urlMobile: item.urlMobile,
          urlMini: item.urlMini,
        }
    )
  );

  return (
    <form action={action} className="space-y-4">
      {unidad?.id && <input type="hidden" name="id" value={unidad.id} />}
      <input ref={entradaDerivados} type="file" name="derivados" multiple className="hidden" tabIndex={-1} aria-hidden />
      <input type="hidden" name="galeriaJson" value={galeriaJson} />
      <input type="hidden" name="indiceDestacada" value={indiceDestacada} />
      <input type="hidden" name="destacadaCambiada" value={esEdicion && !destacadaCambiada ? '0' : '1'} />
      {esEdicion && (
        <>
          <input type="hidden" name="imagenDestacadaUrl" value={unidad?.imagenDestacadaUrl ?? ''} />
          <input type="hidden" name="imagenDestacadaTextoAlt" value={unidad?.imagenDestacadaTextoAlt ?? ''} />
        </>
      )}
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
            <label htmlFor="precioDolar" className={claseLabel}>Precio (opcional)</label>
            <div className="flex gap-2">
              <input id="precioDolar" name="precioDolar" type="number" min="0" step="1" defaultValue={unidad?.precioDolar ?? ''} className={claseInput} placeholder="Ej: 45000" />
            </div>
            <div className="mt-2 flex gap-4">
              {[
                { valor: 'USD', texto: 'USD (dólares)' },
                { valor: 'ARS', texto: '$ (pesos)' },
              ].map((opcion) => (
                <label key={opcion.valor} className="flex items-center gap-1.5 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="monedaPrecio"
                    value={opcion.valor}
                    defaultChecked={(unidad?.monedaPrecio ?? 'USD') === opcion.valor}
                    className="h-4 w-4 accent-marca-600"
                  />
                  {opcion.texto}
                </label>
              ))}
            </div>
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Fotos de la unidad ({galeria.length}/{MAX_IMAGENES}) *</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              La foto marcada con ★ va siempre primera y es la destacada: se usa en carruseles, buscador y primera en el detalle.
              Al guardar se generan los formatos desktop, mobile y miniatura en webp.
            </p>
          </div>
          <label className={`cursor-pointer rounded-btn px-3 py-1.5 text-xs font-medium transition-colors ${galeria.length >= MAX_IMAGENES ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'border border-slate-300 text-slate-600 hover:bg-slate-100'}`}>
            + Subir fotos
            <input
              ref={entradaArchivos}
              type="file"
              accept="image/*"
              multiple
              disabled={galeria.length >= MAX_IMAGENES}
              onChange={(e) => void agregarOriginales(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
        {aviso && <p className="rounded-btn bg-amber-50 px-3 py-2 text-xs text-amber-800">{aviso}</p>}
        <div className="space-y-3">
          {galeria.map((item, indice) => (
            <TarjetaFoto
              key={item.clave}
              item={item}
              indice={indice}
              total={galeria.length}
              esDestacada={indice === indiceDestacada}
              onElegirDestacada={() => elegirDestacada(indice)}
              onMover={(direccion) => mover(indice, direccion)}
              onQuitar={() => quitar(indice)}
              onAlt={(valor) =>
                setGaleria((previos) => previos.map((previo) => (previo.clave === item.clave ? { ...previo, alt: valor } : previo)))
              }
              onTerminarEncuadre={(formato, focoFin) => alTerminarEncuadre(item.clave, formato, focoFin)}
            />
          ))}
        </div>
        {!galeria.length && <p className="text-xs text-slate-400">Subí al menos 1 foto: la primera (o la marcada ★) será la destacada.</p>}
        {faltanAlt && galeria.length > 0 && <p className="text-xs text-amber-700">Completá el texto alt de todas las fotos para poder guardar.</p>}
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
          disabled={!puedeGuardar}
          title={!puedeGuardar ? 'Subí al menos 1 foto y completá los textos alt' : undefined}
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
