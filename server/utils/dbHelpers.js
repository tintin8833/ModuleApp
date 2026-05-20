/**
 * Schema-aware helpers — make the controllers tolerant of stale
 * migrations.
 *
 * Three things every upload path needs:
 *   1. filterToExistingColumns(model, records)   — strip unknown
 *      keys from INSERT records.
 *   2. safeWhereForPeriod(model, period_id)      — return a where
 *      clause that only includes period_id if the column actually
 *      exists in the table.
 *   3. safeDestroyByPeriod(model, period_id)     — apply the upload
 *      override (delete this period's rows) only when the column
 *      exists; otherwise return 0 and leave data alone.
 *
 * All three consult a single cached describeTable() result per model.
 */
import { sequelize } from '../config/sequelize.js';

const columnCache = new Map(); // tableName -> Set<columnName>

async function getColumnSet(tableName) {
  if (columnCache.has(tableName)) return columnCache.get(tableName);
  const desc = await sequelize.getQueryInterface().describeTable(tableName);
  const set = new Set(Object.keys(desc));
  columnCache.set(tableName, set);
  return set;
}

export async function filterToExistingColumns(model, records) {
  const set = await getColumnSet(model.tableName);
  return records.map((r) => {
    const out = {};
    for (const k of Object.keys(r)) {
      if (set.has(k)) out[k] = r[k];
    }
    return out;
  });
}

export async function filterOneToExistingColumns(model, record) {
  const [filtered] = await filterToExistingColumns(model, [record]);
  return filtered;
}

/**
 * Build a `where` object whose keys are guaranteed to exist as columns
 * on the model's table. Unknown keys are silently dropped.
 */
export async function safeWhere(model, where) {
  const set = await getColumnSet(model.tableName);
  const out = {};
  for (const k of Object.keys(where || {})) {
    if (set.has(k)) out[k] = where[k];
  }
  return out;
}

/**
 * Delete a period's existing rows from `model`'s table — but only if
 * the table actually has a `period_id` column. If it doesn't (stale
 * schema), return 0 instead of throwing. The upload still proceeds;
 * data simply accumulates instead of being replaced.
 */
export async function safeDestroyByPeriod(model, period_id) {
  const set = await getColumnSet(model.tableName);
  if (!set.has('period_id')) return 0;
  return model.destroy({ where: { period_id } });
}

export function clearColumnCache() {
  columnCache.clear();
}
