'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('faculty', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      name:        { type: Sequelize.STRING(255), allowNull: false },
      role:        { type: Sequelize.STRING(64),  allowNull: false },
      department:  { type: Sequelize.STRING(255), allowNull: true },
      department_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'departments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'Active' },
      about:  { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('faculty', ['name']);
    await queryInterface.addIndex('faculty', ['role']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('faculty');
  },
};
