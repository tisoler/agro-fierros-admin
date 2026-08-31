import DataBaseConnection from '@/lib/sequelize';
import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';

export class UnidadDetalle extends Model<
  InferAttributes<UnidadDetalle>,
  InferCreationAttributes<UnidadDetalle>
> {
  declare id: CreationOptional<number>;
  declare idUnidad: number;
  declare detalle: string;
}

export const initUnidadDetalle = async (db?: Sequelize) => {
  const sequelize = db ?? await DataBaseConnection.getSequelizeInstance();

  UnidadDetalle.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      idUnidad: {
        type: DataTypes.NUMBER,
        allowNull: false,
      },
      detalle: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'unidadDetallesTecnicos',
      timestamps: false,
    }
  );
};
