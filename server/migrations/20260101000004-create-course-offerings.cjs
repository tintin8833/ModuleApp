'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('course_offerings', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      code:  { type: Sequelize.STRING(32),  allowNull: false, unique: true },
      title: { type: Sequelize.STRING(255), allowNull: false },
      year_level: { type: Sequelize.STRING(32),  allowNull: true },
      units:      { type: Sequelize.DECIMAL(4, 2), allowNull: true },
      instructor_name: { type: Sequelize.STRING(255), allowNull: true },
      instructor_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'faculty', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('course_offerings');
  },
};
