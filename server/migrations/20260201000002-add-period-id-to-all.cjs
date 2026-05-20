'use strict';

/**
 * Add a nullable `period_id` foreign key to every resource table.
 * Nullable so existing seeded rows keep working; new uploads will
 * always pass it through.
 *
 * Also relaxes the unique-on-code constraint to be unique per
 * (code, period_id) for `programs` and `course_offerings`, because
 * the same course code legitimately reappears across periods.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const addPeriodFk = (table) => queryInterface.addColumn(table, 'period_id', {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'academic_periods', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await addPeriodFk('departments');
    await addPeriodFk('faculty');
    await addPeriodFk('programs');
    await addPeriodFk('course_offerings');
    await addPeriodFk('industry_consultants');

    // Backfill existing rows to the first seeded period so anything
    // already in the DB stays visible under the default dropdown.
    const [periods] = await queryInterface.sequelize.query(
      "SELECT id FROM academic_periods ORDER BY sort_order DESC LIMIT 1"
    );
    if (periods.length) {
      const pid = periods[0].id;
      await queryInterface.sequelize.query(`UPDATE departments         SET period_id = ${pid} WHERE period_id IS NULL`);
      await queryInterface.sequelize.query(`UPDATE faculty             SET period_id = ${pid} WHERE period_id IS NULL`);
      await queryInterface.sequelize.query(`UPDATE programs            SET period_id = ${pid} WHERE period_id IS NULL`);
      await queryInterface.sequelize.query(`UPDATE course_offerings    SET period_id = ${pid} WHERE period_id IS NULL`);
      await queryInterface.sequelize.query(`UPDATE industry_consultants SET period_id = ${pid} WHERE period_id IS NULL`);
    }

    // MySQL stores unique constraints as indexes. We need to drop the
    // single-column unique index on `code` for programs and
    // course_offerings, then recreate as a composite unique on
    // (code, period_id). Use try/catch so re-running migrations is
    // tolerant of older databases that don't have these exact names.
    const safeRemove = async (table, idx) => {
      try { await queryInterface.removeIndex(table, idx); } catch (_) { /* ignore */ }
    };
    await safeRemove('programs',         'code');
    await safeRemove('programs',         'programs_code');
    await safeRemove('course_offerings', 'code');
    await safeRemove('course_offerings', 'course_offerings_code');
    await safeRemove('departments',      'code');
    await safeRemove('departments',      'departments_code');

    await queryInterface.addIndex('programs',         { fields: ['code', 'period_id'], unique: true, name: 'programs_code_period_unique' });
    await queryInterface.addIndex('course_offerings', { fields: ['code', 'period_id'], unique: true, name: 'course_offerings_code_period_unique' });
    await queryInterface.addIndex('departments',      { fields: ['code', 'period_id'], unique: true, name: 'departments_code_period_unique' });
  },

  async down(queryInterface /*, Sequelize */) {
    const safeRemove = async (table, idx) => {
      try { await queryInterface.removeIndex(table, idx); } catch (_) { /* ignore */ }
    };
    await safeRemove('programs',         'programs_code_period_unique');
    await safeRemove('course_offerings', 'course_offerings_code_period_unique');
    await safeRemove('departments',      'departments_code_period_unique');

    await queryInterface.removeColumn('industry_consultants', 'period_id');
    await queryInterface.removeColumn('course_offerings',     'period_id');
    await queryInterface.removeColumn('programs',             'period_id');
    await queryInterface.removeColumn('faculty',              'period_id');
    await queryInterface.removeColumn('departments',          'period_id');
  },
};
