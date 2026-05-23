'use strict';

/**
 * Creates the users table (authentication accounts).
 *
 * Defensive: the running app uses sequelize.sync({ alter: true }) which
 * may have already created this table on boot. We skip creation if it
 * exists so `db:migrate` never collides with sync.
 */
async function tableExists(queryInterface, name) {
  const tables = await queryInterface.showAllTables();
  return tables
    .map((t) => (typeof t === 'string' ? t : t.tableName))
    .map((t) => String(t).toLowerCase())
    .includes(name.toLowerCase());
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (await tableExists(queryInterface, 'users')) return;
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name:          { type: Sequelize.STRING(100), allowNull: false },
      email:         { type: Sequelize.STRING(160), allowNull: false },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role:          { type: Sequelize.STRING(32),  allowNull: false, defaultValue: 'instructor' },
      department_id: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'departments', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      status:        { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'Active' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
