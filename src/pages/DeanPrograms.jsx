import React from "react";
import ProgramsTable from "../components/ProgramsTable.jsx";
import PeriodSelector from "../components/PeriodSelector.jsx";
import AddRecordModal from "../components/AddRecordModal.jsx";
import EditRecordModal from "../components/EditRecordModal.jsx";
import ViewRecordModal from "../components/ViewRecordModal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import FloatingArchiveButton from "../components/FloatingArchiveButton.jsx";
import { Search, ArrowUp, ArrowDown, Upload, Plus, Clipboard } from "react-feather";
import styles from '../styles/CoursesTable.module.sass';
import syllabusStyles from '../styles/SyllabusSections.module.sass';
import { ProgramsAPI, FacultyAPI } from '../services/api.js';
import { usePeriod } from '../services/period.jsx';
import { STATUS_OPTIONS, partitionByArchive } from '../services/statusPolicy.js';

// Strips honorifics so "Dr. Maria Santos" matches "Maria Santos".
// Must mirror normalizeFacultyName in server/controllers/programController.js.
const normalizeFacultyName = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/\b(dr|prof|professor|engr|engineer|atty|mr|mrs|ms|sir|maam|ma'?am)\.?\s+/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const ActionBtn = ({ onClick, icon, label, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 18px', gap: 8, width: 240, height: 40, background: disabled ? '#9CA3AF' : '#EA1212', borderRadius: 6, color: '#fff', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: disabled ? 0.7 : 1 }}>
    <span style={{ width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
    {label}
  </button>
);

const DeanPrograms = () => {
  const { currentPeriod, isCurrentTermActive } = usePeriod();
  const periodId = currentPeriod && currentPeriod.id;

  const [showModal, setShowModal]       = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [editingProgram, setEditingProgram] = React.useState(null);
  const [viewingProgram, setViewingProgram] = React.useState(null);
  const [confirmUpload, setConfirmUpload]     = React.useState(false);
  const [sortOpen, setSortOpen]         = React.useState(false);
  const [sortDir, setSortDir]           = React.useState(null);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [searchQuery, setSearchQuery]   = React.useState('');
  const [programsList, setProgramsList] = React.useState([]);
  const [faculty, setFaculty]           = React.useState([]);
  const [uploading, setUploading]       = React.useState(false);
  const [uploadError, setUploadError]   = React.useState(null);
  // Post-upload review state: { warnings: [{id, code, name, program_head}], index }
  const [unmatchedReview, setUnmatchedReview] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const refresh = React.useCallback(() => {
    if (!periodId) { setProgramsList([]); setFaculty([]); return; }
    ProgramsAPI.list(periodId)
      .then((rows) => setProgramsList(Array.isArray(rows) ? rows : []))
      .catch(() => setProgramsList([]));
    FacultyAPI.list(periodId)
      .then((rows) => setFaculty(Array.isArray(rows) ? rows : []))
      .catch(() => setFaculty([]));
  }, [periodId]);

  // Set of normalized faculty names available for matching the program_head
  // field. Active faculty only — Inactive/Emeritus/On Leave shouldn't be
  // valid program chairs going forward.
  const facultyNameSet = React.useMemo(() => {
    const s = new Set();
    faculty.forEach((f) => {
      if (f && f.name && (f.status === 'Active' || !f.status)) {
        s.add(normalizeFacultyName(f.name));
      }
    });
    return s;
  }, [faculty]);

  // Dropdown options for the searchable Faculty selector in Add/Edit.
  const facultyOptions = React.useMemo(() => (
    faculty
      .filter((f) => f && f.name && (f.status === 'Active' || !f.status))
      .map((f) => ({ value: f.name, label: f.name + (f.role ? ' (' + f.role + ')' : '') }))
  ), [faculty]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const showTable = programsList.length > 0;

  const handleConfirmUpload = async () => {
    if (!selectedFile) { alert('Please choose a file first'); return; }
    if (!periodId)     { alert('Select an academic period first'); return; }
    setUploading(true); setUploadError(null);
    try {
      const result = await ProgramsAPI.upload(selectedFile, periodId);
      await refresh();
      setShowModal(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // If any rows reference a faculty name not in the master list,
      // open the per-row review modal. User confirms each Yes (keep)
      // or No (delete the row).
      if (result && Array.isArray(result.warnings) && result.warnings.length > 0) {
        setUnmatchedReview({ warnings: result.warnings, index: 0 });
      }
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Review modal action: keep this row (move on to next) or delete it.
  const advanceReview = () => {
    setUnmatchedReview((r) => {
      if (!r) return null;
      const next = r.index + 1;
      if (next >= r.warnings.length) return null;
      return { ...r, index: next };
    });
  };
  const reviewKeep   = () => advanceReview();
  const reviewReject = async () => {
    if (!unmatchedReview) return;
    const w = unmatchedReview.warnings[unmatchedReview.index];
    try { await ProgramsAPI.remove(w.id); } catch (e) { alert('Delete failed: ' + e.message); }
    await refresh();
    advanceReview();
  };

  const onAddProgram = async (record) => {
    await ProgramsAPI.create({
      code: record.code,
      name: record.name,
      program_head: record.program_head,
      status: record.status || 'Active',
    }, periodId);
    await refresh();
  };

  const onSaveEdit = async (patch) => {
    setProgramsList((prev) => prev.map((r) => r.id === editingProgram.id ? { ...r, ...patch } : r));
    try {
      const saved = await ProgramsAPI.update(editingProgram.id, patch);
      setProgramsList((prev) => prev.map((r) => r.id === editingProgram.id ? { ...r, ...saved } : r));
    } catch (err) {
      await refresh();
      throw err;
    }
  };


  // Edit-status handler for the program archive (Active only).
  const onEditStatus = React.useCallback(async (row, newStatus) => {
    await ProgramsAPI.update(row.id, { status: newStatus });
    await refresh();
  }, [refresh]);

  const visiblePrograms = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows = q
      ? programsList.filter((p) => [p.code, p.name, p.program_head].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)))
      : programsList.slice();
    if (sortDir === 'asc')  rows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sortDir === 'desc') rows.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    // Unlisted programs move to the global Archive view.
    return partitionByArchive(rows, 'program').main;
  }, [programsList, searchQuery, sortDir]);

  return (
    <div style={{ padding: 20, background: '#FFFFFF', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Programs</h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <ActionBtn onClick={() => { if (programsList.length > 0) { setConfirmUpload(true); } else { setShowModal(true); } }} disabled={!periodId || !isCurrentTermActive} icon={<Upload size={18} color="#FFFFFF" />} label="Upload Program List" />
            {showTable && isCurrentTermActive && <ActionBtn onClick={() => setShowAddModal(true)} icon={<Plus size={18} color="#FFFFFF" />} label="Add Program" />}
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
                <button onClick={() => { setSortDir('asc'); setSortOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: 6, color: '#111827' }}><ArrowUp size={16} color="#374151" /><span style={{ fontSize: 14 }}>A to Z</span></button>
                <button onClick={() => { setSortDir('desc'); setSortOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: 6, color: '#111827' }}><ArrowDown size={16} color="#374151" /><span style={{ fontSize: 14 }}>Z to A</span></button>
              </div>
            )}
          </div>
          <div className={syllabusStyles['section-select']} style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', height: 40, borderRadius: 9999, background: 'transparent', border: '1px solid #D1D5DB' }}>
            <Search size={16} style={{ marginRight: 8, color: '#374151' }} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search programs" style={{ border: 0, outline: 'none', background: 'transparent', width: 360, fontSize: 14 }} />
          </div>
        </div>
      )}

      {showTable && (
        <ProgramsTable
          programs={visiblePrograms}
          onView={(p) => setViewingProgram(p)}
          facultyNameSet={facultyNameSet}
          normalizeFacultyName={normalizeFacultyName}
        />
      )}

      {!showTable && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ width: 100, height: 100, borderRadius: 16, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clipboard size={48} color="#9CA3AF" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>No programs yet</div>
          <div style={{ color: '#6B7280', textAlign: 'center', maxWidth: 420, fontSize: 14, lineHeight: '1.5' }}>{periodId ? ('Upload a program list for ' + (currentPeriod ? currentPeriod.label : 'this period') + ' to get started.') : 'Select an academic period to begin.'}</div>
        </div>
      )}

      {showAddModal && (
        <AddRecordModal
          title="Add Program"
          fields={[
            { key: 'code', label: 'Code', required: true },
            { key: 'name', label: 'Name', required: true },
            { key: 'program_head', label: 'Faculty Name', type: 'searchable-select',
              options: facultyOptions, placeholder: 'Search active faculty…' },
            { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS.program },
          ]}
          onSubmit={onAddProgram}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {viewingProgram && (
        <ViewRecordModal
          title="View"
          fields={[
            { key: 'code', label: 'Code' },
            { key: 'name', label: 'Name' },
            { key: 'program_head', label: 'Faculty Name' },
            { key: 'status', label: 'Status' },
          ]}
          initial={viewingProgram}
          canEdit={isCurrentTermActive}
          onEdit={() => { setEditingProgram(viewingProgram); setViewingProgram(null); }}
          onClose={() => setViewingProgram(null)}
        />
      )}

      {editingProgram && (
        <EditRecordModal
          key={'prog-edit-' + editingProgram.id}
          title="Edit"
          fields={[
            { key: 'code', label: 'Code', required: true },
            { key: 'name', label: 'Name', required: true },
            { key: 'program_head', label: 'Faculty Name', type: 'searchable-select',
              options: facultyOptions, placeholder: 'Search active faculty…' },
            { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS.program },
          ]}
          initial={editingProgram}
          onSubmit={onSaveEdit}
          onBack={() => { setViewingProgram(editingProgram); setEditingProgram(null); }}
          onClose={() => setEditingProgram(null)}
        />
      )}

      {/* Per-row review of upload warnings (Yes = keep, flagged; No = delete). */}
      {unmatchedReview && (() => {
        const w = unmatchedReview.warnings[unmatchedReview.index];
        if (!w) return null;
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60 }} />
            <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(480px, 92vw)', background: '#FFFFFF', borderRadius: 12, zIndex: 61, padding: 24, boxShadow: '0 18px 50px rgba(0,0,0,0.25)' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
                Unmatched Faculty — Row {unmatchedReview.index + 1} of {unmatchedReview.warnings.length}
              </div>
              <div style={{ fontSize: 14, color: '#374151', lineHeight: '1.5', marginBottom: 16 }}>
                The Faculty Name <strong>"{w.program_head}"</strong> on program <strong>{w.code} — {w.name}</strong> was not found in the master Faculty list.
                Do you still wish to insert this program record into the table?
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={reviewReject} style={{ height: 40, padding: '0 18px', background: '#FFFFFF', border: '1px solid #B91C1C', color: '#B91C1C', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>No, discard</button>
                <button onClick={reviewKeep} style={{ height: 40, padding: '0 18px', background: '#1F2937', color: '#FFFFFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>Yes, keep</button>
              </div>
            </div>
          </>
        );
      })()}

      <ConfirmModal
        open={confirmUpload}
        title="Replace program data?"
        message={'Uploading this file will replace existing programs for ' + (currentPeriod ? currentPeriod.label : 'this period') + '. Proceed?'}
        confirmLabel="Continue to upload"
        onConfirm={() => { setConfirmUpload(false); setShowModal(true); }}
        onCancel={() => setConfirmUpload(false)}
      />

      <FloatingArchiveButton moduleType="programs" onEditStatus={onEditStatus} />

      {showModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2 }} onClick={() => !uploading && setShowModal(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, padding: 24, background: '#FFFFFF', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>Upload Program List</div>
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
};

export default DeanPrograms;
