import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { NOMBRE_COOKIE_SESION } from '@/lib/sesion';

// Chequeo liviano en el borde: sin cookie de sesión va al login.
// La validación real (firma iron-session) la hace requiereSesion en cada página.
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/login') {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(NOMBRE_COOKIE_SESION);
  if (!cookie) {
    const urlLogin = new URL('/login', request.url);
    return NextResponse.redirect(urlLogin);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
