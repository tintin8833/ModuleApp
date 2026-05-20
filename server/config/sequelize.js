// ESM Sequelize bootstrap used by the running Express app.
// Sequelize CLI uses config/config.cjs separately for migrations/seeders.
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'course_assignment',
  process.env.DB_USER || 'ca_user',
  process.env.DB_PASSWORD || 'ca_password',
  {
    host:    process.env.DB_HOST || '127.0.0.1',
    port:    Number(process.env.DB_PORT || 3307),
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    define: {
      underscored: true,
      freezeTableName: false,
    },
  }
);

export async function assertDbConnection() {
  await sequelize.authenticate();
}
