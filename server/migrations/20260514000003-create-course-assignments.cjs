'use strict';

/**
 * course_assignments — the Course Assignment module's own table,
 * distinct from course_offerings (the master list).
 *
 * A row links a course to an assigned faculty member and carries a
 * validation status — Verified | Pending Match | Flagged — derived by
 * checking the data against the period's Course Offerings and Faculty.
 * The table starts blank each term (no clone-on-first-use).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('course_assignments', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      course_code: { type: Sequelize.STRING(64), allowNull: false },
      course_name: { type: Sequelize.STRING(255), allowNull: true },
      course_offering_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'course_offerings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      faculty_name: { type: Sequelize.STRING(255), allowNull: true },
      faculty_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'faculty', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'Pending Match' },
      period_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'academic_periods', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('course_assignments');
  },
};
