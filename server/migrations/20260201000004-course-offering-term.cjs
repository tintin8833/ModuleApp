'use strict';

/**
 * Course Offerings gain an explicit TERM column (e.g. "1st Sem
 * 2025-2026") which is shown in the View modal and is parsed from
 * the updated Excel file.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('course_offerings', 'term', {
      type: Sequelize.STRING(64),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('course_offerings', 'term');
  },
};
