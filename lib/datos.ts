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

// Unidades de una sección del carrusel (oportunidades/novedades),
// en el orden manual (sin orden van al final, por id como antes).
export const obtenerCarruselUnidades = async (seccion: 'oportunidad' | 'novedad') => {
  const sequelize = await initUnidad();
  const flag = seccion === 'oportunidad' ? 'esOportunidad' : 'esNovedad';
  const columna = seccion === 'oportunidad' ? 'ordenOportunidad' : 'ordenNovedad';
  return Unidad.findAll({
    where: { [flag]: true, activa: true },
    attributes: ['id', 'titulo', 'imagenDestacadaUrl', 'imagenDestacadaTextoAlt', columna],
    order: [[sequelize.fn('COALESCE', sequelize.col(columna), 999999), 'ASC'], ['id', 'ASC']],
  });
};
