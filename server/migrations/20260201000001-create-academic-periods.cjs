'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('academic_periods', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      label:       { type: Sequelize.STRING(64),  allowNull: false, unique: true },
      school_year: { type: Sequelize.STRING(16),  allowNull: false },
      semester:    { type: Sequelize.STRING(16),  allowNull: false },
      is_active:   { type: Sequelize.BOOLEAN,     allowNull: false, defaultValue: false },
      sort_order:  { type: Sequelize.INTEGER,     allowNull: false, defaultValue: 0 },
      created_at:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at:  { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    // Seed two default periods so the frontend dropdown is never empty.
    await queryInterface.bulkInsert('academic_periods', [
      { label: '1st Semester 2025-2026', school_year: '2025-2026', semester: '1', is_active: true,  sort_order: 100, created_at: new Date(), updated_at: new Date() },
      { label: '2nd Semester 2025-2026', school_year: '2025-2026', semester: '2', is_active: false, sort_order: 90,  created_at: new Date(), updated_at: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('academic_periods');
  },
};
