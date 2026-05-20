/**
 * Sequelize CLI configuration.
 *
 * This file MUST be CommonJS (.cjs) because sequelize-cli loads it
 * synchronously via `require()`, but the rest of this backend runs as
 * ES Modules. The runtime app reads the same env vars through
 * config/sequelize.js (ESM) — keep them in sync.
 */
require('dotenv').config();

const common = {
  username: process.env.DB_USER || 'ca_user',
  password: process.env.DB_PASSWORD || 'ca_password',
  database: process.env.DB_NAME || 'course_assignment',
  host:     process.env.DB_HOST || '127.0.0.1',
  port:     Number(process.env.DB_PORT || 3307),
  dialect:  process.env.DB_DIALECT || 'mysql',
  logging:  false,
  define: {
    underscored: true,
    freezeTableName: false,
  },
};

module.exports = {
  development: common,
  test:        { ...common, database: `${common.database}_test` },
  production:  common,
};
