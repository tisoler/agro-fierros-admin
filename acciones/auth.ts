'use server';

import { obtenerSesion } from '@/lib/sesion';
import { redirect } from 'next/navigation';

// Login de usuario único interno: compara contra ADMIN_PASSWORD.
export const iniciarSesion = async (_estadoPrevio: { error: string } | null, formData: FormData): Promise<{ error: string } | null> => {
  const password = String(formData.get('password') ?? '');
  const esperada = process.env.ADMIN_PASSWORD;

  if (!esperada) {
    return { error: 'ADMIN_PASSWORD no está configurado en el servidor.' };
  }
  if (password !== esperada) {
    return { error: 'Contraseña incorrecta.' };
  }

  const sesion = await obtenerSesion();
  sesion.autenticado = true;
  await sesion.save();
  redirect('/unidades');
};

export const cerrarSesion = async () => {
  const sesion = await obtenerSesion();
  sesion.destroy();
  redirect('/login');
};
