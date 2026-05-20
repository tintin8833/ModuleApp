/**
 * Course Assignment controller.
 *
 * The Course Assignment module owns its own table (course_assignments),
 * period-scoped and starting blank each term. Every row is validated
 * against the period's Course Offerings and Faculty master lists, which
 * derives its status:
 *
 *   Verified      — course + faculty both matched, faculty available.
 *   Pending Match — course code or faculty name not found in the lists.
 *   Flagged       — faculty matched but Inactive / On Leave.
 *
 * (A schedule conflict would also Flag a row, but there is no faculty
 * timetable in this module yet, so that path is not implemented.)
 */
import db from '../models/index.js';
import { parseSheet, safeUnlink, pick } from '../utils/excelParser.js';
import { getPeriodId, safeWhereForPeriod } from '../utils/periodScope.js';
import { filterOneToExistingColumns, safeDestroyByPeriod, safeWhere } from '../utils/dbHelpers.js';
import { describeSequelizeError } from '../utils/uploadHelpers.js';
import { enforceLatestPeriod } from '../utils/latestPeriod.js';

const { CourseAssignment, CourseOffering, Faculty } = db;

/**
 * Normalise a person's name for fuzzy matching: drop common honorifics
 * ("Dr.", "Prof.", "Engr."…) and collapse punctuation/whitespace, so
 * "Dr. Maria Santos" still matches a Faculty row stored as "Maria Santos".
 */
function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\b(dr|prof|professor|engr|engineer|atty|mr|mrs|ms|sir|maam|ma'?am)\.?\s+/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Load this period's Course Offerings and Faculty as lookup maps. Faculty
 * is keyed two ways — an exact (trim + lowercase) map and an honorific-
 * stripped map used as a fallback. Course status is included so the
 * status rules can require an *Active* course.
 */
async function loadMasterLists(period_id) {
  const coWhere = await safeWhere(CourseOffering, { period_id });
  const courses = await CourseOffering.findAll({ where: coWhere, attributes: ['id', 'code', 'status'] });
  const courseByCode = new Map(courses.map((c) => [String(c.code).trim().toLowerCase(), c]));

  const fWhere = await safeWhere(Faculty, { period_id });
  const facultyList = await Faculty.findAll({ where: fWhere, attributes: ['id', 'name', 'status'] });
  const facultyByName = new Map();   // exact: trim + lowercase
  const facultyByNorm = new Map();   // fallback: honorifics stripped
  for (const f of facultyList) {
    facultyByName.set(String(f.name).trim().toLowerCase(), f);
    facultyByNorm.set(normalizeName(f.name), f);
  }

  return { courseByCode, facultyByName, facultyByNorm };
}

/**
 * Resolve a course code + faculty name against the master-list maps and
 * derive { course_offering_id, faculty_id, status }.
 *
 *   Verified      — course + faculty both found AND both 'Active'.
 *   Pending Match — the course code or faculty name was not found.
 *   Flagged       — both found, but the course or faculty is not 'Active'
 *                   (e.g. faculty Inactive / On Leave / Emeritus).
 */
function resolveAssignment(courseCode, facultyName, lists) {
  const { courseByCode, facultyByName, facultyByNorm } = lists;

  const course = courseCode
    ? courseByCode.get(String(courseCode).trim().toLowerCase())
    : null;

  let faculty = null;
  if (facultyName) {
    faculty = facultyByName.get(String(facultyName).trim().toLowerCase())
      || facultyByNorm.get(normalizeName(facultyName))
      || null;
  }

  let status;
  if (!course || !faculty) {
    status = 'Pending Match';
  } else if (course.status !== 'Active' || faculty.status !== 'Active') {
    status = 'Flagged';
  } else {
    status = 'Verified';
  }
  return {
    course_offering_id: course ? course.id : null,
    faculty_id: faculty ? faculty.id : null,
    status,
  };
}

export async function listCourseAssignments(req, res, next) {
  try {
    const where = await safeWhereForPeriod(CourseAssignment, req);
    // Per spec: the Course Assignment table starts blank each term —
    // no clone-on-first-use.
    const rows = await CourseAssignment.findAll({ where, order: [['course_code', 'ASC']] });
    res.json(rows);
  } catch (err) { next(err); }
}

export async function getCourseAssignment(req, res, next) {
  try {
    const row = await CourseAssignment.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Course assignment not found' });
    res.json(row);
  } catch (err) { next(err); }
}

export async function createCourseAssignment(req, res) {
  try {
    const { course_code, course_name, faculty_name } = req.body;
    const period_id = getPeriodId(req);
    if (!course_code) return res.status(400).json({ message: 'course_code is required' });
    if (!period_id)   return res.status(400).json({ message: 'period_id is required' });
    if (!(await enforceLatestPeriod(res, period_id))) return;

    const lists = await loadMasterLists(period_id);
    const resolved = resolveAssignment(course_code, faculty_name, lists);

    const safe = await filterOneToExistingColumns(CourseAssignment, {
      course_code:  String(course_code).trim(),
      course_name:  course_name  ? String(course_name).trim()  : null,
      faculty_name: faculty_name ? String(faculty_name).trim() : null,
      ...resolved,
      period_id,
    });
    const created = await CourseAssignment.create(safe);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: describeSequelizeError(err) });
  }
}

export async function updateCourseAssignment(req, res) {
  try {
    const row = await CourseAssignment.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Course assignment not found' });
    const callerPeriod = getPeriodId(req);
    if (callerPeriod && row.period_id && row.period_id !== callerPeriod) {
      return res.status(403).json({ message: 'This assignment belongs to a different period; switch periods to edit it.' });
    }
    if (!(await enforceLatestPeriod(res, row.period_id || callerPeriod))) return;

    const patch = {};
    for (const k of ['course_code', 'course_name', 'faculty_name']) {
      if (req.body[k] !== undefined) patch[k] = req.body[k] === '' ? null : req.body[k];
    }

    if (req.body.status !== undefined) {
      // Explicit status change (e.g. the Edit modal's "Remove" → Archived):
      // respect it and skip re-validation so the chosen status sticks.
      patch.status = req.body.status;
    } else {
      // Re-resolve + recompute the status from the (possibly new) values.
      const course_code  = patch.course_code  !== undefined ? patch.course_code  : row.course_code;
      const faculty_name = patch.faculty_name !== undefined ? patch.faculty_name : row.faculty_name;
      const lists = await loadMasterLists(row.period_id);
      Object.assign(patch, resolveAssignment(course_code, faculty_name, lists));
    }

    const safe = await filterOneToExistingColumns(CourseAssignment, patch);
    await row.update(safe);
    res.json(row);
  } catch (err) {
    res.status(400).json({ message: describeSequelizeError(err) });
  }
}

export async function deleteCourseAssignment(req, res, next) {
  try {
    const row = await CourseAssignment.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Course assignment not found' });
    if (!(await enforceLatestPeriod(res, row.period_id))) return;
    await CourseAssignment.destroy({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function uploadCourseAssignments(req, res) {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const period_id = getPeriodId(req);
  if (!period_id) return res.status(400).json({ message: 'period_id is required (pass in form body).' });
  if (!(await enforceLatestPeriod(res, period_id))) {
    safeUnlink(req.file && req.file.path);
    return;
  }

  try {
    const { rows, headers } = parseSheet(req.file.path);
    const lists = await loadMasterLists(period_id);

    const records  = [];
    const errors   = [];
    const warnings = [];

    rows.forEach((row, i) => {
      const course_code  = pick(row, 'courseid', 'coursecode', 'code', 'courseno', 'coursenumber', 'subjectcode');
      const course_name  = pick(row, 'coursename', 'coursetitle', 'coursedescription', 'description', 'title', 'subjectname', 'name');
      const faculty_name = pick(row, 'facultyname', 'facultynames', 'assignedfacultyname', 'assignedfacultynames', 'assignedfaculty', 'faculty', 'faculties', 'facultymember', 'instructorname', 'instructor', 'professor', 'teacher');
      if (!course_code) {
        errors.push({ row: i + 2, message: 'Missing Course ID — skipped.' });
        return;
      }
      const resolved = resolveAssignment(course_code, faculty_name, lists);
      if (resolved.status !== 'Verified') {
        warnings.push({
          row: i + 2,
          course_code:  String(course_code).trim(),
          faculty_name: faculty_name ? String(faculty_name).trim() : '',
          status: resolved.status,
          message: resolved.status === 'Pending Match'
            ? "Course or faculty not found in this period's Course Offerings / Faculty lists."
            : 'Matched, but the course or faculty is not Active (Inactive / On Leave / Emeritus, etc.).',
        });
      }
      records.push({
        course_code:  String(course_code).trim(),
        course_name:  course_name  ? String(course_name).trim()  : null,
        faculty_name: faculty_name ? String(faculty_name).trim() : null,
        ...resolved,
        period_id,
      });
    });

    if (records.length === 0) {
      return res.status(400).json({ message: 'No valid rows found.', headers, errors });
    }

    const removed = await safeDestroyByPeriod(CourseAssignment, period_id);
    const created = await CourseAssignment.bulkCreate(records);

    res.status(201).json({
      replaced: removed,
      inserted: created.length,
      skipped:  errors.length,
      warnings,
      errors,
      headers,
    });
  } catch (err) {
    res.status(400).json({ message: describeSequelizeError(err) });
  } finally {
    safeUnlink(req.file && req.file.path);
  }
}
