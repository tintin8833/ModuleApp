/**
 * CourseAssignment — the Course Assignment module's own record.
 *
 * Separate from CourseOffering (the master list). Each row pairs a
 * course with an assigned faculty member and carries a validation
 * status produced by checking the data against the period's Course
 * Offerings and Faculty:
 *
 *   Verified      — course + faculty both matched, faculty available.
 *   Pending Match — course code or faculty name not in the master lists.
 *   Flagged       — faculty matched but Inactive / On Leave (a schedule
 *                   conflict would also flag, but is not yet detectable).
 */
export default (sequelize, DataTypes) =>
  sequelize.define(
    'CourseAssignment',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      course_code: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      course_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      course_offering_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        comment: 'Resolved FK to course_offerings.id (null if the code was unmatched).',
      },
      faculty_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      faculty_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        comment: 'Resolved FK to faculty.id (null if the name was unmatched).',
      },
      status: {
        type: DataTypes.STRING(32),
        allowNull: false,
        defaultValue: 'Pending Match',
        comment: 'Verified | Pending Match | Flagged',
      },
      period_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    },
    {
      tableName: 'course_assignments',
      timestamps: true,
    }
  );
