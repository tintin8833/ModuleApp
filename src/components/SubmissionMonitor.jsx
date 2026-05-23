/**
 * SubmissionMonitor — OVPAA view of syllabus / TOS submissions.
 *
 * One component drives both the Syllabus and TOS pages (identical shape).
 * Pass kind="syllabus" | "tos".
 *
 * Requirements covered:
 *   - Period-scoped (uses the global PeriodSelector / usePeriod).
 *   - Filter by department.
 *   - Row-based listing mirroring the Assigned Courses page.
 *   - Per-row Export button → PDF (browser print → Save as PDF).
 *   - View a selected submission's details (modal).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Download, ChevronRight, X } from 'react-feather';
import { DepartmentsAPI, SyllabusSubmissionsAPI, TosSubmissionsAPI } from '../services/api.js';
import { usePeriod } from '../services/period.jsx';
import PeriodSelector from './PeriodSelector.jsx';
import { exportSubmissionToPdf, formatDate } from '../utils/exportSubmission.js';
import styles from '../styles/SubmissionMonitor.module.sass';
import courseStyles from '../styles/CoursesTable.module.sass';

// Inline styles so the app's global `button { background:#1a1a1a }` and
// flex-table cell rules can't hide / restyle these controls.
const exportBtnStyle = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #B91C1C', color: '#B91C1C', borderRadius: 7, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' };
const viewBtnStyle = { display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', color: '#2563EB', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', padding: '6px 4px' };
const pillStyle = { display: 'inline-block', background: '#DCFCE7', color: '#15803D', borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' };

const CONFIG = {
  syllabus: { api: SyllabusSubmissionsAPI, title: 'Submitted Learning Plan', kicker: 'Learning Plan' },
  tos:      { api: TosSubmissionsAPI,      title: 'Submitted TOS',      kicker: 'Table of Specifications' },
};

const asObject = (content) => {
  if (!content) return {};
  if (typeof content === 'string') { try { return JSON.parse(content); } catch (_e) { return {}; } }
  return content;
};

const SubmissionMonitor = ({ kind = 'syllabus' }) => {
  const cfg = CONFIG[kind] || CONFIG.syllabus;
  const { currentPeriod } = usePeriod();

  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);

  const periodId = currentPeriod ? currentPeriod.id : null;

  // Department options for the filter dropdown.
  useEffect(() => {
    if (!periodId) { setDepartments([]); return; }
    DepartmentsAPI.list(periodId)
      .then((d) => setDepartments(Array.isArray(d) ? d : []))
      .catch(() => setDepartments([]));
  }, [periodId]);

  // Submissions, scoped to period + (optional) department.
  useEffect(() => {
    if (!periodId) { setRows([]); setLoading(false); return; }
    setLoading(true);
    cfg.api.list(periodId, deptFilter || undefined)
      .then((r) => { setRows(Array.isArray(r) ? r : []); setError(''); })
      .catch((e) => setError(e.message || 'Failed to load submissions.'))
      .finally(() => setLoading(false));
  }, [periodId, deptFilter, cfg]);

  const deptLabel = (r) => r.department_name || (r.department && r.department.name) || '—';

  const total = rows.length;
  const periodLabel = currentPeriod ? currentPeriod.label : 'No period selected';

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>{cfg.title}</h1>
          <p className={styles.sub}>{periodLabel} · {total} submission{total === 1 ? '' : 's'}</p>
        </div>
        <div className={styles.tools}>
          <PeriodSelector />
          <div className={styles.filter}>
            <label className={styles.filterLabel}>Department</label>
            <select className={styles.select} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">All departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <div className={styles.banner}>{error}</div>}

      {loading ? (
        <div className={styles.empty}>Loading…</div>
      ) : total === 0 ? (
        <div className={styles.empty}>No submissions for this {deptFilter ? 'department' : 'period'} yet.</div>
      ) : (
        <div className={courseStyles['table-container']} style={{ flex: '1 1 auto', minHeight: 0 }}>
          <table style={{ width: '100%' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <tr>
                <th width={130}>COURSE NO.</th>
                <th width={240}>COURSE NAME</th>
                <th width={200}>DEPARTMENT</th>
                <th width={170}>INSTRUCTOR</th>
                <th width={130}>SUBMITTED</th>
                <th width={120}>STATUS</th>
                <th className={courseStyles.fill}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td width={130}>{r.course_code}</td>
                  <td width={240} title={r.course_name}>{r.course_name}</td>
                  <td width={200} title={deptLabel(r)}>{deptLabel(r)}</td>
                  <td width={170} title={r.instructor_name || ''}>{r.instructor_name || '—'}</td>
                  <td width={130}>{formatDate(r.submitted_at)}</td>
                  <td width={120}><span style={pillStyle}>{r.status || 'Submitted'}</span></td>
                  <td className={courseStyles.fill}>
                    <button style={exportBtnStyle} onClick={() => exportSubmissionToPdf(r, kind)}>
                      Export <Download size={16} />
                    </button>
                    <button style={viewBtnStyle} onClick={() => setViewing(r)}>
                      View <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <DetailModal kind={kind} kicker={cfg.kicker} submission={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
};

const DetailModal = ({ kind, kicker, submission, onClose }) => {
  const c = useMemo(() => asObject(submission.content), [submission]);
  const dept = submission.department_name || (submission.department && submission.department.name) || c.department || '—';

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div>
            <div className={styles.modalKicker}>{kicker}</div>
            <h2 className={styles.modalTitle}>{submission.course_code} — {submission.course_name}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>

        <div className={styles.metaGrid}>
          <div><span>Department</span><b>{dept}</b></div>
          <div><span>Instructor</span><b>{submission.instructor_name || c.instructor || '—'}</b></div>
          <div><span>Submitted</span><b>{formatDate(submission.submitted_at)}</b></div>
          <div><span>Status</span><b>{submission.status || 'Submitted'}</b></div>
        </div>

        <div className={styles.modalBody}>
          {kind === 'tos' ? <TosDetails c={c} /> : <SyllabusDetails c={c} />}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Close</button>
          <button className={styles.saveBtn} onClick={() => exportSubmissionToPdf(submission, kind)}>
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};

const SyllabusDetails = ({ c }) => (
  <>
    {c.description && (<><h3 className={styles.section}>Course Description</h3><p className={styles.para}>{c.description}</p></>)}
    {Array.isArray(c.outcomes) && c.outcomes.length > 0 && (
      <><h3 className={styles.section}>Course Outcomes</h3>
        <ul className={styles.list}>{c.outcomes.map((o, i) => <li key={i}><b>{o.id}</b> {o.text || String(o)}</li>)}</ul></>
    )}
    {Array.isArray(c.references) && c.references.length > 0 && (
      <><h3 className={styles.section}>References</h3>
        <ul className={styles.list}>{c.references.map((r, i) => <li key={i}>{r.title || String(r)}{r.author ? ' — ' + r.author : ''}{r.year ? ' (' + r.year + ')' : ''}</li>)}</ul></>
    )}
    {Array.isArray(c.grading) && c.grading.length > 0 && (
      <><h3 className={styles.section}>Criteria for Grading</h3>
        <table className={styles.miniTable}><tbody>
          {c.grading.map((g, i) => <tr key={i}><td>{g.component}</td><td>{g.weight}</td></tr>)}
        </tbody></table></>
    )}
  </>
);

const TosDetails = ({ c }) => (
  <>
    <h3 className={styles.section}>{c.exam || 'Examination'}</h3>
    <p className={styles.para}>Total Items: <b>{c.totalItems ?? '—'}</b> · Total Points: <b>{c.totalPoints ?? '—'}</b></p>
    {Array.isArray(c.specifications) && c.specifications.length > 0 && (
      <table className={styles.miniTable}>
        <thead><tr><th>Topic</th><th>Hours</th><th>%</th><th>Items</th><th>Cognitive Level</th></tr></thead>
        <tbody>
          {c.specifications.map((r, i) => (
            <tr key={i}><td>{r.topic}</td><td>{r.hours}</td><td>{r.percentage}</td><td>{r.items}</td><td>{r.cognitiveLevel}</td></tr>
          ))}
        </tbody>
      </table>
    )}
  </>
);

export default SubmissionMonitor;
