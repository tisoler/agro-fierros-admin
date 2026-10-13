'use server';

import { requiereSesion } from '@/lib/sesion';
import { revalidarTienda } from '@/lib/revalidar';
import { generarSlug } from '@/lib/utilidades';
import DataBaseConnection from '@/lib/sequelize';
import { initUnidad, Unidad } from '@/modelos/unidad';
import { UnidadImagen } from '@/modelos/unidadImagen';
import { UnidadDetalle } from '@/modelos/unidadDetalle';
import {
  CACHE_DESTACADA,
  claveImagen,
  eliminarImagenes,
  esWebp,
  listarNumeradas,
  subirImagen,
  urlCdn,
} from '@/lib/espacios';
import { generarDestacada } from '@/lib/destacada';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const MAX_IMAGENES = 7;
const MAX_DERIVADO_BYTES = 2 * 1024 * 1024;

type ItemGaleria = {
  alt: string;
  nuevo: boolean;
  urlEscritorio?: string;
  urlMobile?: string;
  urlMini?: string;
};

type ResultadoGuardado = { error: string } | null;

const nombreArchivo = (numero: number, variante: string) =>
  variante === 'escritorio' ? `${numero}.webp` : `${numero}-${variante}.webp`;

// Número posicional (1..N) a partir de una URL del tipo .../{slug}/{n}.webp.
// Devuelve null para URLs legacy con otro formato (se conservan tal cual).
const numeroDesdeUrl = (url: string): number | null => {
  const coincidencia = url.match(/\/(\d+)\.webp(?:[?#].*)?$/);
  return coincidencia ? Number(coincidencia[1]) : null;
};

const leerBytesArchivo = async (archivo: File, descripcion: string): Promise<Uint8Array> => {
  const bytes = new Uint8Array(await archivo.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_DERIVADO_BYTES) {
    throw new Error(`El archivo ${descripcion} es inválido o demasiado pesado.`);
  }
  if (!esWebp(bytes)) {
    throw new Error(`El archivo ${descripcion} no es webp válido.`);
  }
  return bytes;
};

const descargarBytes = async (url: string, descripcion: string): Promise<Uint8Array> => {
  const respuesta = await fetch(url, { cache: 'no-store' });
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer ${descripcion} desde el CDN.`);
  }
  const bytes = new Uint8Array(await respuesta.arrayBuffer());
  if (!bytes.length || bytes.length > 8 * 1024 * 1024) {
    throw new Error(`${descripcion} es inválida o demasiado pesada.`);
  }
  return bytes;
};

// Alta o edición de unidad. La galería llega como JSON en orden de visualización;
// los archivos ya procesados (webp) viajan como `derivados` con nombre
// `{slot}-{variante}.webp` (slot = índice en la galería, variante = escritorio|mobile|mini).
export const guardarUnidad = async (_estadoPrevio: ResultadoGuardado, formData: FormData): Promise<ResultadoGuardado> => {
  await requiereSesion();

  const id = formData.get('id') ? Number(formData.get('id')) : null;
  const titulo = String(formData.get('titulo') ?? '').trim();
  const descripcion = String(formData.get('descripcion') ?? '').trim();
  const modelo = String(formData.get('modelo') ?? '').trim();
  const idMarca = Number(formData.get('idMarca') ?? 0);
  const nuevo = formData.get('nuevo') === 'on';
  const esOportunidad = formData.get('esOportunidad') === 'on';
  const esNovedad = formData.get('esNovedad') === 'on';
  const activa = formData.get('activa') === 'on';
  const vendida = formData.get('vendida') === 'on';
  const precioDolarCrudo = String(formData.get('precioDolar') ?? '').trim();
  const precioDolar = precioDolarCrudo ? Math.round(Number(precioDolarCrudo)) : null;
  const monedaPrecio = formData.get('monedaPrecio') === 'ARS' ? 'ARS' : 'USD';
  const idsCategorias = formData.getAll('idsCategorias').map((valor) => Number(valor)).filter((valor) => !Number.isNaN(valor));
  const destacadaUrlActual = String(formData.get('imagenDestacadaUrl') ?? '').trim();
  const destacadaAltActual = String(formData.get('imagenDestacadaTextoAlt') ?? '').trim();
  const indiceDestacada = Number(formData.get('indiceDestacada') ?? 0);
  const destacadaCambiada = formData.get('destacadaCambiada') === '1';

  let galeria: ItemGaleria[] = [];
  let detalles: string[] = [];
  try {
    galeria = JSON.parse(String(formData.get('galeriaJson') ?? '[]'));
    detalles = JSON.parse(String(formData.get('detallesJson') ?? '[]'));
  } catch {
    return { error: 'Formato inválido de imágenes o detalles técnicos.' };
  }

  if (!titulo || !modelo || !idMarca) {
    return { error: 'Título, modelo y marca son obligatorios.' };
  }
  if (precioDolarCrudo && (precioDolar === null || Number.isNaN(precioDolar) || precioDolar < 0)) {
    return { error: 'El precio debe ser un número positivo.' };
  }
  if (!Array.isArray(galeria) || !galeria.length || galeria.length > MAX_IMAGENES) {
    return { error: `La unidad debe tener entre 1 y ${MAX_IMAGENES} imágenes.` };
  }
  if (!Number.isInteger(indiceDestacada) || indiceDestacada < 0 || indiceDestacada >= galeria.length) {
    return { error: 'La imagen destacada elegida no es válida.' };
  }
  for (const item of galeria) {
    if (!item || typeof item.alt !== 'string' || !item.alt.trim()) {
      return { error: 'Todas las imágenes necesitan texto alternativo.' };
    }
    if (!item.nuevo && (!item.urlEscritorio || !item.urlMobile || !item.urlMini)) {
      return { error: 'Hay imágenes conservadas con datos incompletos.' };
    }
  }

  await initUnidad();
  const sequelize = await DataBaseConnection.getSequelizeInstance();
  console.log(
    `[guardarUnidad] id=${id ?? 'nueva'} galeria=[${galeria.map((g, i) => `${i}:${g.nuevo ? 'nueva' : (numeroDesdeUrl(g.urlEscritorio ?? '') ?? '?')}`).join(',')}] destacada=${indiceDestacada} cambiada=${destacadaCambiada} derivados=${formData.getAll('derivados').filter((v) => v instanceof File).length}`
  );

  // Slug: se genera en alta; en edición se conserva el existente.
  let slug: string;
  try {
    if (id) {
      const existente = await Unidad.findByPk(id, { attributes: ['id', 'slug'] });
      if (!existente) return { error: 'La unidad no existe.' };
      slug = existente.slug;
    } else {
      slug = generarSlug(titulo);
      if (!slug) return { error: 'No se pudo generar el slug desde el título.' };
      const existeSlug = await Unidad.findOne({ where: { slug }, attributes: ['id'] });
      if (existeSlug) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }
    }
  } catch (error) {
    console.error('Error resolviendo el slug:', error);
    return { error: 'No se pudo guardar la unidad. Revisá los datos e intentá de nuevo.' };
  }

  const derivados = formData.getAll('derivados').filter((v): v is File => v instanceof File);

  // Subida / reordenamiento en el Space antes de tocar la base.
  let imagenDestacadaUrl = destacadaUrlActual;
  let imagenDestacadaTextoAlt = destacadaAltActual;
  let filasImagenes: { urlEscritorio: string; urlMobile: string; urlMini: string; textoAlt: string; orden: number }[];
  try {
    filasImagenes = await sincronizarEspacio({ slug, galeria, indiceDestacada, destacadaCambiada, derivados, esAlta: !id });
    if (destacadaCambiada || !id) {
      const elegida = galeria[indiceDestacada];
      imagenDestacadaTextoAlt = elegida.alt.trim();
      imagenDestacadaUrl = urlCdn(claveImagen(slug, 'destacado.webp'));
    }
    if (!imagenDestacadaUrl || !imagenDestacadaTextoAlt) {
      return { error: 'La imagen destacada (URL y alt) es obligatoria.' };
    }
  } catch (error) {
    console.error('Error subiendo imágenes al CDN:', error);
    const mensaje = error instanceof Error ? error.message : 'No se pudieron subir las imágenes.';
    return { error: mensaje };
  }

  try {
    await sequelize.transaction(async (t) => {
      let unidad: Unidad;

      if (id) {
        const existente = await Unidad.findByPk(id, { transaction: t });
        if (!existente) {
          throw new Error('La unidad no existe.');
        }
        await existente.update(
          { titulo, descripcion, modelo, idMarca, nuevo, esOportunidad, esNovedad, activa, vendida, imagenDestacadaUrl, imagenDestacadaTextoAlt, precioDolar, monedaPrecio },
          { transaction: t }
        );
        unidad = existente;
      } else {
        unidad = await Unidad.create(
          { titulo, descripcion, modelo, idMarca, nuevo, esOportunidad, esNovedad, activa, vendida, imagenDestacadaUrl, imagenDestacadaTextoAlt, precioDolar, monedaPrecio, slug },
          { transaction: t }
        );
      }

      // Categorías (N—M vía unidadCategorias)
      const conCategorias = unidad as Unidad & { setCategorias: (ids: number[], opciones?: { transaction: unknown }) => Promise<unknown> };
      await conCategorias.setCategorias(idsCategorias, { transaction: t });

      // Imágenes: se reemplazan todas, en el orden elegido (0 = destacada)
      await UnidadImagen.destroy({ where: { idUnidad: unidad.id }, transaction: t });
      await UnidadImagen.bulkCreate(
        filasImagenes.map((fila) => ({ ...fila, idUnidad: unidad.id })),
        { transaction: t }
      );
      console.log(`[guardarUnidad] unidad ${unidad.id} (${slug}): ${filasImagenes.length} imágenes orden=[${filasImagenes.map((f) => f.orden).join(',')}] destacada=${imagenDestacadaUrl}`);

      // Detalles técnicos: se reemplazan todos
      await UnidadDetalle.destroy({ where: { idUnidad: unidad.id }, transaction: t });
      const detallesValidos = detalles.map((detalle) => String(detalle).trim()).filter(Boolean);
      if (detallesValidos.length) {
        await UnidadDetalle.bulkCreate(
          detallesValidos.map((detalle) => ({ detalle, idUnidad: unidad.id })),
          { transaction: t }
        );
      }
    });
  } catch (error) {
    console.error('Error guardando la unidad:', error);
    return { error: 'No se pudo guardar la unidad. Revisá los datos e intentá de nuevo.' };
  }

  await revalidarTienda(['unidades', 'categorias']);
  revalidatePath('/unidades');
  redirect('/unidades');
};

type SincronizarParams = {
  slug: string;
  galeria: ItemGaleria[];
  indiceDestacada: number;
  destacadaCambiada: boolean;
  derivados: File[];
  esAlta: boolean;
};

// Sube los archivos nuevos, regenera destacado.webp y devuelve las filas
// listas para guardar (con orden).
// Los archivos conservados NO se tocan: cada foto mantiene su nombre para
// siempre. Así el orden se ve igual en el formulario y en la base, el
// reordenado no copia nada (rápido) y no se reutilizan nombres —importante
// porque los derivados llevan caché inmutable de 1 año.
const sincronizarEspacio = async ({ slug, galeria, indiceDestacada, destacadaCambiada, derivados, esAlta }: SincronizarParams) => {
  const porNombre = new Map(derivados.map((archivo) => [archivo.name, archivo]));
  const filas: { urlEscritorio: string; urlMobile: string; urlMini: string; textoAlt: string; orden: number }[] = [];
  let bytesDestacada: Uint8Array | null = null;

  // Números ocupados (URLs + huérfanos del Space): no se reutilizan.
  const ocupados = new Set<number>();
  for (const item of galeria) {
    if (!item.nuevo) {
      for (const url of [item.urlEscritorio, item.urlMobile, item.urlMini]) {
        const n = url ? numeroDesdeUrl(url) : null;
        if (n !== null) ocupados.add(n);
      }
    }
  }
  const existentes = await listarNumeradas(slug);
  for (const e of existentes) ocupados.add(e.numero);
  let proximo = ocupados.size ? Math.max(...ocupados) + 1 : 1;

  const referenciadas = new Set<string>();
  const referenciar = (url: string) => {
    try {
      referenciadas.add(new URL(url).pathname.replace(/^\//, ''));
    } catch {
      /* URL legacy no parseable: no participa de la limpieza */
    }
  };

  for (let indice = 0; indice < galeria.length; indice++) {
    const item = galeria[indice];
    const alt = item.alt.trim();
    let urlEscritorio = item.urlEscritorio ?? '';
    let urlMobile = item.urlMobile ?? '';
    let urlMini = item.urlMini ?? '';

    if (item.nuevo) {
      const numero = proximo++;
      const variantes: Record<'escritorio' | 'mobile' | 'mini', string> = {
        escritorio: nombreArchivo(numero, 'escritorio'),
        mobile: nombreArchivo(numero, 'mobile'),
        mini: nombreArchivo(numero, 'mini'),
      };
      const bytes: Record<string, Uint8Array> = {};
      for (const [variante, nombre] of Object.entries(variantes)) {
        const archivo = porNombre.get(`${indice}-${variante}.webp`);
        if (!archivo) {
          throw new Error(`Falta el archivo ${variante} de la imagen ${numero}.`);
        }
        bytes[variante] = await leerBytesArchivo(archivo, `${variante} de la imagen ${numero}`);
      }
      await Promise.all(
        Object.entries(variantes).map(([variante, nombre]) =>
          subirImagen(claveImagen(slug, nombre), bytes[variante])
        )
      );
      urlEscritorio = urlCdn(claveImagen(slug, variantes.escritorio));
      urlMobile = urlCdn(claveImagen(slug, variantes.mobile));
      urlMini = urlCdn(claveImagen(slug, variantes.mini));
      if (indice === indiceDestacada && (destacadaCambiada || esAlta)) {
        bytesDestacada = bytes.escritorio;
      }
    } else if (indice === indiceDestacada && (destacadaCambiada || esAlta)) {
      bytesDestacada = await descargarBytes(urlEscritorio, `la imagen destacada (${indice + 1})`);
    }

    referenciar(urlEscritorio);
    referenciar(urlMobile);
    referenciar(urlMini);
    filas.push({ urlEscritorio, urlMobile, urlMini, textoAlt: alt, orden: indice });
  }

  // Destacada: se regenera en su medida de cards desde la elegida, con caché corto.
  if (bytesDestacada) {
    const derivado = await generarDestacada(bytesDestacada);
    await subirImagen(claveImagen(slug, 'destacado.webp'), derivado, 'image/webp', CACHE_DESTACADA);
  }

  // Limpieza: numeradas que ya no referencia ninguna fila (fotos quitadas).
  const sobrantes = existentes.filter((e) => !referenciadas.has(e.clave)).map((e) => e.clave);
  await eliminarImagenes(sobrantes);

  return filas;
};

// Guarda el orden manual de un carrusel de unidades (oportunidades/novedades).
// Los ids llegan en el orden elegido (posición 0 = primera tarjeta).
export const guardarOrdenCarrusel = async (
  seccion: 'oportunidad' | 'novedad',
  ids: number[]
): Promise<{ error?: string }> => {
  await requiereSesion();
  if (!Array.isArray(ids) || !ids.length || ids.some((id) => !Number.isInteger(Number(id)))) {
    return { error: 'La lista de unidades no es válida.' };
  }
  const columna = seccion === 'oportunidad' ? 'ordenOportunidad' : 'ordenNovedad';
  const flag = seccion === 'oportunidad' ? 'esOportunidad' : 'esNovedad';

  await initUnidad();
  const sequelize = await DataBaseConnection.getSequelizeInstance();
  try {
    await sequelize.transaction(async (t) => {
      for (let i = 0; i < ids.length; i++) {
        await Unidad.update({ [columna]: i }, { where: { id: Number(ids[i]), [flag]: true }, transaction: t });
      }
    });
  } catch (error) {
    console.error('Error guardando el orden del carrusel:', error);
    return { error: 'No se pudo guardar el orden. Intentá de nuevo.' };
  }

  await revalidarTienda(['unidades']);
  revalidatePath('/carruseles-unidades');
  return {};
};

// Toggle de flags desde el listado: activa, esOportunidad, esNovedad, vendida.
export const cambiarFlagUnidad = async (id: number, campo: 'activa' | 'esOportunidad' | 'esNovedad' | 'vendida', valor: boolean) => {
  await requiereSesion();
  await initUnidad();

  const unidad = await Unidad.findByPk(id);
  if (!unidad) return;

  await unidad.update({ [campo]: valor });
  await revalidarTienda(['unidades']);
  revalidatePath('/unidades');
};

// Borrado lógico: se desactiva la unidad (no se muestra más en la tienda).
export const eliminarUnidad = async (id: number) => {
  await requiereSesion();
  await initUnidad();

  const unidad = await Unidad.findByPk(id);
  if (!unidad) return;

  await unidad.update({ activa: false, esOportunidad: false, esNovedad: false });
  await revalidarTienda(['unidades']);
  revalidatePath('/unidades');
};
