import { NextRequest, NextResponse } from 'next/server';

// Proxy same-origin para las fotos del CDN: el Space no envía CORS y sin esto
// el canvas de imágenes para redes quedaría "taint" y no se podría descargar.
// Solo hosts permitidos y solo para usuarios con sesión (lo exige el proxy).
const HOSTS_PERMITIDOS = ['tisolercdn.nyc3.cdn.digitaloceanspaces.com'];

export async function GET(request: NextRequest) {
  const cruda = new URL(request.url).searchParams.get('url') ?? '';
  let destino: URL;
  try {
    destino = new URL(cruda);
  } catch {
    return new NextResponse('URL inválida', { status: 400 });
  }
  if (!HOSTS_PERMITIDOS.includes(destino.hostname)) {
    return new NextResponse('Host no permitido', { status: 403 });
  }
  const respuesta = await fetch(destino.toString(), { cache: 'no-store' });
  if (!respuesta.ok) {
    return new NextResponse('No se pudo leer la imagen', { status: 502 });
  }
  const cuerpo = await respuesta.arrayBuffer();
  return new NextResponse(cuerpo, {
    headers: {
      'Content-Type': respuesta.headers.get('Content-Type') ?? 'image/webp',
      'Cache-Control': 'no-store',
    },
  });
}
