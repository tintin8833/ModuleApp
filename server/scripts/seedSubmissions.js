/**
 * Seed sample syllabus & TOS submissions for the OVPAA dashboard demo.
 *
 * Run from the `server/` directory:
 *
 *     node scripts/seedSubmissions.js        (or: npm run seed:submissions)
 *
 * What it does:
 *   1. Picks a target period — the most-recent Active term, else the
 *      newest period of any status. (Create a period first if none exist.)
 *   2. Loads that period's departments (falls back to a default list if
 *      the period has none yet, storing department names denormalized).
 *   3. Clears existing submissions for the period, then inserts a varied
 *      spread of syllabus + TOS submissions across departments so the
 *      per-department charts and listings have meaningful data.
 *
 * Idempotent: re-running replaces the period's submissions.
 */
import db from '../models/index.js';
import { sequelize } from '../config/sequelize.js';
import { getActiveTermId } from '../utils/latestPeriod.js';

const { AcademicPeriod, Department, SyllabusSubmission, TosSubmission } = db;

const INSTRUCTORS = [
  'Norton, Monica', 'Trillanes, Agnes', 'Dela Cruz, Juan', 'Santos, Maria',
  'Reyes, Ana', 'Tan, Mark', 'Garcia, Liza', 'Mendoza, Paolo', 'Aquino, Bea', 'Lim, Carlo',
];

const COURSE_POOL = [
  { code: 'BSCS313L', name: 'Human & Computer Interaction', units: '3' },
  { code: 'BSCS214L', name: 'Data Structures and Algorithms', units: '3' },
  { code: 'BSIT201',  name: 'Operating Systems', units: '3' },
  { code: 'BSCS305',  name: 'Software Engineering', units: '3' },
  { code: 'BSIS210',  name: 'Database Management Systems', units: '3' },
  { code: 'GE104',    name: 'Purposive Communication', units: '3' },
  { code: 'MATH101',  name: 'Calculus I', units: '4' },
  { code: 'ENG201',   name: 'Technical Writing', units: '3' },
  { code: 'ACC110',   name: 'Financial Accounting', units: '3' },
  { code: 'BIO150',   name: 'General Biology', units: '4' },
  { code: 'CRIM220',  name: 'Criminal Law', units: '3' },
  { code: 'ARCH230',  name: 'Architectural Design', units: '5' },
];

const COGNITIVE_LEVELS = ['Remembering', 'Understanding', 'Applying', 'Analyzing', 'Evaluating', 'Creating'];

const at = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];

/** A date N days before now (varies submission timestamps). */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function buildSyllabusContent(course, instructor, deptName) {
  return {
    code: course.code,
    name: course.name,
    department: deptName,
    instructor,
    units: course.units,
    credits: course.units + ' units',
    prerequisites: 'None',
    description:
      'This course covers the foundational principles and applied practice of ' +
      course.name + '. Students engage with core concepts through lectures, ' +
      'laboratory work, and project-based assessment.',
    outcomes: [
      { id: 'CO1', text: 'Explain the core concepts of ' + course.name + '.' },
      { id: 'CO2', text: 'Apply techniques to solve representative problems.' },
      { id: 'CO3', text: 'Evaluate solutions and communicate results effectively.' },
    ],
    references: [
      { title: 'Foundations of ' + course.name, author: 'Various', year: 2022 },
      { title: course.name + ': A Practical Approach', author: 'Academic Press', year: 2021 },
    ],
    grading: [
      { component: 'Quizzes', weight: '20%' },
      { component: 'Laboratory / Projects', weight: '30%' },
      { component: 'Midterm Exam', weight: '20%' },
      { component: 'Final Exam', weight: '30%' },
    ],
  };
}

function buildTosContent(course, instructor, deptName) {
  const rows = [
    { topic: 'Introduction & Foundations', hours: 6, items: 8 },
    { topic: 'Core Methods', hours: 9, items: 12 },
    { topic: 'Applications & Case Studies', hours: 9, items: 12 },
    { topic: 'Synthesis & Evaluation', hours: 6, items: 8 },
  ].map((r, i) => ({
    ...r,
    percentage: [20, 30, 30, 20][i] + '%',
    cognitiveLevel: at(COGNITIVE_LEVELS, i + 1),
  }));
  const totalItems = rows.reduce((s, r) => s + r.items, 0);
  return {
    code: course.code,
    name: course.name,
    department: deptName,
    instructor,
    exam: 'Final Examination',
    totalItems,
    totalPoints: totalItems,
    specifications: rows,
  };
}

async function resolvePeriod() {
  let id = await getActiveTermId();
  if (!id) {
    const latest = await AcademicPeriod.findOne({ order: [['id', 'DESC']], raw: true });
    id = latest ? latest.id : null;
  }
  if (!id) return null;
  return AcademicPeriod.findByPk(id, { raw: true });
}

(async () => {
  try {
    await sequelize.authenticate();

    const period = await resolvePeriod();
    if (!period) {
      console.error('[seed] No academic period found. Create one in the app first, then re-run.');
      process.exitCode = 1;
      return;
    }
    console.log('[seed] target period: #' + period.id + ' "' + period.label + '" (status ' + period.status + ')');

    let depts = await Department.findAll({ where: { period_id: period.id }, raw: true });
    if (depts.length === 0) {
      console.log('[seed] period has no departments — using fallback list (names only).');
      depts = ['COE', 'CEA', 'CJE', 'SBA', 'SAS', 'SNAHS', 'SSNS'].map((code) => ({ id: null, code, name: code }));
    }
    console.log('[seed] departments: ' + depts.map((d) => d.code || d.name).join(', '));

    const removedS = await SyllabusSubmission.destroy({ where: { period_id: period.id } });
    const removedT = await TosSubmission.destroy({ where: { period_id: period.id } });
    console.log('[seed] cleared existing — syllabus: ' + removedS + ', tos: ' + removedT);

    const sylRecords = [];
    const tosRecords = [];
    let n = 0;

    depts.forEach((d, di) => {
      const deptName = d.name || d.code;
      const sylCount = 2 + (di % 4); // 2..5
      const tosCount = 1 + (di % 3); // 1..3

      for (let i = 0; i < sylCount; i += 1) {
        const course = at(COURSE_POOL, di * 3 + i);
        const instructor = at(INSTRUCTORS, di + i);
        sylRecords.push({
          course_code: course.code,
          course_name: course.name,
          department_id: d.id,
          department_name: deptName,
          instructor_name: instructor,
          status: 'Submitted',
          submitted_at: daysAgo((n += 1)),
          content: buildSyllabusContent(course, instructor, deptName),
          period_id: period.id,
        });
      }
      for (let i = 0; i < tosCount; i += 1) {
        const course = at(COURSE_POOL, di * 2 + i + 1);
        const instructor = at(INSTRUCTORS, di + i + 2);
        tosRecords.push({
          course_code: course.code,
          course_name: course.name,
          department_id: d.id,
          department_name: deptName,
          instructor_name: instructor,
          status: 'Submitted',
          submitted_at: daysAgo((n += 1)),
          content: buildTosContent(course, instructor, deptName),
          period_id: period.id,
        });
      }
    });

    await SyllabusSubmission.bulkCreate(sylRecords);
    await TosSubmission.bulkCreate(tosRecords);
    console.log('[seed] inserted — syllabus: ' + sylRecords.length + ', tos: ' + tosRecords.length);
    console.log('[seed] done.');
  } catch (err) {
    console.error('[seed] failed:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close().catch(() => {});
  }
})();
