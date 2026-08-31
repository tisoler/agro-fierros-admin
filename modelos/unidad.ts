import DataBaseConnection from '@/lib/sequelize';
import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';
import { initMarca, Marca } from './marca';
import { Categoria, initCategoria } from './categoria';
import { initUnidadImagen, UnidadImagen } from './unidadImagen';
import { initUnidadDetalle, UnidadDetalle } from './unidadDetalle';

export class Unidad extends Model<
  InferAttributes<Unidad>,
  InferCreationAttributes<Unidad>
> {
  declare id: CreationOptional<number>;
  declare titulo: string;
  declare descripcion: string;
  declare imagenDestacadaUrl: string;
  declare imagenDestacadaTextoAlt: string;
  declare esOportunidad: boolean;
  declare esNovedad: boolean;
  declare nuevo: boolean;
  declare modelo: string;
  declare idMarca: number;
  declare slug: string;
  declare activa: boolean;
  declare vendida: boolean;
  declare precioDolar: CreationOptional<number | null>;
}

export const initUnidad = async (db?: Sequelize) => {
  const sequelize = db ?? await DataBaseConnection.getSequelizeInstance();

  Unidad.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      titulo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      imagenDestacadaUrl: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      imagenDestacadaTextoAlt: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      esOportunidad: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      esNovedad: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      nuevo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      modelo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      idMarca: {
        type: DataTypes.NUMBER,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      activa: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      vendida: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      precioDolar: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'unidades',
      timestamps: false,
    }
  );

  // Asociar Marca a Unidad
  await initMarca(sequelize);
  if (!Unidad.associations.marca) {
    Unidad.belongsTo(Marca, { foreignKey: 'idMarca', as: 'marca' });
  }
  if (!Marca.associations.unidades) {
    Marca.hasMany(Unidad, { foreignKey: 'idMarca', as: 'unidades' });
  }

  // Asociar Categoria a Unidad
  await initCategoria(sequelize);
  if (!Unidad.associations.categorias) {
    Unidad.belongsToMany(Categoria, { through: 'unidadCategorias', foreignKey: 'idUnidad', sourceKey: 'id', as: 'categorias', timestamps: false });
  }
  if (!Categoria.associations.unidades) {
    Categoria.belongsToMany(Unidad, { through: 'unidadCategorias', foreignKey: 'idCategoria', sourceKey: 'id', as: 'unidades', timestamps: false });
  }

  // Asociar Imágenes a Unidad
  await initUnidadImagen(sequelize);
  if (!Unidad.associations.imagenes) {
    Unidad.hasMany(UnidadImagen, { foreignKey: 'idUnidad', as: 'imagenes' });
  }

  // Asociar Detalles Técnicos a Unidad
  await initUnidadDetalle(sequelize);
  if (!Unidad.associations.detalles) {
    Unidad.hasMany(UnidadDetalle, { foreignKey: 'idUnidad', as: 'detalles' });
  }

  return sequelize;
};
