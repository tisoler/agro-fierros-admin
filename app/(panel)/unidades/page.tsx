import type { Metadata } from 'next';
import Link from 'next/link';
import { obtenerUnidadesAdmin } from '@/lib/datos';
import FilasUnidades, { FilaUnidad } from '@/componentes/FilasUnidades';

export const metadata: Metadata = {
  title: 'Unidades',
};

export default async function UnidadesPage() {
  const unidades = await obtenerUnidadesAdmin();

  const filas: FilaUnidad[] = unidades.map((unidad) => {
    const conMarca = unidad as typeof unidad & { marca?: { nombre: string } };
    return {
      id: unidad.id,
      titulo: unidad.titulo,
      modelo: unidad.modelo,
      marca: conMarca.marca?.nombre ?? '',
      activa: unidad.activa,
      vendida: unidad.vendida,
      esOportunidad: unidad.esOportunidad,
      esNovedad: unidad.esNovedad,
    };
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">
          Unidades <span className="ml-1 text-sm font-normal text-slate-500">({filas.length})</span>
        </h1>
        <Link
          href="/unidades/nueva"
          className="rounded-btn bg-marca-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-marca-700"
        >
          + Nueva unidad
        </Link>
      </div>
      <FilasUnidades filas={filas} />
    </section>
  );
}
