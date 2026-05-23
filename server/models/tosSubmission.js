/**
 * TosSubmission — a Table of Specifications submitted by an instructor
 * for a course, monitored by the OVPAA. Same shape and scoping rules
 * as SyllabusSubmission (period-scoped + department-scoped) so the
 * OVPAA dashboard can chart TOS submissions per department per period.
 */
export default (sequelize, DataTypes) =>
  sequelize.define(
    'TosSubmission',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      course_code:     { type: DataTypes.STRING(32),  allowNull: false },
      course_name:     { type: DataTypes.STRING(255), allowNull: true },
      department_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      department_name: { type: DataTypes.STRING(100), allowNull: true, comment: 'Denormalized for display / filtering even if the dept row is gone.' },
      instructor_name: { type: DataTypes.STRING(255), allowNull: true },
      status:          { type: DataTypes.STRING(32),  allowNull: false, defaultValue: 'Submitted' },
      submitted_at:    { type: DataTypes.DATE, allowNull: true },
      content:         { type: DataTypes.JSON, allowNull: true, comment: 'Full TOS detail payload for view + export.' },
      period_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        comment: 'FK to academic_periods.id — every row is period-scoped.',
      },
    },
    {
      tableName: 'tos_submissions',
      timestamps: true,
    }
  );
