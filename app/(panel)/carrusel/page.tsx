import type { Metadata } from 'next';
import { obtenerItemsCarrusel } from '@/lib/datos';
import ListaCarrusel from '@/componentes/ListaCarrusel';
import FormularioCarrusel from '@/componentes/FormularioCarrusel';

export const metadata: Metadata = {
  title: 'Carrusel de home',
};

export default async function CarruselPage() {
  const items = await obtenerItemsCarrusel();

  const itemsSerializados = items.map((item) => ({
    id: item.id,
    urlImagenDesktop: item.urlImagenDesktop,
    urlImagenMobile: item.urlImagenMobile,
    textoAlt: item.textoAlt,
    urlDestino: item.urlDestino ?? '',
    orden: item.orden,
    activo: item.activo,
  }));

  return (
    <section>
      <h1 className="mb-1 text-lg font-bold text-slate-900">Carrusel de home</h1>
      <p className="mb-4 text-sm text-slate-500">
        Slides del carrusel principal de la tienda, en orden ascendente. Si no hay items activos, la tienda usa el carrusel por defecto.
      </p>

      <details className="mb-6 rounded-card bg-white p-4 shadow-card">
        <summary className="cursor-pointer text-sm font-semibold text-marca-600">+ Agregar item</summary>
        <div className="mt-4">
          <FormularioCarrusel />
        </div>
      </details>

      <ListaCarrusel items={itemsSerializados} />
    </section>
  );
}
