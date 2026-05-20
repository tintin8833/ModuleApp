import React from "react";
import SkeletonA from "../layouts/SkeletonA.jsx";
import HeaderA from "../components/HeaderA.jsx";
import SideNavigation from "../components/SideNavigation.jsx";
import { Search, ArrowUp, ArrowDown, Upload, Plus, Clipboard, UserPlus, X, Save } from "react-feather";
import ConsultantsTable from '../components/ConsultantsTable.jsx';
import PeriodSelector from "../components/PeriodSelector.jsx";
import AddRecordModal from "../components/AddRecordModal.jsx";
import EditRecordModal from "../components/EditRecordModal.jsx";
import ViewRecordModal from "../components/ViewRecordModal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import FloatingArchiveButton from "../components/FloatingArchiveButton.jsx";
import styles from '../styles/CoursesTable.module.sass';
import syllabusStyles from '../styles/SyllabusSections.module.sass';
import { ConsultantsAPI, CourseOfferingsAPI } from '../services/api.js';
import { usePeriod } from '../services/period.jsx';
import { STATUS_OPTIONS, partitionByArchive } from '../services/statusPolicy.js';

const ActionBtn = ({ onClick, icon, label, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 18px', gap: 8, width: 240, height: 40, background: disabled ? '#9CA3AF' : '#EA1212', borderRadius: 6, color: '#fff', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: disabled ? 0.7 : 1 }}>
    <span style={{ width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
    {label}
  </button>
);

// A consultant's assigned course codes: prefer the many-to-many join
// table, fall back to the legacy single assigned_course_code so older
// records (assigned before the multi-course change) still show up.
const consultantCourseCodes = (c) => {
  const fromJoin = Array.isArray(c && c.courses) ? c.courses.map((x) => x.code) : [];
  if (fromJoin.length > 0) return fromJoin;
  return c && c.assigned_course_code ? [c.assigned_course_code] : [];
};

/**
 * CourseTagPicker — tag-style multi-select.
 *
 * - Selected codes render as removable pills above the input.
 * - The input filters the dropdown; click an option to add a pill.
 * - Courses in `excludedByCode` are shown disabled with the holder's
 *   name (already assigned to another consultant in this period).
 */
const CourseTagPicker = ({ courses, value, onChange, excludedByCode }) => {
  const [query, setQuery] = React.useState('');
  const [open, setOpen]   = React.useState(false);
  const wrapRef = React.useRef(null);

  // Click outside closes the dropdown.
  React.useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const valueSet = React.useMemo(() => new Set(value), [value]);

  // Options: every course in the period, minus the ones already picked.
  // Disabled when the course is taken by another consultant.
  const options = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses
      .filter((c) => !valueSet.has(c.code))
      .filter((c) => !q || c.code.toLowerCase().includes(q) || (c.title || '').toLowerCase().includes(q))
      .map((c) => ({
        code:  c.code,
        title: c.title,
        takenBy: excludedByCode && excludedByCode.get ? excludedByCode.get(c.code.toLowerCase()) : null,
      }));
  }, [courses, query, valueSet, excludedByCode]);

  const addCode  = (code) => { onChange([...value, code]); setQuery(''); };
  const dropCode = (code) => onChange(value.filter((c) => c !== code));

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(true)}
        style={{
          minHeight: 44, border: '1px solid #D1D5DB', borderRadius: 6,
          padding: '6px 8px', display: 'flex', flexWrap: 'wrap', gap: 6,
          background: '#FFFFFF', cursor: 'text', alignItems: 'center',
        }}
      >
        {value.map((code) => (
          <span
            key={code}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', background: '#E5E7EB', color: '#111827',
              borderRadius: 9999, fontSize: 13, fontWeight: 500,
            }}
          >
            {code}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); dropCode(code); }}
              aria-label={'Remove ' + code}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex' }}
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={value.length === 0 ? 'Search course code or title…' : ''}
          style={{ flex: 1, minWidth: 140, border: 'none', outline: 'none', fontSize: 14, padding: '4px 2px' }}
        />
      </div>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            maxHeight: 240, overflowY: 'auto', background: '#FFFFFF',
            border: '1px solid #D1D5DB', borderRadius: 6, zIndex: 50,
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
        >
          {options.length === 0 && (
            <div style={{ padding: '10px 12px', fontSize: 13, color: '#6B7280' }}>
              No matching courses available.
            </div>
          )}
          {options.map((o) => {
            const disabled = !!o.takenBy;
            return (
              <button
                type="button"
                key={o.code}
                disabled={disabled}
                onClick={() => !disabled && addCode(o.code)}
                title={disabled ? 'Already assigned to ' + o.takenBy : ''}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 12px',
                  border: 'none', borderBottom: '1px solid #F3F4F6',
                  background: disabled ? '#F9FAFB' : '#FFFFFF',
                  color: disabled ? '#9CA3AF' : '#111827',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontSize: 14, display: 'flex', justifyContent: 'space-between', gap: 12,
                }}
              >
                <span><strong>{o.code}</strong> — {o.title}</span>
                {disabled && (
                  <span style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                    Assigned · {o.takenBy}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ProgramHeadIndustryConsultant = () => {
  const { currentPeriod, isCurrentTermActive } = usePeriod();
  const periodId = currentPeriod && currentPeriod.id;

  const [showModal, setShowModal]       = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [editingConsultant, setEditingConsultant]   = React.useState(null);
  const [viewingConsultant, setViewingConsultant]   = React.useState(null);
  const [confirmUpload, setConfirmUpload]           = React.useState(false);
  const [sortOpen, setSortOpen]         = React.useState(false);
  const [sortDir, setSortDir]           = React.useState(null);
  const [assignOpen, setAssignOpen]     = React.useState(false);
  const [assignStatus, setAssignStatus] = React.useState('');
  const [selectedConsultant, setSelectedConsultant] = React.useState(null);
  const [pickedCourseCodes, setPickedCourseCodes]   = React.useState([]);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [searchQuery, setSearchQuery]   = React.useState('');
  const [consultants, setConsultants]   = React.useState([]);
  const [courses, setCourses]           = React.useState([]);
  const [uploading, setUploading]       = React.useState(false);
  const [uploadError, setUploadError]   = React.useState(null);
  const fileInputRef = React.useRef(null);

  const refresh = React.useCallback(() => {
    if (!periodId) { setConsultants([]); setCourses([]); return; }
    ConsultantsAPI.list(periodId).then((rows) => setConsultants(Array.isArray(rows) ? rows : [])).catch(() => setConsultants([]));
    CourseOfferingsAPI.list(periodId).then((rows) => setCourses(Array.isArray(rows) ? rows : [])).catch(() => setCourses([]));
  }, [periodId]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const showTable = consultants.length > 0;

  const handleConfirmUpload = async () => {
    if (!selectedFile) { alert('Please choose a file first'); return; }
    if (!periodId)     { alert('Select an academic period first'); return; }
    setUploading(true); setUploadError(null);
    try {
      await ConsultantsAPI.upload(selectedFile, periodId);
      await refresh();
      setShowModal(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onAddConsultant = async (record) => {
    // Manual adds default to Active — the user is explicitly enrolling
    // this consultant, so they're presumed available right away.
    // (Upload still creates rows with blank status; that path goes
    // through Assign for status assignment.)
    await ConsultantsAPI.create({ ...record, status: 'Active' }, periodId);
    await refresh();
  };

  const onSaveEdit = async (patch) => {
    try {
      await ConsultantsAPI.update(editingConsultant.id, patch);
      await refresh();
    } catch (err) {
      await refresh();
      throw err;
    }
  };


  const openAssign = (consultant) => {
    setSelectedConsultant(consultant);
    setPickedCourseCodes(consultantCourseCodes(consultant));
    // Default to current status; "" means user hasn't chosen yet
    // (Save disabled until they do).
    setAssignStatus(consultant && (consultant.status === 'Active' || consultant.status === 'Unavailable')
      ? consultant.status
      : '');
    setAssignOpen(true);
  };

  const confirmAssign = async () => {
    if (!selectedConsultant) return;
    if (!assignStatus) { alert('Pick a status (Active or Unavailable) first.'); return; }
    try {
      await ConsultantsAPI.assign(selectedConsultant.id, {
        status: assignStatus,
        // Unavailable clears assignments anyway, but send [] explicitly
        // so the intent is unambiguous in server logs.
        assigned_course_codes: assignStatus === 'Unavailable' ? [] : pickedCourseCodes,
      });
      await refresh();
      setAssignOpen(false);
      setSelectedConsultant(null);
    } catch (err) {
      // 409: server rejected a race-condition double-assignment.
      const list = err.details && Array.isArray(err.details.conflicts)
        ? err.details.conflicts.map((c) => c.code + ' (→ ' + c.consultantName + ')').join(', ')
        : '';
      const msg = list ? (err.message + '\n\nConflicts: ' + list) : err.message;
      alert('Could not assign: ' + msg);
      await refresh();   // refresh so the picker reflects who actually holds the conflicting codes
    }
  };

  // Map<lowercase code, holder name> — courses already assigned to OTHER
  // consultants in this period. Driven off the consultants list the page
  // already loads, so no extra fetch is needed.
  const takenByOther = React.useMemo(() => {
    const m = new Map();
    const myId = selectedConsultant && selectedConsultant.id;
    consultants.forEach((c) => {
      if (c.id === myId) return;
      consultantCourseCodes(c).forEach((code) => {
        if (code) m.set(String(code).toLowerCase(), c.name);
      });
    });
    return m;
  }, [consultants, selectedConsultant]);

  // Edit-status handler for the consultant archive (Active or Available).
  const onEditStatus = React.useCallback(async (row, newStatus) => {
    await ConsultantsAPI.update(row.id, { status: newStatus });
    await refresh();
  }, [refresh]);

  const visibleConsultants = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows = q ? consultants.filter((c) => (c.name || '').toLowerCase().includes(q)) : consultants.slice();
    if (sortDir === 'asc')  rows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sortDir === 'desc') rows.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    // Archived statuses (Unavailable / Offboarded) move to the global Archive view.
    return partitionByArchive(rows, 'consultant').main;
  }, [consultants, searchQuery, sortDir]);

  const renderedConsultants = visibleConsultants.map((c) => ({
    id: c.id, name: c.name, department: '',
    assignedCourse: consultantCourseCodes(c),
    // Pass status through as-is — blank/null until the user picks one
    // in the Assign popup. No default to 'Active'.
    status: c.status || '',
  }));

  const content = (
    <div style={{ padding: 20, background: '#FFFFFF', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Industry Consultants</h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <ActionBtn onClick={() => { if (consultants.length > 0) { setConfirmUpload(true); } else { setShowModal(true); } }} disabled={!periodId || !isCurrentTermActive} icon={<Upload size={18} color="#FFFFFF" />} label="Upload Consultant List" />
            {showTable && isCurrentTermActive && (
              <ActionBtn onClick={() => setShowAddModal(true)} icon={<Plus size={18} color="#FFFFFF" />} label="Add Consultant" />
            )}
          </div>
          <PeriodSelector />
        </div>
      </div>

      {!isCurrentTermActive && currentPeriod && (
        <div style={{ marginBottom: 12, padding: '10px 14px', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 8, color: '#92400E', fontSize: 13, lineHeight: '1.4' }}>
          <strong>Read-only:</strong> {currentPeriod.label} is closed. Switch to an Active term to make changes.
        </div>
      )}

      {showTable && (
        <div className={syllabusStyles.header} style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setSortOpen((v) => !v)} style={{ width: 120, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 12px', background: 'transparent', border: '1px solid #D1D5DB', borderRadius: 9999, color: '#595959', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 17V5" stroke="#595959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 8l3-3 3 3" stroke="#595959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 7v12" stroke="#595959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 16l3 3 3-3" stroke="#595959" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Sort</span>
            </button>
            {sortOpen && (
              <div style={{ position: 'absolute', top: '110%', left: 0, background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', width: 120, padding: 8, zIndex: 5 }}>
                <button onClick={() => { setSortDir('asc'); setSortOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: 6, color: '#111827' }}>
                  <ArrowUp size={16} color="#374151" /><span style={{ fontSize: 14 }}>A to Z</span>
                </button>
                <button onClick={() => { setSortDir('desc'); setSortOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: 6, color: '#111827' }}>
                  <ArrowDown size={16} color="#374151" /><span style={{ fontSize: 14 }}>Z to A</span>
                </button>
              </div>
            )}
          </div>
          <div className={syllabusStyles['section-select']} style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', height: 40, borderRadius: 9999, background: 'transparent', border: '1px solid #D1D5DB' }}>
            <Search size={16} style={{ marginRight: 8, color: '#374151' }} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search consultants" style={{ border: 0, outline: 'none', background: 'transparent', width: 360, fontSize: 14 }} />
          </div>
        </div>
      )}

      {showTable && (
        <ConsultantsTable
          consultants={renderedConsultants}
          hideDepartment={true}
          onAssign={(_row, idx) => openAssign(visibleConsultants[idx])}
          readOnly={!isCurrentTermActive}
        />
      )}

      {!showTable && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ width: 92, height: 92, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clipboard size={40} color="#9CA3AF" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>No consultants yet</div>
          <div style={{ color: '#6B7280', textAlign: 'center', maxWidth: 420 }}>{periodId ? ('Upload a consultant list for ' + (currentPeriod ? currentPeriod.label : 'this period') + ' to get started.') : 'Select an academic period to begin.'}</div>
        </div>
      )}

      {showAddModal && (
        <AddRecordModal
          title="Add Industry Consultant"
          fields={[
            { key: 'name', label: 'Name', required: true },
            { key: 'assigned_course_codes', label: 'Assigned Courses', type: 'checkboxes', options: courses.map((c) => ({ value: c.code, label: c.code + ' — ' + c.title })) },
          ]}
          onSubmit={onAddConsultant}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {viewingConsultant && (
        <ViewRecordModal
          title="View"
          fields={[
            { key: 'name', label: 'Name' },
            { key: 'assigned_course_codes', label: 'Assigned Courses', type: 'checkboxes' },
            { key: 'status', label: 'Status' },
          ]}
          initial={{ ...viewingConsultant, assigned_course_codes: consultantCourseCodes(viewingConsultant) }}
          canEdit={isCurrentTermActive}
          onEdit={() => { setEditingConsultant(viewingConsultant); setViewingConsultant(null); }}
          onClose={() => setViewingConsultant(null)}
        />
      )}

      {editingConsultant && (
        <EditRecordModal
          key={'consultant-edit-' + editingConsultant.id}
          title="Edit"
          fields={[
            { key: 'name', label: 'Name', required: true },
            { key: 'assigned_course_codes', label: 'Assigned Courses', type: 'checkboxes', options: courses.map((c) => ({ value: c.code, label: c.code + ' — ' + c.title })) },
            { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS.consultant },
          ]}
          initial={{ ...editingConsultant, assigned_course_codes: consultantCourseCodes(editingConsultant) }}
          onSubmit={onSaveEdit}
          onBack={() => { setViewingConsultant(editingConsultant); setEditingConsultant(null); }}
          onClose={() => setEditingConsultant(null)}
        />
      )}

      <ConfirmModal
        open={confirmUpload}
        title="Replace consultant data?"
        message={'Uploading this file will replace existing consultants for ' + (currentPeriod ? currentPeriod.label : 'this period') + '. Proceed?'}
        confirmLabel="Continue to upload"
        onConfirm={() => { setConfirmUpload(false); setShowModal(true); }}
        onCancel={() => setConfirmUpload(false)}
      />

      {assignOpen && selectedConsultant && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 30 }} onClick={() => setAssignOpen(false)} />
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 460, background: '#FFFFFF', borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', gap: 20, zIndex: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#111827' }}>Manage Consultant</h2>
              <button onClick={() => setAssignOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
            </div>
            <div style={{ fontSize: 14, color: '#374151' }}>Consultant: <strong>{selectedConsultant.name}</strong></div>

            {/* Status selector — pick this first. Unavailable disables
                the course picker (and on save also clears any assignments). */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Status
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Active', 'Unavailable'].map((opt) => {
                  const selected = assignStatus === opt;
                  const isUnav = opt === 'Unavailable';
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAssignStatus(opt)}
                      style={{
                        flex: 1, height: 40, borderRadius: 8,
                        border: '1px solid ' + (selected ? (isUnav ? '#B91C1C' : '#047857') : '#D1D5DB'),
                        background: selected ? (isUnav ? '#FEE2E2' : '#D1FAE5') : '#FFFFFF',
                        color: selected ? (isUnav ? '#B91C1C' : '#047857') : '#374151',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        transition: 'background 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Course picker — disabled when Unavailable */}
            <div style={{ opacity: assignStatus === 'Unavailable' ? 0.5 : 1, pointerEvents: assignStatus === 'Unavailable' ? 'none' : 'auto' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Assigned Courses
              </label>
              {assignStatus === 'Unavailable' && (
                <div style={{ fontSize: 12, color: '#B91C1C', marginBottom: 6 }}>
                  Unavailable consultants cannot be assigned to courses.
                </div>
              )}
              {courses.length === 0 ? (
                <div style={{ fontSize: 13, color: '#6B7280', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6 }}>
                  No courses in this period yet.
                </div>
              ) : (
                <CourseTagPicker
                  courses={courses}
                  value={pickedCourseCodes}
                  onChange={setPickedCourseCodes}
                  excludedByCode={takenByOther}
                />
              )}
            </div>

            <div style={{ display: 'flex' }}>
              <button
                onClick={confirmAssign}
                disabled={!assignStatus}
                style={{
                  flex: 1, width: '100%', height: 40, padding: '0 20px',
                  background: !assignStatus ? '#9CA3AF' : '#2C3744',
                  color: '#FFFFFF', borderRadius: 8, border: 'none',
                  cursor: !assignStatus ? 'not-allowed' : 'pointer',
                  gap: 8, fontWeight: 500, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Save size={16} /><span>Save</span>
              </button>
            </div>
          </div>
        </>
      )}

      <FloatingArchiveButton moduleType="consultants" onEditStatus={onEditStatus} />

      {showModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2 }} onClick={() => !uploading && setShowModal(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, padding: 24, background: '#FFFFFF', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>Upload Consultant List</div>
            <div onClick={() => fileInputRef.current && fileInputRef.current.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) setSelectedFile(f); }} style={{ border: '2px dashed #D1D5DB', borderRadius: 8, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Upload size={36} color="#9CA3AF" />
              <div style={{ fontWeight: 600, color: '#111827' }}>{selectedFile ? selectedFile.name : 'Drag & drop file here'}</div>
              <div style={{ color: '#6B7280', fontSize: 13 }}>Upload .xlsx, .xls or .csv</div>
              <input type="file" ref={fileInputRef} accept=".csv,.xlsx,.xls" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) setSelectedFile(f); }} style={{ display: 'none' }} />
            </div>
            {uploadError && <div style={{ color: '#B91C1C', fontSize: 13 }}>{uploadError}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button disabled={uploading} onClick={() => { setSelectedFile(null); setShowModal(false); }} style={{ flex: 1, height: 40, background: '#FFFFFF', border: '1px solid #111827', borderRadius: 8, color: '#111827', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 500 }}>Cancel</button>
              <button disabled={uploading} onClick={handleConfirmUpload} style={{ flex: 1, height: 40, background: '#1F2937', border: 'none', borderRadius: 8, color: '#FFFFFF', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: uploading ? 0.7 : 1 }}>{uploading ? 'Uploading…' : 'Upload'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <SkeletonA
      header={<HeaderA role="Program Head" name="DANILA, JUN ARREB" />}
      nav={<SideNavigation mode="program-head" />}
      content={content}
    />
  );
};

export default ProgramHeadIndustryConsultant;
