// Generación server-side del derivado "destacado" (cards/buscador).
// Vive en módulo propio (sin 'use server') para no romper el análisis
// estático de los server actions con el binding nativo de sharp.
import sharp from 'sharp';

export const DESTACADA_ANCHO = 327;
export const DESTACADA_ALTO = 250;

export const generarDestacada = async (origen: Uint8Array): Promise<Uint8Array> => {
  const derivado = await sharp(origen)
    .resize(DESTACADA_ANCHO, DESTACADA_ALTO, { fit: 'cover', position: 'center' })
    .webp({ quality: 78 })
    .toBuffer();
  return new Uint8Array(derivado);
};
