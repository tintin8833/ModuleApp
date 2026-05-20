/**
 * Period context.
 *
 * Exposes a single React context that holds:
 *   - periods:               AcademicPeriod[]  (loaded from the API once)
 *   - currentPeriod:         AcademicPeriod | null
 *   - isCurrentTermActive:   boolean — true when currentPeriod.status === 'Active'
 *   - setCurrentPeriodId(id)
 *   - refreshPeriods()       — re-fetch (e.g. after adding or closing a term)
 *
 * `isCurrentTermActive` is the single gate every page reads to decide
 * whether Add/Edit/Upload buttons should be visible. A "Closed" term
 * becomes globally read-only — the OVPAA flips the status field via
 * the Academic Term page; everything else reacts to it.
 *
 * Selection survives reloads via localStorage. On boot we prefer:
 *   1. localStorage `course_assignment.period_id`
 *   2. the most recent Active term (chronologically newest)
 *   3. the first period returned
 */
import React from 'react';
import { prettifyLabel } from './periodLabel.js';

const STORAGE_KEY = 'course_assignment.period_id';
const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:4000/api';

const PeriodContext = React.createContext({
  periods: [],
  currentPeriod: null,
  isCurrentTermActive: true,
  apiReachable: true,
  setCurrentPeriodId: () => {},
  refreshPeriods: () => {},
});

// Chronological ranker used only when picking a sensible default
// current term on first load. The lock rule itself doesn't use this.
const semesterRank = (sem) => {
  const s = String(sem || '').trim().toLowerCase();
  if (s === 'summer' || s === '3') return 3;
  if (s === '2' || s === 'second' || s === '2nd' || s === 'sem 2') return 2;
  if (s === '1' || s === 'first'  || s === '1st' || s === 'sem 1') return 1;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};
const rankPeriod = (p) => {
  if (!p) return -Infinity;
  const m = String(p.school_year || '').match(/(\d{4})/);
  const year = m ? Number(m[1]) : 0;
  return year * 1e9 + semesterRank(p.semester) * 1e6 + (Number(p.sort_order) || 0) * 1e3 + (Number(p.id) || 0);
};

export const PeriodProvider = ({ children }) => {
  const [periods, setPeriods] = React.useState([]);
  const [apiReachable, setApiReachable] = React.useState(true);
  const [currentId, setCurrentId] = React.useState(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) : null;
  });

  const refreshPeriods = React.useCallback(async () => {
    let rows = [];
    try {
      const res = await fetch(`${API_BASE}/academic-periods`);
      if (!res.ok) {
        setApiReachable(false);
        return;
      }
      rows = await res.json();
      // Normalize stored labels to the canonical ordinal format so every
      // consumer (selector, page banners, modal subtitles) renders the
      // new "1st/2nd Semester" wording regardless of when the row was
      // created.
      if (Array.isArray(rows)) {
        rows = rows.map((p) => ({ ...p, label: prettifyLabel(p.label) }));
      }
      setApiReachable(true);
    } catch (err) {
      // Network failure — backend down, CORS issue, etc.
      // eslint-disable-next-line no-console
      console.warn('[periods] could not reach API:', err && err.message);
      setApiReachable(false);
      return;
    }
    setPeriods(rows);

    // Resolve a default current period if nothing was stored.
    setCurrentId((prev) => {
      if (prev && rows.find((p) => p.id === prev)) return prev;
      // Prefer the most recent ACTIVE term; fall back to any row.
      const actives = rows.filter((p) => p.status === 'Active');
      const pool = actives.length > 0 ? actives : rows;
      if (pool.length === 0) return null;
      let best = pool[0]; let bestRank = rankPeriod(best);
      for (let i = 1; i < pool.length; i += 1) {
        const r = rankPeriod(pool[i]);
        if (r > bestRank) { best = pool[i]; bestRank = r; }
      }
      return best ? best.id : null;
    });
  }, []);

  React.useEffect(() => { refreshPeriods(); }, [refreshPeriods]);

  React.useEffect(() => {
    if (currentId) window.localStorage.setItem(STORAGE_KEY, String(currentId));
  }, [currentId]);

  const currentPeriod = periods.find((p) => p.id === currentId) || null;

  // Single source of truth for the read-only lock. Treat "no period
  // selected" as editable so the empty-state Add flow isn't blocked.
  const isCurrentTermActive = !currentPeriod || currentPeriod.status === 'Active';

  const value = React.useMemo(() => ({
    periods,
    currentPeriod,
    isCurrentTermActive,
    apiReachable,
    setCurrentPeriodId: setCurrentId,
    refreshPeriods,
  }), [periods, currentPeriod, isCurrentTermActive, apiReachable, refreshPeriods]);

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
};

export const usePeriod = () => React.useContext(PeriodContext);
