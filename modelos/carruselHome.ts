import DataBaseConnection from '@/lib/sequelize';
import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';

export class CarruselHome extends Model<
  InferAttributes<CarruselHome>,
  InferCreationAttributes<CarruselHome>
> {
  declare id: CreationOptional<number>;
  declare urlImagenDesktop: string;
  declare urlImagenMobile: string;
  declare textoAlt: string;
  declare urlDestino: CreationOptional<string | null>;
  declare orden: number;
  declare activo: CreationOptional<boolean>;
}

export const initCarruselHome = async (db?: Sequelize) => {
  const sequelize = db ?? await DataBaseConnection.getSequelizeInstance();

  CarruselHome.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      urlImagenDesktop: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      urlImagenMobile: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      textoAlt: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      urlDestino: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      orden: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      tableName: 'carruselHome',
      timestamps: false,
    }
  );
};
