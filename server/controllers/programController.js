import db from '../models/index.js';
import { parseSheet, safeUnlink, pick } from '../utils/excelParser.js';
import { getPeriodId, safeWhereForPeriod } from '../utils/periodScope.js';
import { filterOneToExistingColumns, safeDestroyByPeriod, safeWhere } from '../utils/dbHelpers.js';
import { bulkUpsert, describeSequelizeError } from '../utils/uploadHelpers.js';
import { cloneFromPriorPeriod } from '../utils/periodClone.js';
import { enforceLatestPeriod } from '../utils/latestPeriod.js';

const { Program, Faculty } = db;

// Strips honorifics so "Dr. Maria Santos" matches "Maria Santos".
// Mirrors normalizeName in courseAssignmentController.
const normalizeFacultyName = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/\b(dr|prof|professor|engr|engineer|atty|mr|mrs|ms|sir|maam|ma'?am)\.?\s+/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export async function listPrograms(req, res, next) {
  try {
    const where = await safeWhereForPeriod(Program, req);
    let rows = await Program.findAll({ where, order: [['code', 'ASC']] });
    const __period_id = getPeriodId(req);
    if (__period_id && rows.length === 0) {
      const __cloned = await cloneFromPriorPeriod(Program, __period_id, {
        attributes: ['code', 'name', 'program_head', 'status'],
        transform: (r) => ({ ...r }),
        updateKeys: ['name', 'program_head', 'status'],
      });
      if (__cloned) {
        console.log('[program] cloned ' + __cloned.count + ' rows from period ' + __cloned.source + ' → ' + __period_id);
        rows = await Program.findAll({ where, order: [['code', 'ASC']] });
      }
    }

    res.json(rows);
  } catch (err) { next(err); }
}

export async function getProgram(req, res, next) {
  try {
    const row = await Program.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Program not found' });
    res.json(row);
  } catch (err) { next(err); }
}

export async function createProgram(req, res, next) {
  try {
    const { code, name, program_head, status } = req.body;
    const period_id = getPeriodId(req);
    if (!code || !name) return res.status(400).json({ message: 'code and name are required' });
    if (!period_id)     return res.status(400).json({ message: 'period_id is required' });
    if (!(await enforceLatestPeriod(res, period_id))) return;
    const safe = await filterOneToExistingColumns(Program, { code, name, program_head, status: status || 'Active', period_id });
    const created = await Program.create(safe);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ message: describeSequelizeError(err) });
  }
}

export async function updateProgram(req, res) {
  try {
    const row = await Program.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Program not found' });
    const callerPeriod = getPeriodId(req);
    if (callerPeriod && row.period_id && row.period_id !== callerPeriod) {
      return res.status(403).json({ message: 'This program belongs to a different period; switch periods to edit it.' });
    }
    if (!(await enforceLatestPeriod(res, row.period_id || callerPeriod))) return;

    // Partial-update semantics: only copy keys that were sent.
    const patch = {};
    for (const k of ['code', 'name', 'program_head', 'status']) {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    }
    const safe = await filterOneToExistingColumns(Program, patch);
    await row.update(safe);
    res.json(row);
  } catch (err) {
    res.status(400).json({ message: describeSequelizeError(err) });
  }
}

export async function deleteProgram(req, res, next) {
  try {
    const row = await Program.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'Program not found' });
    if (!(await enforceLatestPeriod(res, row.period_id))) return;
    const n = await Program.destroy({ where: { id: req.params.id } });
    if (!n) return res.status(404).json({ message: 'Program not found' });
    res.status(204).end();
  } catch (err) { next(err); }
}

export async function uploadPrograms(req, res) {
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

    rows.forEach((row, i) => {
      const code         = pick(row, 'code');
      const name         = pick(row, 'name');
      const program_head = pick(row, 'programhead', 'facultyname', 'faculty', 'head');
      const status       = pick(row, 'status');
      if (!code || !name) {
        errors.push({ row: i + 2, message: 'Missing CODE or NAME — skipped.' });
        return;
      }
      records.push({
        code: String(code).trim(),
        name: String(name).trim(),
        program_head: program_head ? String(program_head).trim() : null,
        status: status ? String(status).trim() : 'Active',
        period_id,
      });
    });

    if (records.length === 0) {
      return res.status(400).json({ message: 'No valid rows found.', headers, errors });
    }

    const removed = await safeDestroyByPeriod(Program, period_id);
    const created = await bulkUpsert(Program, records, ['name', 'program_head', 'status']);

    // Cross-reference each row's program_head against the period's
    // Faculty master list. Rows whose head isn't a known Faculty name
    // surface as warnings so the UI can prompt the user per row.
    const facWhere = await safeWhere(Faculty, { period_id });
    const facultyList = await Faculty.findAll({ where: facWhere, attributes: ['name'] });
    const facultyKeys = new Set(facultyList.map((f) => normalizeFacultyName(f.name)));

    const insertedRows = await Program.findAll({
      where: await safeWhere(Program, { period_id }),
      attributes: ['id', 'code', 'name', 'program_head'],
    });
    const warnings = [];
    for (const row of insertedRows) {
      const head = row.program_head;
      if (!head) continue;   // No head specified: not a warning, just empty.
      if (!facultyKeys.has(normalizeFacultyName(head))) {
        warnings.push({ id: row.id, code: row.code, name: row.name, program_head: head });
      }
    }

    res.status(201).json({
      replaced: removed,
      inserted: created.length,
      skipped:  errors.length,
      errors,
      warnings,
      headers,
    });
  } catch (err) {
    res.status(400).json({ message: describeSequelizeError(err) });
  } finally {
    safeUnlink(req.file && req.file.path);
  }
}
