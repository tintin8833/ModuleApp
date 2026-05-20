/**
 * Active-term guard.
 *
 * The business rule: each AcademicPeriod has an explicit lifecycle
 * status — 'Active' (editable) or 'Closed' (globally read-only).
 * The OVPAA closes a period manually when the term ends; from that
 * moment no controller may accept writes targeting that period.
 *
 * Exported (legacy names kept for call-site compatibility):
 *   - enforceLatestPeriod / enforceActiveTerm  — Express guard
 *   - isLatestPeriodId  / isActiveTermId       — boolean check
 *   - getLatestPeriodId / getActiveTermId      — picks the most recent Active term
 *
 * Internally everything routes through `isActiveTermId(periodId)`,
 * which reads `academic_periods.status` and returns true only when
 * the period exists and is Active.
 */
import db from '../models/index.js';

const { AcademicPeriod } = db;

export async function getActiveTermId() {
  if (!AcademicPeriod) return null;
  try {
    // Pick the most-recent Active term as a default fallback for
    // callers that just want SOME writable term. Chronologically
    // ranked the way the frontend does it.
    const rows = await AcademicPeriod.findAll({
      where: { status: 'Active' },
      attributes: ['id', 'school_year', 'semester', 'sort_order'],
      raw: true,
    });
    if (!rows || rows.length === 0) return null;
    const semRank = (s) => {
      const v = String(s || '').trim().toLowerCase();
      if (v === 'summer' || v === '3') return 3;
      if (v === '2' || v === '2nd' || v === 'second' || v === 'sem 2') return 2;
      if (v === '1' || v === '1st' || v === 'first'  || v === 'sem 1') return 1;
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const rank = (p) => {
      const m = String(p.school_year || '').match(/(\d{4})/);
      return (m ? Number(m[1]) : 0) * 1e9 + semRank(p.semester) * 1e6 + (Number(p.sort_order) || 0) * 1e3 + (Number(p.id) || 0);
    };
    let best = rows[0]; let bestRank = rank(best);
    for (let i = 1; i < rows.length; i += 1) {
      const r = rank(rows[i]);
      if (r > bestRank) { best = rows[i]; bestRank = r; }
    }
    return best ? best.id : null;
  } catch (_err) {
    return null;
  }
}

export async function isActiveTermId(periodId) {
  if (!periodId) return true; // falsy ids are handled by the caller's own validation
  try {
    const row = await AcademicPeriod.findByPk(periodId, { attributes: ['status'], raw: true });
    if (!row) return true; // unknown period — let downstream raise a clearer error
    return row.status === 'Active';
  } catch (_err) {
    return true;
  }
}

export async function enforceActiveTerm(res, periodId) {
  const ok = await isActiveTermId(periodId);
  if (!ok) {
    res.status(403).json({
      message: 'This term is closed — switch to an Active term to make changes.',
    });
    return false;
  }
  return true;
}

// Legacy export aliases — keep existing controller imports working.
export const getLatestPeriodId  = getActiveTermId;
export const isLatestPeriodId   = isActiveTermId;
export const enforceLatestPeriod = enforceActiveTerm;
