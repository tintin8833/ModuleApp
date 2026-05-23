/**
 * Shared controller for syllabus & TOS submissions.
 *
 * Both resources are identical in shape (period-scoped, department-
 * scoped, JSON content), so a single factory produces the handlers for
 * each. Pass the model key ('SyllabusSubmission' | 'TosSubmission').
 *
 * Endpoints:
 *   list    GET /        — period-scoped; optional ?department_id filter
 *   summary GET /summary — per-department counts for the dashboard chart
 *   get     GET /:id     — one submission (with department + period)
 *   create  POST /       — create one (used for seeding / manual entry)
 */
import db from '../models/index.js';
import { getPeriodId, safeWhereForPeriod } from '../utils/periodScope.js';

export function makeSubmissionController(modelKey) {
  const Model = db[modelKey];
  const { Department, AcademicPeriod } = db;

  async function list(req, res, next) {
    try {
      const where = await safeWhereForPeriod(Model, req);
      const departmentId = req.query.department_id ? Number(req.query.department_id) : null;
      if (departmentId) where.department_id = departmentId;
      const rows = await Model.findAll({
        where,
        order: [['submitted_at', 'DESC'], ['course_code', 'ASC']],
        include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'], required: false }],
      });
      res.json(rows);
    } catch (err) { next(err); }
  }

  async function summary(req, res, next) {
    try {
      const where = await safeWhereForPeriod(Model, req);
      const rows = await Model.findAll({
        where,
        attributes: ['department_id', 'department_name'],
        raw: true,
      });
      const byDept = new Map();
      for (const r of rows) {
        const key = r.department_id != null ? String(r.department_id) : ('name:' + (r.department_name || 'Unassigned'));
        const entry = byDept.get(key) || {
          department_id: r.department_id ?? null,
          department_name: r.department_name || 'Unassigned',
          count: 0,
        };
        entry.count += 1;
        byDept.set(key, entry);
      }
      res.json(Array.from(byDept.values()));
    } catch (err) { next(err); }
  }

  async function get(req, res, next) {
    try {
      const row = await Model.findByPk(req.params.id, {
        include: [
          { model: Department, as: 'department', attributes: ['id', 'name', 'code'], required: false },
          { model: AcademicPeriod, as: 'period', attributes: ['id', 'label'], required: false },
        ],
      });
      if (!row) return res.status(404).json({ message: 'Submission not found.' });
      res.json(row);
    } catch (err) { next(err); }
  }

  async function create(req, res, next) {
    try {
      const period_id = getPeriodId(req);
      const course_code = String(req.body.course_code || '').trim();
      if (!course_code) return res.status(400).json({ message: 'course_code is required.' });
      const created = await Model.create({
        course_code,
        course_name: req.body.course_name || null,
        department_id: req.body.department_id ? Number(req.body.department_id) : null,
        department_name: req.body.department_name || null,
        instructor_name: req.body.instructor_name || null,
        status: req.body.status || 'Submitted',
        submitted_at: req.body.submitted_at ? new Date(req.body.submitted_at) : new Date(),
        content: req.body.content ?? null,
        period_id,
      });
      res.status(201).json(created);
    } catch (err) { next(err); }
  }

  return { list, summary, get, create };
}
