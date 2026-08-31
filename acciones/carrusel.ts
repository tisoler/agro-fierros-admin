'use server';

import { requiereSesion } from '@/lib/sesion';
import { revalidarTienda } from '@/lib/revalidar';
import { initCarruselHome, CarruselHome } from '@/modelos/carruselHome';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

type ResultadoCarrusel = { error: string } | null;

// Alta o edición de un item del carrusel de la home.
export const guardarItemCarrusel = async (_estadoPrevio: ResultadoCarrusel, formData: FormData): Promise<ResultadoCarrusel> => {
  await requiereSesion();
  await initCarruselHome();

  const id = formData.get('id') ? Number(formData.get('id')) : null;
  const urlImagenDesktop = String(formData.get('urlImagenDesktop') ?? '').trim();
  const urlImagenMobile = String(formData.get('urlImagenMobile') ?? '').trim();
  const textoAlt = String(formData.get('textoAlt') ?? '').trim();
  const urlDestino = String(formData.get('urlDestino') ?? '').trim() || null;
  const orden = Number(formData.get('orden') ?? 0);
  const activo = formData.get('activo') === 'on';

  if (!urlImagenDesktop || !urlImagenMobile || !textoAlt) {
    return { error: 'Imagen desktop, imagen mobile y texto alt son obligatorios.' };
  }

  try {
    if (id) {
      const item = await CarruselHome.findByPk(id);
      if (!item) return { error: 'El item no existe.' };
      await item.update({ urlImagenDesktop, urlImagenMobile, textoAlt, urlDestino, orden, activo });
    } else {
      await CarruselHome.create({ urlImagenDesktop, urlImagenMobile, textoAlt, urlDestino, orden, activo });
    }
  } catch (error) {
    console.error('Error guardando item de carrusel:', error);
    return { error: 'No se pudo guardar el item del carrusel.' };
  }

  await revalidarTienda(['carrusel-home']);
  revalidatePath('/carrusel');
  redirect('/carrusel');
};

// Activa/desactiva un item sin borrarlo.
export const cambiarActivoItemCarrusel = async (id: number, activo: boolean) => {
  await requiereSesion();
  await initCarruselHome();

  const item = await CarruselHome.findByPk(id);
  if (!item) return;

  await item.update({ activo });
  await revalidarTienda(['carrusel-home']);
  revalidatePath('/carrusel');
};

// Borrado físico del item del carrusel.
export const eliminarItemCarrusel = async (id: number) => {
  await requiereSesion();
  await initCarruselHome();

  await CarruselHome.destroy({ where: { id } });
  await revalidarTienda(['carrusel-home']);
  revalidatePath('/carrusel');
};
