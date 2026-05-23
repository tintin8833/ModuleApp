/**
 * User — system accounts for authentication & role-based access.
 *
 * NOT period-scoped: accounts persist across academic periods.
 *
 * `role` drives where the user lands after login and what they may
 * access. Known roles:
 *   'admin'                — manages user accounts (this module's owner)
 *   'ovpaa'                — monitors syllabus / TOS submissions
 *   'dean' | 'program-head' | 'instructor'
 *   'director-of-libraries' | 'industry-consultant' | 'hr-staff'
 *
 * Email uniqueness is enforced in userController (not via a DB unique
 * index) on purpose — this app runs sync({ alter: true }) on every
 * boot, which would otherwise accumulate duplicate unique indexes
 * (email_2, email_3, …) and eventually hit MySQL's 64-key limit.
 */
export default (sequelize, DataTypes) =>
  sequelize.define(
    'User',
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      name:          { type: DataTypes.STRING(100), allowNull: false },
      email:         { type: DataTypes.STRING(160), allowNull: false },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      role:          { type: DataTypes.STRING(32),  allowNull: false, defaultValue: 'instructor' },
      department_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        comment: 'Optional FK to departments.id — scopes deans / instructors to a department.',
      },
      status:        { type: DataTypes.STRING(16),  allowNull: false, defaultValue: 'Active' },
    },
    {
      tableName: 'users',
      timestamps: true,
    }
  );
