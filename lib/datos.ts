// Consultas de lectura para las páginas del admin (server components).
import { initUnidad, Unidad } from '@/modelos/unidad';
import { Marca, initMarca } from '@/modelos/marca';
import { Categoria, initCategoria } from '@/modelos/categoria';
import { CarruselHome, initCarruselHome } from '@/modelos/carruselHome';
import { UnidadImagen } from '@/modelos/unidadImagen';
import { UnidadDetalle } from '@/modelos/unidadDetalle';

export const obtenerMarcas = async () => {
  await initMarca();
  return Marca.findAll({ order: [['nombre', 'ASC']] });
};

export const obtenerCategorias = async () => {
  await initCategoria();
  return Categoria.findAll({ order: [['titulo', 'ASC']] });
};

export const obtenerUnidadesAdmin = async () => {
  await initUnidad();
  return Unidad.findAll({
    include: [{ model: Marca, as: 'marca' }],
    order: [['id', 'DESC']],
  });
};

export const obtenerUnidadAdmin = async (id: number) => {
  await initUnidad();
  return Unidad.findByPk(id, {
    include: [
      { model: Marca, as: 'marca' },
      { model: Categoria, as: 'categorias', through: { attributes: [] } },
      { model: UnidadImagen, as: 'imagenes' },
      { model: UnidadDetalle, as: 'detalles' },
    ],
  });
};

export const obtenerItemsCarrusel = async () => {
  await initCarruselHome();
  return CarruselHome.findAll({ order: [['orden', 'ASC'], ['id', 'ASC']] });
};
