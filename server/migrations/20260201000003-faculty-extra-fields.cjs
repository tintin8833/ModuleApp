'use strict';

/**
 * Faculty gains personal + contact fields so the "View" modal can
 * render Sex / Birthdate / Email / Contact Number. All nullable so
 * old uploads keep working — the new Excel file will fill them in.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('faculty', 'sex',            { type: Sequelize.STRING(16),  allowNull: true });
    await queryInterface.addColumn('faculty', 'birthdate',      { type: Sequelize.DATEONLY,    allowNull: true });
    await queryInterface.addColumn('faculty', 'email',          { type: Sequelize.STRING(255), allowNull: true });
    await queryInterface.addColumn('faculty', 'contact_number', { type: Sequelize.STRING(32),  allowNull: true });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('faculty', 'contact_number');
    await queryInterface.removeColumn('faculty', 'email');
    await queryInterface.removeColumn('faculty', 'birthdate');
    await queryInterface.removeColumn('faculty', 'sex');
  },
};
