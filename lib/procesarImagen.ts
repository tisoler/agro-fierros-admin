// Procesado de fotos en el navegador (solo se usa desde componentes cliente).
// Cada foto original genera los derivados webp finales, así el servidor solo
// valida y los sube al CDN sin recibir archivos de varios MB.

export type Foco = { x: number; y: number }; // 0..1 en cada eje

export type Variante = 'escritorio' | 'mobile' | 'mini';

export type FormatoDerivado = { ancho: number; alto: number; calidad: number };

export const FORMATOS: Record<Variante, FormatoDerivado> = {
  escritorio: { ancho: 640, alto: 490, calidad: 0.82 },
  mobile: { ancho: 800, alto: 1000, calidad: 0.8 },
  mini: { ancho: 180, alto: 140, calidad: 0.7 },
};

export const VARIANTES: Variante[] = ['escritorio', 'mobile', 'mini'];

export const MAX_IMAGENES = 7;
export const MAX_ORIGINAL_MB = 25;
export const MAX_DERIVADO_BYTES = 2 * 1024 * 1024;

export const validarOriginal = (archivo: File): string | null => {
  if (!archivo.type.startsWith('image/')) {
    return `"${archivo.name}" no es una imagen válida.`;
  }
  if (archivo.size > MAX_ORIGINAL_MB * 1024 * 1024) {
    return `"${archivo.name}" supera los ${MAX_ORIGINAL_MB} MB.`;
  }
  return null;
};

// Recorte tipo "cover" con punto focal: calcula el rectángulo del original.
const calcularRecorte = (
  anchoOrigen: number,
  altoOrigen: number,
  formato: FormatoDerivado,
  foco: Foco
) => {
  const escala = Math.max(formato.ancho / anchoOrigen, formato.alto / altoOrigen);
  const anchoRecorte = formato.ancho / escala;
  const altoRecorte = formato.alto / escala;
  const fx = Math.min(1, Math.max(0, foco.x));
  const fy = Math.min(1, Math.max(0, foco.y));
  return {
    sx: fx * (anchoOrigen - anchoRecorte),
    sy: fy * (altoOrigen - altoRecorte),
    sw: anchoRecorte,
    sh: altoRecorte,
  };
};

export const generarDerivado = async (
  mapa: ImageBitmap,
  formato: FormatoDerivado,
  foco: Foco,
  nombre: string
): Promise<File> => {
  const canvas = document.createElement('canvas');
  canvas.width = formato.ancho;
  canvas.height = formato.alto;
  const contexto = canvas.getContext('2d');
  if (!contexto) {
    throw new Error('El navegador no permite procesar imágenes.');
  }
  const { sx, sy, sw, sh } = calcularRecorte(mapa.width, mapa.height, formato, foco);
  contexto.drawImage(mapa, sx, sy, sw, sh, 0, 0, formato.ancho, formato.alto);
  const blob = await new Promise<Blob | null>((resolver) =>
    canvas.toBlob((b) => resolver(b), 'image/webp', formato.calidad)
  );
  if (!blob) {
    throw new Error('No se pudo convertir la imagen a webp.');
  }
  return new File([blob], nombre, { type: 'image/webp' });
};

export type DerivadosFoto = Record<Variante, File>;

// Foco por formato (la mini reutiliza el de escritorio).
export type FocosFoto = { escritorio: Foco; mobile: Foco };

export const FOCO_CENTRO: Foco = { x: 0.5, y: 0.5 };

// Genera los 3 derivados webp de una foto. nombreBase arma el nombre de archivo.
export const procesarFoto = async (
  original: File,
  focos: FocosFoto,
  nombreBase: (variante: Variante) => string
): Promise<DerivadosFoto> => {
  const mapa = await createImageBitmap(original);
  try {
    const [escritorio, mobile, mini] = await Promise.all([
      generarDerivado(mapa, FORMATOS.escritorio, focos.escritorio, nombreBase('escritorio')),
      generarDerivado(mapa, FORMATOS.mobile, focos.mobile, nombreBase('mobile')),
      generarDerivado(mapa, FORMATOS.mini, focos.escritorio, nombreBase('mini')),
    ]);
    return { escritorio, mobile, mini };
  } finally {
    mapa.close();
  }
};
