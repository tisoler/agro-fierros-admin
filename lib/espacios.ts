// Acceso al Space de DigitalOcean (S3 compatible) para las fotos de unidades.
// Estructura de carpetas por slug (se mantiene la actual):
//   agrofierros/productos/{slug}/{n}.webp            (desktop 640x490)
//   agrofierros/productos/{slug}/{n}-mobile.webp     (mobile 800x1000)
//   agrofierros/productos/{slug}/{n}-mini.webp       (mini 180x140)
//   agrofierros/productos/{slug}/destacado.webp      (cards/buscador 327x250)
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';

type ConfigEspacios = {
  cliente: S3Client;
  bucket: string;
  cdnBase: string;
  carpeta: string;
};

let config: ConfigEspacios | null = null;

export const leerConfigEspacios = (): ConfigEspacios => {
  if (config) return config;
  const punto = process.env.SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com';
  const region = process.env.SPACES_REGION || 'nyc3';
  const bucket = process.env.SPACES_BUCKET || 'tisolercdn';
  const clave = process.env.SPACES_KEY;
  const secreto = process.env.SPACES_SECRET;
  if (!clave || !secreto) {
    throw new Error('Faltan las variables SPACES_KEY / SPACES_SECRET para subir imágenes.');
  }
  config = {
    cliente: new S3Client({
      endpoint: punto,
      region,
      credentials: { accessKeyId: clave, secretAccessKey: secreto },
      forcePathStyle: false,
    }),
    bucket,
    cdnBase: (process.env.SPACES_CDN_BASE || 'https://tisolercdn.nyc3.cdn.digitaloceanspaces.com').replace(/\/$/, ''),
    carpeta: (process.env.SPACES_CARPETA || 'agrofierros/productos').replace(/^\//, '').replace(/\/$/, ''),
  };
  return config;
};

export const claveImagen = (slug: string, nombre: string) => `${leerConfigEspacios().carpeta}/${slug}/${nombre}`;

export const urlCdn = (clave: string) => `${leerConfigEspacios().cdnBase}/${clave}`;

export const esWebp = (bytes: Uint8Array) =>
  bytes.length > 12 &&
  bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
  bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;

// Derivados numerados: inmutables (nunca se modifican ni reutilizan nombres),
// con el max-age de 30 días que usamos en el resto de recursos del Space.
export const CACHE_DERIVADO = 'public, max-age=2592000';

export const subirImagen = async (clave: string, cuerpo: Uint8Array, tipo = 'image/webp', cache = CACHE_DERIVADO) => {
  const { cliente, bucket } = leerConfigEspacios();
  await cliente.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: clave,
      Body: cuerpo,
      ContentType: tipo,
      ACL: 'public-read',
      CacheControl: cache,
    })
  );
};

// destacada: se sobrescribe en cada cambio, por eso lleva caché corto.
export const CACHE_DESTACADA = 'public, max-age=3600';

export const eliminarImagenes = async (claves: string[]) => {
  if (!claves.length) return;
  const { cliente, bucket } = leerConfigEspacios();
  await cliente.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: claves.map((Key) => ({ Key })) },
    })
  );
};

// Lista los archivos numerados de una unidad (n.webp, n-mobile.webp, n-mini.webp),
// excluyendo destacado.webp.
export const listarNumeradas = async (slug: string): Promise<{ clave: string; numero: number }[]> => {
  const { cliente, bucket, carpeta } = leerConfigEspacios();
  const prefijo = `${carpeta}/${slug}/`;
  const resultado: { clave: string; numero: number }[] = [];
  let token: string | undefined;
  do {
    const respuesta = await cliente.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefijo, ContinuationToken: token })
    );
    for (const objeto of respuesta.Contents ?? []) {
      if (!objeto.Key) continue;
      const nombre = objeto.Key.slice(prefijo.length);
      const coincidencia = nombre.match(/^(\d+)(?:-mini|-mobile)?\.webp$/);
      if (coincidencia) {
        resultado.push({ clave: objeto.Key, numero: Number(coincidencia[1]) });
      }
    }
    token = respuesta.IsTruncated ? respuesta.NextContinuationToken : undefined;
  } while (token);
  return resultado;
};
