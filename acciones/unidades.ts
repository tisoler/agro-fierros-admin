'use server';

import { requiereSesion } from '@/lib/sesion';
import { revalidarTienda } from '@/lib/revalidar';
import { generarSlug } from '@/lib/utilidades';
import DataBaseConnection from '@/lib/sequelize';
import { initUnidad, Unidad } from '@/modelos/unidad';
import { UnidadImagen } from '@/modelos/unidadImagen';
import { UnidadDetalle } from '@/modelos/unidadDetalle';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type ImagenFormulario = {
  urlEscritorio: string;
  urlMobile: string;
  urlMini: string;
  textoAlt: string;
};

type ResultadoGuardado = { error: string } | null;

// Alta o edición de unidad. Las imágenes y detalles técnicos llegan
// serializados como JSON desde el formulario cliente.
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
  const imagenDestacadaUrl = String(formData.get('imagenDestacadaUrl') ?? '').trim();
  const imagenDestacadaTextoAlt = String(formData.get('imagenDestacadaTextoAlt') ?? '').trim();
  const idsCategorias = formData.getAll('idsCategorias').map((valor) => Number(valor)).filter((valor) => !Number.isNaN(valor));

  let imagenes: ImagenFormulario[] = [];
  let detalles: string[] = [];
  try {
    imagenes = JSON.parse(String(formData.get('imagenesJson') ?? '[]'));
    detalles = JSON.parse(String(formData.get('detallesJson') ?? '[]'));
  } catch {
    return { error: 'Formato inválido de imágenes o detalles técnicos.' };
  }

  if (!titulo || !modelo || !idMarca || !imagenDestacadaUrl || !imagenDestacadaTextoAlt) {
    return { error: 'Título, modelo, marca e imagen destacada (URL y alt) son obligatorios.' };
  }
  if (precioDolarCrudo && (precioDolar === null || Number.isNaN(precioDolar) || precioDolar < 0)) {
    return { error: 'El precio debe ser un número positivo en dólares.' };
  }

  await initUnidad();
  const sequelize = await DataBaseConnection.getSequelizeInstance();

  try {
    await sequelize.transaction(async (t) => {
      let unidad: Unidad;

      if (id) {
        const existente = await Unidad.findByPk(id, { transaction: t });
        if (!existente) {
          throw new Error('La unidad no existe.');
        }
        await existente.update(
          { titulo, descripcion, modelo, idMarca, nuevo, esOportunidad, esNovedad, activa, vendida, imagenDestacadaUrl, imagenDestacadaTextoAlt, precioDolar },
          { transaction: t }
        );
        unidad = existente;
      } else {
        // Slug único a partir del título (solo en alta; en edición se conserva)
        let slug = generarSlug(titulo);
        const existeSlug = await Unidad.findOne({ where: { slug }, transaction: t });
        if (existeSlug) {
          slug = `${slug}-${Date.now().toString(36)}`;
        }
        unidad = await Unidad.create(
          { titulo, descripcion, modelo, idMarca, nuevo, esOportunidad, esNovedad, activa, vendida, imagenDestacadaUrl, imagenDestacadaTextoAlt, precioDolar, slug },
          { transaction: t }
        );
      }

      // Categorías (N—M vía unidadCategorias)
      const conCategorias = unidad as Unidad & { setCategorias: (ids: number[], opciones?: { transaction: unknown }) => Promise<unknown> };
      await conCategorias.setCategorias(idsCategorias, { transaction: t });

      // Imágenes: se reemplazan todas
      await UnidadImagen.destroy({ where: { idUnidad: unidad.id }, transaction: t });
      if (imagenes.length) {
        await UnidadImagen.bulkCreate(
          imagenes
            .filter((imagen) => imagen.urlEscritorio && imagen.urlMobile && imagen.urlMini && imagen.textoAlt)
            .map((imagen) => ({ ...imagen, idUnidad: unidad.id })),
          { transaction: t }
        );
      }

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
