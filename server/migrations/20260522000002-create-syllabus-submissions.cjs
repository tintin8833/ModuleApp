'use strict';

/** Creates syllabus_submissions (period- + department-scoped). Defensive: skips if sync already made it. */
async function tableExists(queryInterface, name) {
  const tables = await queryInterface.showAllTables();
  return tables
    .map((t) => (typeof t === 'string' ? t : t.tableName))
    .map((t) => String(t).toLowerCase())
    .includes(name.toLowerCase());
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (await tableExists(queryInterface, 'syllabus_submissions')) return;
    await queryInterface.createTable('syllabus_submissions', {
      id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      course_code:     { type: Sequelize.STRING(32),  allowNull: false },
      course_name:     { type: Sequelize.STRING(255), allowNull: true },
      department_id: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'departments', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      department_name: { type: Sequelize.STRING(100), allowNull: true },
      instructor_name: { type: Sequelize.STRING(255), allowNull: true },
      status:          { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'Submitted' },
      submitted_at:    { type: Sequelize.DATE, allowNull: true },
      content:         { type: Sequelize.JSON, allowNull: true },
      period_id: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true,
        references: { model: 'academic_periods', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('syllabus_submissions');
  },
};
