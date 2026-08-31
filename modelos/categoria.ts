import DataBaseConnection from '@/lib/sequelize';
import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';

export class Categoria extends Model<
  InferAttributes<Categoria>,
  InferCreationAttributes<Categoria>
> {
  declare id: CreationOptional<number>;
  declare titulo: string;
  declare descripcion: string;
  declare idCategoriaPadre: number;
  declare imagenEscritorio: string;
  declare imagenMovil: string;
  declare slug: string;
  declare mostrarHome: boolean;
}

export const initCategoria = async (db?: Sequelize) => {
  const sequelize = db ?? await DataBaseConnection.getSequelizeInstance();

  Categoria.init(
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
        allowNull: false,
      },
      idCategoriaPadre: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      imagenEscritorio: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      imagenMovil: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mostrarHome: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'categorias',
      timestamps: false,
    }
  );
};
