import type { Metadata } from 'next';
import { obtenerCarruselUnidades } from '@/lib/datos';
import OrdenCarrusel from '@/componentes/OrdenCarrusel';

export const metadata: Metadata = {
  title: 'Carruseles de unidades',
};

export default async function CarruselesUnidadesPage() {
  const [oportunidades, novedades] = await Promise.all([
    obtenerCarruselUnidades('oportunidad'),
    obtenerCarruselUnidades('novedad'),
  ]);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="mb-1 text-lg font-bold text-slate-900">Carruseles de unidades</h1>
        <p className="text-sm text-slate-500">
          Orden de las tarjetas en la tienda (foto destacada + título). Las unidades sin orden manual van al final.
        </p>
      </div>
      <OrdenCarrusel
        seccion="oportunidad"
        titulo="Oportunidades"
        bajada="Unidades marcadas como oportunidad"
        inicial={oportunidades.map((u) => ({ id: u.id, titulo: u.titulo, imagen: u.imagenDestacadaUrl }))}
      />
      <OrdenCarrusel
        seccion="novedad"
        titulo="Novedades"
        bajada="Unidades marcadas como novedad"
        inicial={novedades.map((u) => ({ id: u.id, titulo: u.titulo, imagen: u.imagenDestacadaUrl }))}
      />
    </section>
  );
}
