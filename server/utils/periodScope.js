/**
 * Helpers for period-scoped routes.
 *
 * `getPeriodId(req)` reads the period id from query string or body.
 *
 * `whereForPeriod(req)` returns a synchronous where-clause helper
 * for the simple case (callers that already know period_id is on
 * the table). The async `safeWhereForPeriod(model, req)` is the
 * defensive variant — it drops the filter if the column doesn't
 * exist, so SELECTs against stale schemas don't 500.
 */
import { safeWhere } from './dbHelpers.js';

export function getPeriodId(req) {
  const v =
    (req.query && req.query.period_id) ??
    (req.body  && req.body.period_id);
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function whereForPeriod(req) {
  const id = getPeriodId(req);
  return id ? { period_id: id } : {};
}

export async function safeWhereForPeriod(model, req) {
  return safeWhere(model, whereForPeriod(req));
}
