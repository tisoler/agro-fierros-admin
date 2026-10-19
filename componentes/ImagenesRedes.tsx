'use client';

import { useRef, useState } from 'react';
import { generarSlug } from '@/lib/utilidades';
import type { ItemGaleria } from '@/componentes/FormularioUnidad';

// Generador de imágenes para redes (Instagram 1080x1080, Facebook/historia
// según formato) a partir de la foto destacada (siempre la primera).
// Dibuja en canvas en el navegador: sale idéntica siempre, sin servidor.

const SLATE = '#1E293B';
const NARANJA = '#EA580C';
const GRIS_CLARO = '#CBD5E1';
const GRIS_TENUE = '#94A3B8';
const FUENTE = 'Helvetica, Arial, sans-serif';
const URL_LOGO = '/logos/agrofierros-horizontal.png';

type DatosAviso = {
  titulo: string;
  lineaMeta: string;
  lineaPrecio: string | null;
  etiqueta: string | null;
  etiquetaRoja: boolean;
  foto: string;
  focoY: number;
  baseNombre: string;
};

const leerTexto = (id: string) =>
  (document.getElementById(id) as HTMLInputElement | null)?.value?.trim() ?? '';
const leerCheck = (nombre: string) =>
  (document.querySelector(`input[name="${nombre}"]`) as HTMLInputElement | null)?.checked ?? false;
const leerRadio = (nombre: string) =>
  (document.querySelector(`input[name="${nombre}"]:checked`) as HTMLInputElement | null)?.value ?? 'USD';

const formatearMonto = (n: number) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(n);

const cargarImagen = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });

const dibujarCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number,
  focoY = 0.45
) => {
  const escala = Math.max(dw / img.naturalWidth, dh / img.naturalHeight);
  const recW = dw / escala;
  const recH = dh / escala;
  const sx = (img.naturalWidth - recW) / 2;
  const sy = (img.naturalHeight - recH) * focoY;
  ctx.drawImage(img, sx, sy, recW, recH, dx, dy, dw, dh);
};

// Envuelve en hasta 2 líneas que entren en maxAncho, achicando si hace falta.
const envolver = (ctx: CanvasRenderingContext2D, texto: string, maxAncho: number, base: number, min: number) => {
  let size = base;
  let lineas: string[] = [texto];
  while (size > min) {
    ctx.font = `bold ${size}px ${FUENTE}`;
    const palabras = texto.split(/\s+/);
    lineas = [];
    let actual = '';
    for (const palabra of palabras) {
      const prueba = actual ? `${actual} ${palabra}` : palabra;
      if (ctx.measureText(prueba).width <= maxAncho || !actual) {
        actual = prueba;
      } else {
        lineas.push(actual);
        actual = palabra;
      }
    }
    if (actual) lineas.push(actual);
    if (lineas.length <= 2 && lineas.every((l) => ctx.measureText(l).width <= maxAncho)) {
      return { lineas: lineas.slice(0, 2), size };
    }
    size -= 4;
  }
  ctx.font = `bold ${size}px ${FUENTE}`;
  return { lineas: lineas.slice(0, 2), size };
};

// Balancea el título en 2 líneas (primera blanca, segunda naranja).
const partirTitulo = (ctx: CanvasRenderingContext2D, titulo: string, maxAncho: number, base: number) => {
  const palabras = titulo.split(/\s+/);
  if (palabras.length < 2) return envolver(ctx, titulo, maxAncho, base, 40);
  ctx.font = `bold ${base}px ${FUENTE}`;
  let mejor = 1;
  let mejorDiff = Infinity;
  for (let i = 1; i < palabras.length; i++) {
    const a = palabras.slice(0, i).join(' ');
    const b = palabras.slice(i).join(' ');
    if (ctx.measureText(a).width > maxAncho || ctx.measureText(b).width > maxAncho) continue;
    const diff = Math.abs(a.length - b.length);
    if (diff < mejorDiff) {
      mejorDiff = diff;
      mejor = i;
    }
  }
  const candidatas = [palabras.slice(0, mejor).join(' '), palabras.slice(mejor).join(' ')];
  if (mejorDiff === Infinity) return envolver(ctx, titulo, maxAncho, base, 40);
  return { lineas: candidatas, size: base };
};

const dibujarPlaca = async (
  canvas: HTMLCanvasElement,
  datos: DatosAviso,
  logo: HTMLImageElement,
  formato: 'post' | 'historia'
) => {
  const esPost = formato === 'post';
  const W = 1080;
  const H = esPost ? 1080 : 1920;
  const FH = esPost ? 640 : 1150;
  const PH = H - FH;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');
  await document.fonts.ready;

  const foto = await cargarImagen(datos.foto);
  const m = esPost
    ? datos.lineaPrecio
      // Con precio entra todo compactando un poco (título 68, meta 32, precio 42, dominio 24)
      ? { titulo: 68, meta: 32, precio: 42, dominio: 24, logoW: 300, pill: { x: 60, y: 32, w: 360, h: 80, r: 20 }, badge: { x: 880, y: 40, w: 140, h: 46, r: 23, f: 28 }, baseY: 195, inter: 72, metaY: 320, precioY: 368, domY: H - 32 }
      : { titulo: 72, meta: 36, precio: 46, dominio: 30, logoW: 300, pill: { x: 60, y: 32, w: 360, h: 80, r: 20 }, badge: { x: 880, y: 40, w: 140, h: 46, r: 23, f: 28 }, baseY: 215, inter: 75, metaY: 350, precioY: 410, domY: H - 40 }
    : { titulo: 72, meta: 42, precio: 52, dominio: 38, logoW: 420, pill: { x: 80, y: 90, w: 500, h: 164, r: 32 }, badge: { x: 770, y: 90, w: 230, h: 66, r: 33, f: 36 }, baseY: 420, inter: 92, metaY: 585, precioY: 655, domY: H - 60 };
  const logoH = Math.round((m.logoW * logo.naturalHeight) / logo.naturalWidth);

  // Fondo + foto + divisor
  ctx.fillStyle = SLATE;
  ctx.fillRect(0, 0, W, H);
  dibujarCover(ctx, foto, 0, 0, W, FH, datos.focoY);
  ctx.fillStyle = NARANJA;
  ctx.fillRect(0, FH, W, esPost ? 10 : 12);

  // Pastilla logo
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(m.pill.x, FH + m.pill.y, m.pill.w, m.pill.h, m.pill.r);
  ctx.fill();
  ctx.drawImage(logo, m.pill.x + (m.pill.w - m.logoW) / 2, FH + m.pill.y + (m.pill.h - logoH) / 2, m.logoW, logoH);

  // Badge
  if (datos.etiqueta) {
    ctx.fillStyle = datos.etiquetaRoja ? '#DC2626' : NARANJA;
    ctx.beginPath();
    ctx.roundRect(m.badge.x, FH + m.badge.y, m.badge.w, m.badge.h, m.badge.r);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${m.badge.f}px ${FUENTE}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(datos.etiqueta, m.badge.x + m.badge.w / 2, FH + m.badge.y + m.badge.h / 2 + 1);
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }

  // Título en 2 líneas (blanca + naranja)
  const { lineas } = partirTitulo(ctx, datos.titulo, W - 120, m.titulo);
  ctx.font = `bold ${m.titulo}px ${FUENTE}`;
  // Re-ajusta si alguna línea excede
  let size = m.titulo;
  while (size > 40 && lineas.some((l) => ctx.measureText(l).width > W - 120)) {
    size -= 4;
    ctx.font = `bold ${size}px ${FUENTE}`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillText(lineas[0] ?? '', 60, FH + m.baseY);
  if (lineas[1]) {
    ctx.fillStyle = NARANJA;
    ctx.fillText(lineas[1], 60, FH + m.baseY + m.inter);
  }

  // Meta + precio + dominio
  ctx.fillStyle = GRIS_CLARO;
  ctx.font = `${m.meta}px ${FUENTE}`;
  ctx.fillText(datos.lineaMeta, 60, FH + m.metaY);
  if (datos.lineaPrecio) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${m.precio}px ${FUENTE}`;
    ctx.fillText(datos.lineaPrecio, 60, FH + m.precioY);
  }
  ctx.fillStyle = GRIS_TENUE;
  ctx.font = `${m.dominio}px ${FUENTE}`;
  ctx.fillText('agrofierros.com.ar', 60, m.domY);
};

export default function ImagenesRedes({ galeria, idUnidad }: { galeria: ItemGaleria[]; idUnidad?: number }) {
  const refPost = useRef<HTMLCanvasElement>(null);
  const refHistoria = useRef<HTMLCanvasElement>(null);
  const [generada, setGenerada] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primera = galeria[0];
  const fotoBase = primera
    ? primera.nuevo
      ? primera.vistaEscritorio
      : primera.urlEscritorio
    : undefined;

  const leerDatos = (): DatosAviso | null => {
    if (!fotoBase) return null;
    const titulo = leerTexto('titulo') || 'Unidad AgroFierros';
    const marcaSel = document.getElementById('idMarca') as HTMLSelectElement | null;
    const marca = marcaSel?.selectedOptions?.[0]?.textContent?.trim() || '';
    const modelo = leerTexto('modelo');
    const nuevo = leerCheck('nuevo');
    const vendida = leerCheck('vendida');
    const precioCrudo = leerTexto('precioDolar');
    const precio = precioCrudo ? Math.round(Number(precioCrudo)) : null;
    const moneda = leerRadio('monedaPrecio');
    const etiqueta = vendida ? 'Vendida' : nuevo ? 'Nuevo' : 'Usado';
    return {
      titulo,
      lineaMeta: [marca, modelo ? `Modelo ${modelo}` : '', nuevo ? 'Nuevo' : 'Usado'].filter(Boolean).join(' · '),
      lineaPrecio:
        precio != null && !Number.isNaN(precio) && precio > 0
          ? `${moneda === 'ARS' ? '$' : 'USD'} ${formatearMonto(precio)}`
          : null,
      etiqueta,
      etiquetaRoja: vendida,
      foto: fotoBase.startsWith('blob:') ? fotoBase : `/api/foto?url=${encodeURIComponent(fotoBase)}`,
      focoY: primera?.nuevo ? (primera.focos?.escritorio?.y ?? 0.45) : 0.45,
      baseNombre: `agrofierros-${generarSlug(titulo) || `unidad-${idUnidad ?? 'nueva'}`}`,
    };
  };

  const generar = async () => {
    setError(null);
    setGenerando(true);
    try {
      const datos = leerDatos();
      if (!datos || !refPost.current || !refHistoria.current) return;
      const logo = await cargarImagen(URL_LOGO);
      await dibujarPlaca(refPost.current, datos, logo, 'post');
      await dibujarPlaca(refHistoria.current, datos, logo, 'historia');
      setGenerada(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron generar las imágenes.');
    } finally {
      setGenerando(false);
    }
  };

  const descargar = async (formato: 'post' | 'historia') => {
    await generar();
    const canvas = formato === 'post' ? refPost.current : refHistoria.current;
    const datos = leerDatos();
    if (!canvas || !datos) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${datos.baseNombre}-${formato}.jpg`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, 'image/jpeg', 0.85);
  };

  if (!primera || !fotoBase) return null;

  return (
    <fieldset className="rounded-card bg-white p-4 shadow-card">
      <legend className="sr-only">Imágenes para redes</legend>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Imágenes para redes</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Se generan desde la foto destacada (la primera). Si cambiás título, precio o fotos, actualizá la vista previa.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generar()}
          disabled={generando}
          className="rounded-btn border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40"
        >
          {generando ? 'Generando…' : generada ? 'Actualizar vista previa' : 'Generar vista previa'}
        </button>
      </div>
      {error && <p className="mb-2 rounded-btn bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-600">Post · 1080×1080 (feed)</p>
          <canvas ref={refPost} className="w-full rounded-btn border border-slate-200" />
          <button
            type="button"
            onClick={() => void descargar('post')}
            disabled={generando}
            className="mt-2 w-full rounded-btn bg-marca-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-marca-700 disabled:opacity-40"
          >
            Descargar post
          </button>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold text-slate-600">Historia · 1080×1920</p>
          <canvas ref={refHistoria} className="mx-auto w-full max-w-[220px] rounded-btn border border-slate-200" />
          <button
            type="button"
            onClick={() => void descargar('historia')}
            disabled={generando}
            className="mt-2 w-full rounded-btn bg-marca-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-marca-700 disabled:opacity-40"
          >
            Descargar historia
          </button>
        </div>
      </div>
    </fieldset>
  );
}
