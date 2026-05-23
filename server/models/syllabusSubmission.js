/**
 * SyllabusSubmission — a syllabus submitted by an instructor for a
 * course, monitored by the OVPAA. Period-scoped and department-scoped
 * so the OVPAA dashboard can chart submissions per department for the
 * currently selected academic period.
 *
 * `content` holds the full syllabus payload (JSON) so the OVPAA can
 * view details and export to PDF without a second lookup.
 */
export default (sequelize, DataTypes) =>
  sequelize.define(
    'SyllabusSubmission',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      course_code:     { type: DataTypes.STRING(32),  allowNull: false },
      course_name:     { type: DataTypes.STRING(255), allowNull: true },
      department_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      department_name: { type: DataTypes.STRING(100), allowNull: true, comment: 'Denormalized for display / filtering even if the dept row is gone.' },
      instructor_name: { type: DataTypes.STRING(255), allowNull: true },
      status:          { type: DataTypes.STRING(32),  allowNull: false, defaultValue: 'Submitted' },
      submitted_at:    { type: DataTypes.DATE, allowNull: true },
      content:         { type: DataTypes.JSON, allowNull: true, comment: 'Full syllabus detail payload for view + export.' },
      period_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        comment: 'FK to academic_periods.id — every row is period-scoped.',
      },
    },
    {
      tableName: 'syllabus_submissions',
      timestamps: true,
    }
  );
