'use strict';

/**
 * consultant_courses — join table giving each Industry Consultant many
 * assigned Course Offerings. Supersedes the single
 * industry_consultants.assigned_course_id column (kept for back-compat
 * but no longer authoritative). Existing single assignments are
 * backfilled so no data is lost.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('consultant_courses', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      consultant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'industry_consultants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      course_offering_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'course_offerings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      course_code: { type: Sequelize.STRING(32), allowNull: true },
    });

    // Backfill: carry each consultant's existing single assignment over.
    await queryInterface.sequelize.query(
      'INSERT INTO consultant_courses (consultant_id, course_offering_id, course_code) ' +
      'SELECT id, assigned_course_id, assigned_course_code FROM industry_consultants ' +
      'WHERE assigned_course_id IS NOT NULL OR assigned_course_code IS NOT NULL'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('consultant_courses');
  },
};
