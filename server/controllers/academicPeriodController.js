/**
 * Academic Period controller.
 *
 * listPeriods is intentionally fault-tolerant: if the database is
 * down or the table doesn't exist yet, it logs the issue and
 * returns []. This keeps the frontend dropdown from crashing — the
 * empty state in PeriodSelector then prompts the user to add a
 * period, which exercises createPeriod (which DOES surface its
 * errors so the user can react).
 *
 * Periods have a lifecycle status: 'Active' (editable) or 'Closed'
 * (globally read-only). closePeriod and reopenPeriod flip this flag.
 * Adding a new period does NOT auto-close older ones — that's the
 * OVPAA's explicit decision.
 */
import { Op } from 'sequelize';
import db from '../models/index.js';

const { AcademicPeriod } = db;

// Lazy auto-close engine: any Active period whose end_date has already
// passed gets flipped to Closed on the next list() call. No cron needed.
async function autoCloseExpired() {
  const today = new Date().toISOString().slice(0, 10);   // 'YYYY-MM-DD'
  try {
    await AcademicPeriod.update(
      { status: 'Closed', closed_at: new Date() },
      { where: { status: 'Active', end_date: { [Op.lt]: today, [Op.ne]: null } } },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[periods] auto-close pass failed:', err.message);
  }
}

export async function listPeriods(_req, res, _next) {
  try {
    await autoCloseExpired();
    const rows = await AcademicPeriod.findAll({
      order: [['sort_order', 'DESC'], ['label', 'ASC']],
    });
    res.json(rows);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[periods] list query failed, returning []:', err.message);
    res.json([]);
  }
}

export async function createPeriod(req, res, next) {
  try {
    const { label, school_year, semester, is_active, sort_order,
            start_date, end_date, midterm_deadline, finals_deadline } = req.body;
    if (!label || !school_year || !semester) {
      return res.status(400).json({ message: 'label, school_year, and semester are required' });
    }
    const created = await AcademicPeriod.create({
      label, school_year, semester,
      is_active: Boolean(is_active),
      sort_order: Number(sort_order || 0),
      status: 'Active',
      start_date:       start_date       || null,
      end_date:         end_date         || null,
      midterm_deadline: midterm_deadline || null,
      finals_deadline:  finals_deadline  || null,
    });
    res.status(201).json(created);
  } catch (err) { next(err); }
}

export async function updatePeriod(req, res, next) {
  try {
    const row = await AcademicPeriod.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Period not found' });
    const editable = ['label', 'school_year', 'semester', 'sort_order',
                      'start_date', 'end_date', 'midterm_deadline', 'finals_deadline'];
    const patch = {};
    for (const k of editable) {
      if (req.body[k] !== undefined) patch[k] = req.body[k] === '' ? null : req.body[k];
    }
    await row.update(patch);
    res.json(row);
  } catch (err) { next(err); }
}

export async function closePeriod(req, res, next) {
  try {
    const row = await AcademicPeriod.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Period not found' });
    if (row.status === 'Closed') return res.json(row);
    row.status = 'Closed';
    row.closed_at = new Date();
    await row.save();
    res.json(row);
  } catch (err) { next(err); }
}

export async function reopenPeriod(req, res, next) {
  try {
    const row = await AcademicPeriod.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Period not found' });
    if (row.status === 'Active') return res.json(row);
    row.status = 'Active';
    row.closed_at = null;
    await row.save();
    res.json(row);
  } catch (err) { next(err); }
}

export async function deletePeriod(req, res, next) {
  try {
    const n = await AcademicPeriod.destroy({ where: { id: req.params.id } });
    if (!n) return res.status(404).json({ message: 'Period not found' });
    res.status(204).end();
  } catch (err) { next(err); }
}
