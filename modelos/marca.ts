import DataBaseConnection from '@/lib/sequelize';
import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';

export class Marca extends Model<
  InferAttributes<Marca>,
  InferCreationAttributes<Marca>
> {
  declare id: CreationOptional<number>;
  declare nombre: string;
  declare slug: string;
}

export const initMarca = async (db?: Sequelize) => {
  const sequelize = db ?? await DataBaseConnection.getSequelizeInstance();

  Marca.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'marcas',
      timestamps: false,
    }
  );
};
