import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

export type DatosSesion = {
  autenticado?: boolean;
};

export const NOMBRE_COOKIE_SESION = 'agrofierros_admin_sesion';

export const obtenerSesion = async (): Promise<IronSession<DatosSesion>> => {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto || secreto.length < 32) {
    throw new Error('SESSION_SECRET debe estar definido y tener al menos 32 caracteres');
  }

  return getIronSession<DatosSesion>(await cookies(), {
    cookieName: NOMBRE_COOKIE_SESION,
    password: secreto,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 8, // 8 horas
    },
  });
};

// Guardia para páginas protegidas (server components)
export const requiereSesion = async () => {
  const { redirect } = await import('next/navigation');
  const sesion = await obtenerSesion();
  if (!sesion.autenticado) {
    redirect('/login');
  }
};
