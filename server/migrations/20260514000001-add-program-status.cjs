'use strict';

/**
 * Programs gain a `status` column (Active | Unlisted), mirroring the
 * Department status system. Unlisted programs move to the Archive view.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('programs', 'status', {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'Active',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('programs', 'status');
  },
};
