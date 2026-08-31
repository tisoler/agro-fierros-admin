import type { Metadata } from 'next';
import { obtenerMarcas, obtenerCategorias } from '@/lib/datos';
import FormularioUnidad from '@/componentes/FormularioUnidad';

export const metadata: Metadata = {
  title: 'Nueva unidad',
};

export default async function NuevaUnidadPage() {
  const [marcas, categorias] = await Promise.all([obtenerMarcas(), obtenerCategorias()]);

  return (
    <section>
      <h1 className="mb-4 text-lg font-bold text-slate-900">Nueva unidad</h1>
      <FormularioUnidad
        marcas={marcas.map((marca) => ({ id: marca.id, nombre: marca.nombre }))}
        categorias={categorias.map((categoria) => ({ id: categoria.id, titulo: categoria.titulo }))}
      />
    </section>
  );
}
