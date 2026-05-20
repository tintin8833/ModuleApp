/**
 * EditRecordModal — generic data-edit modal.
 *
 * Pre-fills inputs from `initial` and calls `onSubmit(patch)` with
 * ONLY the fields the user actually changed — empty form fields the
 * user never touched are not included in the patch. The backend
 * PATCH endpoints treat absent keys as "leave untouched", so this
 * means a partial edit (e.g. just renaming) never accidentally
 * wipes out unrelated columns (Sex, Birthdate, About, …).
 *
 * The modal is keyed in the parent on the selected row's id, so
 * mounting it for a new row resets local state and prevents any
 * "data bleeding" from a previous edit session.
 */
import React from 'react';
import { X, ArrowLeft, Save } from 'react-feather';
import styles from '../styles/AddRecordModal.module.sass';
import SearchableSelect from './SearchableSelect.jsx';

const EditRecordModal = ({ title, fields, initial, onSubmit, onClose, onRemove, removeLabel, onBack }) => {
  // Snapshot the initial values once so we can diff against them at submit time.
  const initialValues = React.useMemo(() => {
    const v = {};
    fields.forEach((f) => {
      if (f.type === 'checkboxes') {
        v[f.key] = Array.isArray(initial && initial[f.key]) ? initial[f.key] : [];
      } else {
        v[f.key] = (initial && initial[f.key] != null) ? String(initial[f.key]) : '';
      }
    });
    return v;
  }, [initial, fields]);

  const [values, setValues] = React.useState(initialValues);
  const [saving, setSaving] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [error, setError]   = React.useState(null);

  const setField = (key, v) => setValues((prev) => ({ ...prev, [key]: v }));

  // True if at least one field's current value differs from its snapshot.
  // Used to disable Save until the user actually changes something.
  const isDirty = React.useMemo(() => {
    return Object.keys(values).some((k) => {
      const cur  = values[k];
      const orig = initialValues[k];
      if (Array.isArray(cur) || Array.isArray(orig)) {
        const a = Array.isArray(cur) ? cur : [];
        const b = Array.isArray(orig) ? orig : [];
        return a.length !== b.length || a.some((x) => !b.includes(x)) || b.some((x) => !a.includes(x));
      }
      return cur !== orig;
    });
  }, [values, initialValues]);

  // Optional "Remove" action (replaces "Cancel" when onRemove is provided).
  // The parent is expected to close the modal on success.
  const handleRemove = async () => {
    if (!onRemove) return;
    setRemoving(true); setError(null);
    try {
      await onRemove();
    } catch (err) {
      setError(err.message || 'Remove failed');
      setRemoving(false);
    }
  };

  const submit = async () => {
    for (const f of fields) {
      if (!f.required) continue;
      const v = values[f.key];
      const empty = f.type === 'checkboxes' ? !(Array.isArray(v) && v.length > 0) : !v;
      if (empty) { setError(f.label + ' is required'); return; }
    }
    // Build a patch of only the keys the user actually modified.
    const patch = {};
    Object.keys(values).forEach((k) => {
      const cur = values[k];
      const orig = initialValues[k];
      let changed;
      if (Array.isArray(cur) || Array.isArray(orig)) {
        const a = Array.isArray(cur) ? cur : [];
        const b = Array.isArray(orig) ? orig : [];
        changed = a.length !== b.length || a.some((x) => !b.includes(x)) || b.some((x) => !a.includes(x));
      } else {
        changed = cur !== orig;
      }
      if (changed) patch[k] = cur;
    });
    // If nothing changed, treat as a no-op close.
    if (Object.keys(patch).length === 0) { onClose(); return; }

    setSaving(true); setError(null);
    try {
      await onSubmit(patch);
      onClose();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={() => !saving && onClose()} />
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {onBack && (
              <button
                onClick={onBack}
                disabled={saving || removing}
                title="Back to view"
                aria-label="Back"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center', borderRadius: 6 }}
              >
                <ArrowLeft size={20} color="#111827" />
              </button>
            )}
            <div className={styles.title}>{title}</div>
          </div>
          <button onClick={onClose} disabled={saving || removing} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={22} color="#111827" />
          </button>
        </div>

        {fields.map((f) => (
          <div key={f.key} className={styles.field}>
            <label className={styles.label}>{f.label}{f.required && <span style={{ color: '#B91C1C' }}> *</span>}</label>

            {f.type === 'checkboxes' ? (
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #D1D5DB', borderRadius: 6, padding: '8px 12px' }}>
                {(f.options || []).length === 0 && (
                  <div style={{ fontSize: 13, color: '#6B7280' }}>No options available.</div>
                )}
                {(f.options || []).map((opt) => {
                  const val = typeof opt === 'string' ? opt : opt.value;
                  const label = typeof opt === 'string' ? opt : opt.label;
                  const arr = Array.isArray(values[f.key]) ? values[f.key] : [];
                  const checked = arr.includes(val);
                  return (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => setField(f.key, e.target.checked ? [...arr, val] : arr.filter((v) => v !== val))}
                      />
                      <span style={{ fontSize: 14 }}>{label}</span>
                    </label>
                  );
                })}
              </div>
            ) : f.type === 'searchable-select' ? (
              <SearchableSelect
                value={values[f.key] || ''}
                onChange={(v) => setField(f.key, v)}
                options={f.options || []}
                placeholder={f.placeholder || 'Search…'}
              />
            ) : f.type === 'select' ? (
              <select
                className={styles.select}
                value={values[f.key] || ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setValues((prev) => {
                    const next = { ...prev, [f.key]: v };
                    if (f.onSelect) Object.assign(next, f.onSelect(v) || {});
                    return next;
                  });
                }}
                style={f.highlight ? { borderColor: '#B91C1C', boxShadow: '0 0 0 1px rgba(185,28,28,0.35)' } : undefined}
              >
                <option value="">— Select —</option>
                {(f.options || []).map((opt) => (
                  typeof opt === 'string'
                    ? <option key={opt} value={opt}>{opt}</option>
                    : <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea className={styles.textarea} value={values[f.key] || ''} onChange={(e) => setField(f.key, e.target.value)} />
            ) : (
              <input
                className={styles.input}
                type={f.type || 'text'}
                value={values[f.key] || ''}
                onChange={(e) => setField(f.key, e.target.value)}
                style={f.highlight ? { borderColor: '#B91C1C', boxShadow: '0 0 0 1px rgba(185,28,28,0.35)' } : undefined}
              />
            )}
            {f.helperText && <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>{f.helperText}</div>}
          </div>
        ))}

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.buttons}>
          {onRemove && (
            <button
              disabled={saving || removing}
              className={styles.btn + ' ' + styles.btnCancel}
              style={{ borderColor: '#B91C1C', color: '#B91C1C' }}
              onClick={handleRemove}
            >
              {removing ? 'Removing…' : (removeLabel || 'Remove')}
            </button>
          )}
          <button
            disabled={saving || removing || !isDirty}
            className={styles.btn + ' ' + styles.btnPrimary}
            onClick={submit}
            style={{
              opacity: (!isDirty && !saving) ? 0.5 : 1,
              cursor: (!isDirty && !saving) ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <Save size={16} /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </>
  );
};

export default EditRecordModal;
