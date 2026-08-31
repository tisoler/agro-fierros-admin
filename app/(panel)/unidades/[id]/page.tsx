import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { obtenerUnidadAdmin, obtenerMarcas, obtenerCategorias } from '@/lib/datos';
import FormularioUnidad from '@/componentes/FormularioUnidad';

export const metadata: Metadata = {
  title: 'Editar unidad',
};

export default async function EditarUnidadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNumero = Number(id);
  if (Number.isNaN(idNumero)) {
    notFound();
  }

  const [unidad, marcas, categorias] = await Promise.all([
    obtenerUnidadAdmin(idNumero),
    obtenerMarcas(),
    obtenerCategorias(),
  ]);
  if (!unidad) {
    notFound();
  }

  const conRelaciones = unidad as typeof unidad & {
    marca?: { nombre: string };
    categorias?: { id: number }[];
    imagenes?: { id: number; urlEscritorio: string; urlMobile: string; urlMini: string; textoAlt: string }[];
    detalles?: { id: number; detalle: string }[];
  };

  const unidadSerializada = {
    id: unidad.id,
    titulo: unidad.titulo,
    descripcion: unidad.descripcion ?? '',
    modelo: unidad.modelo,
    idMarca: unidad.idMarca,
    nuevo: unidad.nuevo,
    esOportunidad: unidad.esOportunidad,
    esNovedad: unidad.esNovedad,
    activa: unidad.activa,
    vendida: unidad.vendida,
    precioDolar: unidad.precioDolar ?? null,
    imagenDestacadaUrl: unidad.imagenDestacadaUrl,
    imagenDestacadaTextoAlt: unidad.imagenDestacadaTextoAlt,
    idsCategorias: (conRelaciones.categorias ?? []).map((categoria) => categoria.id),
    imagenes: (conRelaciones.imagenes ?? []).map((imagen) => ({
      urlEscritorio: imagen.urlEscritorio,
      urlMobile: imagen.urlMobile,
      urlMini: imagen.urlMini,
      textoAlt: imagen.textoAlt,
    })),
    detalles: (conRelaciones.detalles ?? []).map((detalle) => detalle.detalle),
  };

  return (
    <section>
      <h1 className="mb-4 text-lg font-bold text-slate-900">
        Editar unidad <span className="ml-1 text-sm font-normal text-slate-500">#{unidad.id} · {unidad.titulo}</span>
      </h1>
      <FormularioUnidad
        unidad={unidadSerializada}
        marcas={marcas.map((marca) => ({ id: marca.id, nombre: marca.nombre }))}
        categorias={categorias.map((categoria) => ({ id: categoria.id, titulo: categoria.titulo }))}
      />
    </section>
  );
}
