import db from '../models/index.js';
import { parseSheet, safeUnlink, pick } from '../utils/excelParser.js';
import { getPeriodId, safeWhereForPeriod } from '../utils/periodScope.js';
import { filterOneToExistingColumns, safeDestroyByPeriod, safeWhere } from '../utils/dbHelpers.js';
import { bulkUpsert, describeSequelizeError } from '../utils/uploadHelpers.js';
import { cloneFromPriorPeriod } from '../utils/periodClone.js';
import { enforceLatestPeriod } from '../utils/latestPeriod.js';

const { CourseOffering, Faculty } = db;

export async function listCourseOfferings(req, res, next) {
  try {
    const period_id = getPeriodId(req);
    const where = await safeWhereForPeriod(CourseOffering, req);
    let rows = await CourseOffering.findAll({
      where,
      order: [['code', 'ASC']],
      include: [{ model: Faculty, as: 'instructor', attributes: ['id', 'name', 'role'] }],
    });

    // Clone-on-first-use: when a brand-new term has no course offerings
    // yet, copy the most recent prior term's offerings forward so the
    // user starts with last term's roster (mirrors Departments / Programs
    // / Faculty behavior). Status resets to 'Active' on copy; cancelled
    // or unlisted rows come over as Active so the new term starts clean.
    if (period_id && rows.length === 0) {
      const cloned = await cloneFromPriorPeriod(CourseOffering, period_id, {
        attributes: ['code', 'title', 'year_level', 'units', 'instructor_name', 'term'],
        transform: (r) => ({
          code: r.code, title: r.title,
          year_level: r.year_level, units: r.units,
          instructor_name: r.instructor_name, term: r.term,
          status: 'Active',
        }),
        updateKeys: ['title', 'year_level', 'units', 'instructor_name', 'term', 'status'],
      });
      if (cloned) {
        // eslint-disable-next-line no-console
        console.log('[course_offerings] cloned ' + cloned.count + ' rows from period ' + cloned.source + ' → ' + period_id);
        rows = await CourseOffering.findAll({
          where,
          order: [['code', 'ASC']],
          include: [{ model: Faculty, as: 'instructor', attributes: ['id', 'name', 'role'] }],
        });
      }
    }

    res.json(rows);
  } catch (err) { next(err); }
}

export async function getCourseOffering(req, res, next) {
  try {
    const row = await CourseOffering.findByPk(req.params.id, {
      include: [{ model: Faculty, as: 'instructor' }],
    });
    if (!row) return res.status(404).json({ message: 'Course offering not found' });
    res.json(row);
  } catch (err) { next(err); }
}

export async function createCourseOffering(req, res, next) {
  try {
    const { code, title, units, term, instructor_name } = req.body;
    const period_id = getPeriodId(req);
    if (!code || !title) return res.status(400).json({ message: 'code and title are required' });
    if (!period_id)      return res.status(400).json({ message: 'period_id is required' });
    if (!(await enforceLatestPeriod(res, period_id))) return;

    let instructor_id = null;
    if (instructor_name) {
      const where = await safeWhere(Faculty, { name: instructor_name, period_id });
      const faculty = await Faculty.findOne({ where, attributes: ['id', 'name'] });
      if (faculty) instructor_id = faculty.id;
    }

    const safe = await filterOneToExistingColumns(CourseOffering, {
      code, title, units, term, instructor_name, instructor_id, period_id,
    });
    const created = await CourseOffering.create(safe);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: describeSequelizeError(err) });
  }
}

export async function updateCourseOffering(req, res) {
  try {
    const row = await CourseOffering.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Course offering not found' });
    const callerPeriod = getPeriodId(req);
    if (callerPeriod && row.period_id && row.period_id !== callerPeriod) {
      return res.status(403).json({ message: 'This course belongs to a different period; switch periods to edit it.' });
    }
    if (!(await enforceLatestPeriod(res, row.period_id || callerPeriod))) return;

    // Partial-update semantics: leave un-sent keys alone.
    const editable = ['code', 'title', 'year_level', 'units', 'term', 'instructor_name', 'status'];
    const patch = {};
    for (const k of editable) {
      if (req.body[k] !== undefined) patch[k] = req.body[k] === '' ? null : req.body[k];
    }

    // If instructor_name changed, re-resolve instructor_id within the
    // same period so the FK stays consistent.
    if (patch.instructor_name !== undefined) {
      if (!patch.instructor_name) {
        patch.instructor_id = null;
      } else {
        const where = await safeWhere(Faculty, { name: patch.instructor_name, period_id: row.period_id });
        const faculty = await Faculty.findOne({ where, attributes: ['id'] });
        patch.instructor_id = faculty ? faculty.id : null;
      }
    }

    const safe = await filterOneToExistingColumns(CourseOffering, patch);
    await row.update(safe);
    res.json(row);
  } catch (err) {
    res.status(400).json({ message: describeSequelizeError(err) });
  }
}

export async function assignInstructor(req, res) {
  try {
    const { instructor_name } = req.body;
    const course = await CourseOffering.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course offering not found' });
    if (!(await enforceLatestPeriod(res, course.period_id))) return;

    if (!instructor_name) {
      course.instructor_id = null;
      course.instructor_name = null;
      await course.save();
      return res.json(course);
    }

    const where = await safeWhere(Faculty, { name: instructor_name, period_id: course.period_id });
    const faculty = await Faculty.findOne({ where, attributes: ['id', 'name'] });
    if (!faculty) {
      // Not found — store the name anyway, mark as unresolved.
      course.instructor_name = String(instructor_name).trim();
      course.instructor_id = null;
    } else {
      course.instructor_id = faculty.id;
      course.instructor_name = faculty.name;
    }
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(400).json({ message: describeSequelizeError(err) });
  }
}

export async function deleteCourseOffering(req, res, next) {
  try {
    const row = await CourseOffering.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Course offering not found' });
    if (!(await enforceLatestPeriod(res, row.period_id))) return;
    const n = await CourseOffering.destroy({ where: { id: req.params.id } });
    if (!n) return res.status(404).json({ message: 'Course offering not found' });
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function uploadCourseOfferings(req, res) {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const period_id = getPeriodId(req);
  if (!period_id) return res.status(400).json({ message: 'period_id is required (pass in form body).' });
  if (!(await enforceLatestPeriod(res, period_id))) {
    safeUnlink(req.file && req.file.path);
    return;
  }

  try {
    const { rows, headers } = parseSheet(req.file.path);

    const facWhere = await safeWhere(Faculty, { period_id });
    const facultyList = await Faculty.findAll({ where: facWhere, attributes: ['id', 'name'] });
    const facultyByName = new Map(facultyList.map((f) => [f.name.toLowerCase(), f]));

    const records = [];
    const errors  = [];

    rows.forEach((row, i) => {
      const code  = pick(row, 'code');
      // Accept any of: DESCRIPTION, COURSE TITLE, TITLE, COURSE NAME, NAME.
      const title = pick(row, 'description', 'coursetitle', 'coursename', 'title', 'name');
      const units = pick(row, 'units', 'unit');
      const term  = pick(row, 'term', 'semester');
      const yearL = pick(row, 'yearlevel', 'year');
      const instr = pick(row, 'instructor', 'instructorname');

      if (!code || !title) {
        errors.push({ row: i + 2, message: 'Missing CODE or DESCRIPTION/TITLE — skipped.' });
        return;
      }

      let instructor_id = null;
      if (instr) {
        const f = facultyByName.get(String(instr).toLowerCase());
        if (f) instructor_id = f.id;
        else errors.push({ row: i + 2, message: 'Instructor "' + instr + '" not found in Faculty for this period; saved as unresolved.', level: 'warning' });
      }

      records.push({
        code:  String(code).trim(),
        title: String(title).trim(),
        year_level: yearL ? String(yearL).trim() : null,
        units: units !== null && units !== undefined && units !== '' ? Number(units) : null,
        term:  term ? String(term).trim() : null,
        instructor_name: instr ? String(instr).trim() : null,
        instructor_id,
        period_id,
      });
    });

    if (records.length === 0) {
      return res.status(400).json({ message: 'No valid rows found.', headers, errors });
    }

    const removed = await safeDestroyByPeriod(CourseOffering, period_id);
    const created = await bulkUpsert(
      CourseOffering, records,
      ['title', 'year_level', 'units', 'term', 'instructor_name', 'instructor_id']
    );

    res.status(201).json({
      replaced: removed,
      inserted: created.length,
      skipped:  errors.filter((e) => e.level !== 'warning').length,
      warnings: errors.filter((e) => e.level === 'warning').length,
      errors,
      headers,
    });
  } catch (err) {
    res.status(400).json({ message: describeSequelizeError(err) });
  } finally {
    safeUnlink(req.file && req.file.path);
  }
}
