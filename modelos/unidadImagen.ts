import DataBaseConnection from '@/lib/sequelize';
import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';

export class UnidadImagen extends Model<
  InferAttributes<UnidadImagen>,
  InferCreationAttributes<UnidadImagen>
> {
  declare id: CreationOptional<number>;
  declare urlEscritorio: string;
  declare urlMobile: string;
  declare urlMini: string;
  declare textoAlt: string;
  declare idUnidad: number;
}

export const initUnidadImagen = async (db?: Sequelize) => {
  const sequelize = db ?? await DataBaseConnection.getSequelizeInstance();

  UnidadImagen.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      urlEscritorio: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      urlMobile: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      urlMini: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      textoAlt: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      idUnidad: {
        type: DataTypes.NUMBER,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'unidadImagenes',
      timestamps: false,
    }
  );
};
