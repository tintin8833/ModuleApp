/**
 * Department controller — HR Staff, period-scoped with clone-on-
 * first-use continuity.
 */
import db from '../models/index.js';
import { parseSheet, safeUnlink, pick } from '../utils/excelParser.js';
import { getPeriodId, safeWhereForPeriod } from '../utils/periodScope.js';
import { filterOneToExistingColumns } from '../utils/dbHelpers.js';
import { bulkUpsert, describeSequelizeError } from '../utils/uploadHelpers.js';
import { cloneFromPriorPeriod } from '../utils/periodClone.js';
import { enforceLatestPeriod } from '../utils/latestPeriod.js';

const { Department } = db;

export async function listDepartments(req, res, next) {
  try {
    const period_id = getPeriodId(req);
    const where = await safeWhereForPeriod(Department, req);
    let rows = await Department.findAll({ where, order: [['name', 'ASC']] });

    if (period_id && rows.length === 0) {
      // Preserve the source row's status — if a department was
      // Unlisted in the previous period, it stays Unlisted in this
      // one (the user can flip it back to Active via the row Edit
      // modal).
      const cloned = await cloneFromPriorPeriod(Department, period_id, {
        attributes: ['name', 'code', 'dean', 'status'],
        transform: (r) => ({ name: r.name, code: r.code, dean: r.dean, status: r.status || 'Active' }),
        updateKeys: ['name', 'dean', 'status'],
      });
      if (cloned) {
        // eslint-disable-next-line no-console
        console.log('[departments] cloned ' + cloned.count + ' rows from period ' + cloned.source + ' → ' + period_id);
        rows = await Department.findAll({ where, order: [['name', 'ASC']] });
      }
    }

    res.json(rows);
  } catch (err) { next(err); }
}

export async function getDepartment(req, res, next) {
  try {
    const row = await Department.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Department not found' });
    res.json(row);
  } catch (err) { next(err); }
}

export async function createDepartment(req, res) {
  try {
    const { name, code, dean, status } = req.body;
    const period_id = getPeriodId(req);
    if (!name || !code) return res.status(400).json({ message: 'name and code are required' });
    if (!period_id)     return res.status(400).json({ message: 'period_id is required' });
    if (!(await enforceLatestPeriod(res, period_id))) return;
    const safe = await filterOneToExistingColumns(Department, {
      name, code, dean, status: status || 'Active', period_id,
    });
    const created = await Department.create(safe);
    res.status(201).json(created);
  } catch (err) { res.status(400).json({ message: describeSequelizeError(err) }); }
}

export async function updateDepartment(req, res) {
  try {
    const row = await Department.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Department not found' });
    const callerPeriod = getPeriodId(req);
    if (callerPeriod && row.period_id && row.period_id !== callerPeriod) {
      return res.status(403).json({ message: 'This department belongs to a different period; switch periods to edit it.' });
    }
    if (!(await enforceLatestPeriod(res, row.period_id || callerPeriod))) return;
    const patch = {};
    for (const k of ['name', 'code', 'dean', 'status']) {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    }
    const safe = await filterOneToExistingColumns(Department, patch);
    await row.update(safe);
    res.json(row);
  } catch (err) { res.status(400).json({ message: describeSequelizeError(err) }); }
}

export async function unlistMany(req, res) {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
    if (ids.length === 0) return res.status(400).json({ message: 'No ids provided.' });
    const callerPeriod = getPeriodId(req);
    if (callerPeriod && !(await enforceLatestPeriod(res, callerPeriod))) return;
    const where = callerPeriod ? { id: ids, period_id: callerPeriod } : { id: ids };
    await Department.update({ status: 'Unlisted' }, { where });
    res.json({ unlisted: ids.length });
  } catch (err) { res.status(400).json({ message: describeSequelizeError(err) }); }
}

export async function deleteDepartment(req, res, next) {
  try {
    const callerPeriod = getPeriodId(req);
    const row = await Department.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Department not found.' });
    if (!(await enforceLatestPeriod(res, row.period_id || callerPeriod))) return;
    const where = callerPeriod ? { id: req.params.id, period_id: callerPeriod } : { id: req.params.id };
    const n = await Department.destroy({ where });
    if (!n) return res.status(404).json({ message: 'Department not found (or it belongs to a different period).' });
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function uploadDepartments(req, res) {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  const period_id = getPeriodId(req);
  if (!period_id) return res.status(400).json({ message: 'period_id is required (pass in form body).' });
  if (!(await enforceLatestPeriod(res, period_id))) {
    safeUnlink(req.file && req.file.path);
    return;
  }

  try {
    const { rows, headers } = parseSheet(req.file.path);
    const records = [];
    const errors  = [];
    const seenNames = new Set();

    rows.forEach((row, i) => {
      const name = pick(row, 'name');
      const code = pick(row, 'code');
      const dean = pick(row, 'dean');
      if (!name || !code) {
        errors.push({ row: i + 2, message: 'Missing NAME or CODE — skipped.' });
        return;
      }
      seenNames.add(String(name).trim().toLowerCase());
      records.push({
        name: String(name).trim(),
        code: String(code).trim(),
        dean: dean ? String(dean).trim() : null,
        status: 'Active',
        period_id,
      });
    });

    if (records.length === 0) {
      return res.status(400).json({ message: 'No valid rows found.', headers, errors });
    }

    const existing = await Department.findAll({
      where: { period_id },
      attributes: ['id', 'name', 'code', 'status'],
      raw: true,
    });
    const created = await bulkUpsert(Department, records, ['name', 'dean', 'status']);
    const missing = existing.filter((row) => !seenNames.has(String(row.name).trim().toLowerCase()));

    res.status(201).json({ inserted: created.length, skipped: errors.length, errors, headers, missing });
  } catch (err) {
    res.status(400).json({ message: describeSequelizeError(err) });
  } finally {
    safeUnlink(req.file && req.file.path);
  }
}
