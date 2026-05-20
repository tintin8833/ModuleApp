import { Op } from 'sequelize';
import db from '../models/index.js';
import { parseSheet, safeUnlink, pick } from '../utils/excelParser.js';
import { getPeriodId, safeWhereForPeriod } from '../utils/periodScope.js';
import { filterOneToExistingColumns, safeDestroyByPeriod, safeWhere } from '../utils/dbHelpers.js';
import { describeSequelizeError } from '../utils/uploadHelpers.js';
import { enforceLatestPeriod } from '../utils/latestPeriod.js';

const { IndustryConsultant, CourseOffering, ConsultantCourse } = db;

/**
 * Find course codes already assigned to OTHER consultants in the same
 * period. A course offering can only be held by one consultant at a
 * time (exclusion rule), so the UI hides taken courses from the picker
 * and this is the server-side belt-and-suspenders check for races.
 *
 * Returns: [{ code, consultantId, consultantName }, ...]
 */
async function findCrossConsultantConflicts({ consultantId, periodId, codes }) {
  const requested = (Array.isArray(codes) ? codes : [])
    .map((c) => String(c).trim()).filter(Boolean);
  if (requested.length === 0) return [];

  const peers = await IndustryConsultant.findAll({
    where: { period_id: periodId, id: { [Op.ne]: consultantId } },
    attributes: ['id', 'name'],
    include: [{ model: ConsultantCourse, as: 'courseLinks', attributes: ['course_code'] }],
  });

  const requestedLower = new Set(requested.map((c) => c.toLowerCase()));
  const conflicts = [];
  for (const peer of peers) {
    for (const link of (peer.courseLinks || [])) {
      const code = link.course_code;
      if (code && requestedLower.has(String(code).toLowerCase())) {
        conflicts.push({ code, consultantId: peer.id, consultantName: peer.name });
      }
    }
  }
  return conflicts;
}

// Include used everywhere a consultant is returned so the frontend
// always gets the full list of assigned courses.
const coursesInclude = {
  model: CourseOffering,
  as: 'courses',
  through: { attributes: [] },
  attributes: ['id', 'code', 'title'],
};

/**
 * Replace a consultant's assigned-course links with `codes`.
 * Each code is resolved to a CourseOffering within the consultant's
 * period; an unmatched code is still stored (with a null FK) so the
 * raw value is not lost.
 */
async function syncConsultantCourses(consultantId, periodId, codes) {
  const list = Array.isArray(codes)
    ? [...new Set(codes.map((c) => String(c).trim()).filter(Boolean))]
    : [];

  await ConsultantCourse.destroy({ where: { consultant_id: consultantId } });
  if (list.length === 0) return;

  const where = await safeWhere(CourseOffering, { period_id: periodId });
  const courses = await CourseOffering.findAll({ where, attributes: ['id', 'code'] });
  const byCode = new Map(courses.map((c) => [String(c.code).toLowerCase(), c]));

  const joinRows = list.map((code) => {
    const c = byCode.get(code.toLowerCase());
    return {
      consultant_id: consultantId,
      course_offering_id: c ? c.id : null,
      course_code: c ? c.code : code,
    };
  });
  await ConsultantCourse.bulkCreate(joinRows);
}

export async function listConsultants(req, res, next) {
  try {
    const where = await safeWhereForPeriod(IndustryConsultant, req);
    const rows = await IndustryConsultant.findAll({
      where,
      order: [['name', 'ASC']],
      include: [coursesInclude],
    });
    // Per OVPAA spec: Industry Consultant table starts blank in every
    // new term. No clone-on-first-use here.
    res.json(rows);
  } catch (err) { next(err); }
}

export async function getConsultant(req, res, next) {
  try {
    const row = await IndustryConsultant.findByPk(req.params.id, {
      include: [coursesInclude],
    });
    if (!row) return res.status(404).json({ message: 'Consultant not found' });
    res.json(row);
  } catch (err) { next(err); }
}

export async function createConsultant(req, res) {
  try {
    const { name, status, assigned_course_code, assigned_course_codes } = req.body;
    const period_id = getPeriodId(req);
    if (!name)      return res.status(400).json({ message: 'name is required' });
    if (!period_id) return res.status(400).json({ message: 'period_id is required' });
    if (!(await enforceLatestPeriod(res, period_id))) return;
    const safe = await filterOneToExistingColumns(IndustryConsultant, {
      name, status: status || null, assigned_course_code, period_id,
    });
    const created = await IndustryConsultant.create(safe);
    if (Array.isArray(assigned_course_codes)) {
      await syncConsultantCourses(created.id, period_id, assigned_course_codes);
    }
    const withCourses = await IndustryConsultant.findByPk(created.id, { include: [coursesInclude] });
    res.status(201).json(withCourses);
  } catch (err) {
    res.status(400).json({ message: describeSequelizeError(err) });
  }
}

export async function updateConsultant(req, res) {
  try {
    const row = await IndustryConsultant.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Consultant not found' });
    const callerPeriod = getPeriodId(req);
    if (callerPeriod && row.period_id && row.period_id !== callerPeriod) {
      return res.status(403).json({ message: 'This consultant belongs to a different period; switch periods to edit it.' });
    }
    if (!(await enforceLatestPeriod(res, row.period_id || callerPeriod))) return;

    // Partial-update semantics: only copy keys that were sent.
    const editable = ['name', 'status'];
    const patch = {};
    for (const k of editable) {
      if (req.body[k] !== undefined) patch[k] = req.body[k] === '' ? null : req.body[k];
    }
    const safe = await filterOneToExistingColumns(IndustryConsultant, patch);
    await row.update(safe);

    // Flipping a consultant to Unavailable releases their courses so
    // other consultants can pick them up (the row also moves to archive).
    if (patch.status === 'Unavailable') {
      await ConsultantCourse.destroy({ where: { consultant_id: row.id } });
    }

    // The assigned courses are managed through the join table.
    if (Array.isArray(req.body.assigned_course_codes)) {
      const conflicts = await findCrossConsultantConflicts({
        consultantId: row.id, periodId: row.period_id, codes: req.body.assigned_course_codes,
      });
      if (conflicts.length > 0) {
        return res.status(409).json({
          message: 'One or more courses are already assigned to another consultant in this period.',
          conflicts,
        });
      }
      await syncConsultantCourses(row.id, row.period_id, req.body.assigned_course_codes);
    }

    const updated = await IndustryConsultant.findByPk(row.id, { include: [coursesInclude] });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: describeSequelizeError(err) });
  }
}

/**
 * PATCH /:id/assign — replace a consultant's assigned courses.
 * Accepts `assigned_course_codes` (array). The legacy singular
 * `assigned_course_code` is still accepted and treated as a 1-element list.
 */
export async function assignCourse(req, res) {
  try {
    let codes = req.body.assigned_course_codes;
    if (codes === undefined && req.body.assigned_course_code !== undefined) {
      codes = req.body.assigned_course_code ? [req.body.assigned_course_code] : [];
    }
    if (!Array.isArray(codes)) codes = [];

    const consultant = await IndustryConsultant.findByPk(req.params.id);
    if (!consultant) return res.status(404).json({ message: 'Consultant not found' });
    if (!(await enforceLatestPeriod(res, consultant.period_id))) return;

    // The Assign popup also chooses the consultant's status. Unavailable
    // automatically clears any assigned courses (and the UI disables the
    // course picker), so codes is ignored in that case.
    const nextStatus = req.body.status;
    if (nextStatus !== undefined) {
      await consultant.update({ status: nextStatus || null });
    }

    if (nextStatus === 'Unavailable') {
      await ConsultantCourse.destroy({ where: { consultant_id: consultant.id } });
    } else {
      const conflicts = await findCrossConsultantConflicts({
        consultantId: consultant.id, periodId: consultant.period_id, codes,
      });
      if (conflicts.length > 0) {
        return res.status(409).json({
          message: 'One or more courses are already assigned to another consultant in this period.',
          conflicts,
        });
      }
      await syncConsultantCourses(consultant.id, consultant.period_id, codes);
    }

    const updated = await IndustryConsultant.findByPk(consultant.id, { include: [coursesInclude] });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: describeSequelizeError(err) });
  }
}

export async function deleteConsultant(req, res, next) {
  try {
    const row = await IndustryConsultant.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Consultant not found' });
    if (!(await enforceLatestPeriod(res, row.period_id))) return;
    // consultant_courses rows are removed via ON DELETE CASCADE.
    const n = await IndustryConsultant.destroy({ where: { id: req.params.id } });
    if (!n) return res.status(404).json({ message: 'Consultant not found' });
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function uploadConsultants(req, res) {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const period_id = getPeriodId(req);
  if (!period_id) return res.status(400).json({ message: 'period_id is required (pass in form body).' });
  if (!(await enforceLatestPeriod(res, period_id))) {
    safeUnlink(req.file && req.file.path);
    return;
  }

  try {
    const { rows, headers } = parseSheet(req.file.path);

    const coWhere = await safeWhere(CourseOffering, { period_id });
    const courses = await CourseOffering.findAll({ where: coWhere, attributes: ['id', 'code'] });
    const courseByCode = new Map(courses.map((c) => [String(c.code).toLowerCase(), c]));

    const records = [];   // { name, assigned_course_code, codes: [] }
    const errors  = [];

    rows.forEach((row, i) => {
      const name = pick(row, 'name');
      const assigned = pick(row, 'assignedcourse', 'course');
      if (!name) {
        errors.push({ row: i + 2, message: 'Missing Name — skipped.' });
        return;
      }
      // The "Assigned Course" cell may list several courses.
      const codes = assigned
        ? String(assigned).split(/[,;]/).map((s) => s.trim()).filter(Boolean)
        : [];
      codes.forEach((code) => {
        if (!courseByCode.get(code.toLowerCase())) {
          errors.push({
            row: i + 2,
            message: 'Course "' + code + '" not found in this period\'s Course Offerings; manual assignment required.',
            level: 'warning',
          });
        }
      });
      records.push({
        name: String(name).trim(),
        assigned_course_code: assigned ? String(assigned).trim() : null,
        codes,
      });
    });

    if (records.length === 0) {
      return res.status(400).json({ message: 'No valid rows found.', headers, errors });
    }

    // Replace the period's consultants (CASCADE clears their join rows),
    // then recreate each consultant with its course links.
    const removed = await safeDestroyByPeriod(IndustryConsultant, period_id);
    let inserted = 0;
    for (const rec of records) {
      const consultant = await IndustryConsultant.create({
        name: rec.name,
        assigned_course_code: rec.assigned_course_code,
        period_id,
        status: 'Active',   // bulk uploads default to Active, like manual adds
      });
      inserted += 1;
      if (rec.codes.length > 0) {
        const joinRows = rec.codes.map((code) => {
          const c = courseByCode.get(code.toLowerCase());
          return {
            consultant_id: consultant.id,
            course_offering_id: c ? c.id : null,
            course_code: c ? c.code : code,
          };
        });
        await ConsultantCourse.bulkCreate(joinRows);
      }
    }

    res.status(201).json({
      replaced: removed,
      inserted,
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
