/**
 * ReconciliationModal — shown after a Department upload.
 *
 * Props:
 *   missing       — Array<{ id, name, code, status }> rows that
 *                   exist in DB but were absent from the Excel
 *   onConfirm     — async (idsToUnlist: number[]) => void
 *   onKeepAll     — () => void
 *   onClose       — () => void
 *
 * Each row gets a toggle. Yellow "Confirm Selection" applies the
 * Unlist status to the rows toggled ON. White "Keep Everything"
 * closes the modal without changes.
 */
import React from 'react';
import styles from '../styles/ReconciliationModal.module.sass';

const ReconciliationModal = ({ missing, onConfirm, onKeepAll, onClose }) => {
  const [picks, setPicks] = React.useState(() => {
    const m = {};
    (missing || []).forEach((r) => { m[r.id] = false; });
    return m;
  });
  const [saving, setSaving] = React.useState(false);

  const toggle = (id) => setPicks((p) => ({ ...p, [id]: !p[id] }));

  const confirm = async () => {
    setSaving(true);
    try {
      const ids = Object.entries(picks).filter(([, v]) => v).map(([k]) => Number(k));
      await onConfirm(ids);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={() => !saving && onClose && onClose()} />
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div>
          <h2 className={styles.title}>Reconcile Departments</h2>
          <p className={styles.subtitle}>
            These departments exist in the current period but weren't in the file you just uploaded.
            Toggle ON to mark them as <strong>Unlisted</strong>; leave OFF to keep them <strong>Active</strong>.
          </p>
        </div>

        {missing && missing.length > 0 ? (
          missing.map((r) => (
            <div key={r.id} className={styles.row}>
              <div className={styles.rowText}>
                <span className={styles.rowName}>{r.name}</span>
                <span className={styles.rowMeta}>Code: {r.code} · Currently: {r.status || 'Active'}</span>
              </div>
              <label className={styles.switch} title="Mark as Unlisted">
                <input
                  type="checkbox"
                  checked={!!picks[r.id]}
                  onChange={() => toggle(r.id)}
                  disabled={saving}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 14, color: '#6B7280' }}>No missing rows — nothing to reconcile.</div>
        )}

        <div className={styles.actions}>
          <button className={styles.btnOutline} disabled={saving} onClick={onKeepAll}>Keep Everything</button>
          <button className={styles.btnPrimary} disabled={saving} onClick={confirm}>
            {saving ? 'Saving…' : 'Confirm Selection'}
          </button>
        </div>
      </div>
    </>
  );
};

export default ReconciliationModal;
