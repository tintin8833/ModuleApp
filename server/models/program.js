/**
 * Program — uploaded by the Dean.
 *
 * Columns from Program .xlsx:
 *   CODE, NAME, PROGRAM HEAD
 */
export default (sequelize, DataTypes) =>
  sequelize.define(
    'Program',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      program_head: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Mirrored display name of the program head (Faculty).',
      },
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'Active',
        comment: 'Active | Unlisted — Unlisted programs move to the Archive view.',
      },
      department_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      period_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: 'programs',
      timestamps: true,
    }
  );
