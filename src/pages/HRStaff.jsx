/**
 * Department List — OVPAA sub-page.
 *
 * Was previously named "HRStaff" and self-rendered SkeletonA.
 * Now exported as content-only so OVPAA.jsx can host it alongside
 * the Academic Term page under one SkeletonA wrapper.
 */
import React from "react";
import DepartmentsTable from "../components/DepartmentsTable.jsx";
import PeriodSelector from "../components/PeriodSelector.jsx";
import AddRecordModal from "../components/AddRecordModal.jsx";
import EditRecordModal from "../components/EditRecordModal.jsx";
import ViewRecordModal from "../components/ViewRecordModal.jsx";
import ReconciliationModal from "../components/ReconciliationModal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import FloatingArchiveButton from "../components/FloatingArchiveButton.jsx";
import { Upload, Plus, Search, ArrowUp, ArrowDown } from "react-feather";
import syllabusStyles from '../styles/SyllabusSections.module.sass';
import { DepartmentsAPI } from '../services/api.js';
import { usePeriod } from '../services/period.jsx';
import { STATUS_OPTIONS, partitionByArchive } from '../services/statusPolicy.js';

const ActionBtn = ({ onClick, icon, label, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 18px', gap: 8, width: 240, height: 40, background: disabled ? '#9CA3AF' : '#EA1212', borderRadius: 6, color: '#fff', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: disabled ? 0.7 : 1 }}>
    <span style={{ width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
    {label}
  </button>
);

const DEPT_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'code', label: 'Code', required: true },
  { key: 'dean', label: 'Dean' },
  { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS.department },
];

const HRStaff = () => {
  const { currentPeriod, isCurrentTermActive } = usePeriod();
  const periodId = currentPeriod && currentPeriod.id;

  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [showAddModal, setShowAddModal]       = React.useState(false);
  const [editingDept, setEditingDept]         = React.useState(null);
  const [viewingDept, setViewingDept]         = React.useState(null);
  const [confirmUpload, setConfirmUpload]     = React.useState(false);
  const [recon, setRecon]                     = React.useState(null);   // { missing: [] }
  const [sortOpen, setSortOpen]               = React.useState(false);
  const [sortDir, setSortDir]                 = React.useState(null);
  const [selectedFile, setSelectedFile]       = React.useState(null);
  const [searchQuery, setSearchQuery]         = React.useState('');
  const [departments, setDepartments]         = React.useState([]);
  const [uploading, setUploading]             = React.useState(false);
  const [uploadError, setUploadError]         = React.useState(null);
  const fileInputRef = React.useRef(null);

  const refresh = React.useCallback(() => {
    if (!periodId) { setDepartments([]); return; }
    DepartmentsAPI.list(periodId)
      .then((rows) => setDepartments(Array.isArray(rows) ? rows : []))
      .catch(() => setDepartments([]));
  }, [periodId]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const showTable = departments.length > 0;

  const onConfirmUpload = async () => {
    if (!selectedFile) { alert('Please choose a file first'); return; }
    if (!periodId)     { alert('Select an academic period first'); return; }
    setUploading(true); setUploadError(null);
    try {
      const result = await DepartmentsAPI.upload(selectedFile, periodId);
      await refresh();
      setShowUploadModal(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Smart-sync: if anything in the DB wasn't in the Excel, open
      // the reconciliation modal.
      if (result && Array.isArray(result.missing) && result.missing.length > 0) {
        setRecon({ missing: result.missing });
      }
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onAddDepartment = async (record) => {
    await DepartmentsAPI.create(record, periodId);
    await refresh();
  };

  const onSaveEdit = async (patch) => {
    // Optimistic update — patch the row locally before the server round-trip
    // so the table reflects the change immediately. If the request fails the
    // catch in EditRecordModal surfaces the error and refresh() reconciles.
    setDepartments((prev) => prev.map((r) => r.id === editingDept.id ? { ...r, ...patch } : r));
    try {
      const saved = await DepartmentsAPI.update(editingDept.id, patch);
      // Reconcile with server response (in case of derived fields).
      setDepartments((prev) => prev.map((r) => r.id === editingDept.id ? { ...r, ...saved } : r));
    } catch (err) {
      await refresh();
      throw err;
    }
  };


  // Edit-status handler for the department archive (Active only).
  const onEditStatus = React.useCallback(async (row, newStatus) => {
    await DepartmentsAPI.update(row.id, { status: newStatus });
    await refresh();
  }, [refresh]);

  const onReconConfirm = async (idsToUnlist) => {
    if (idsToUnlist.length > 0) {
      await DepartmentsAPI.unlistMany(idsToUnlist);
      await refresh();
    }
    setRecon(null);
  };

  const visibleRows = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows = q
      ? departments.filter((d) => [d.name, d.code, d.dean, d.status].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)))
      : departments.slice();
    if (sortDir === 'asc')  rows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sortDir === 'desc') rows.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    // Archived rows (Unlisted / Archived) move to the global Archive view.
    return partitionByArchive(rows, 'department').main;
  }, [departments, searchQuery, sortDir]);

  return (
    <div style={{ padding: 20, background: '#FFFFFF', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Departments</h2>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <ActionBtn onClick={() => { if (departments.length > 0) { setConfirmUpload(true); } else { setShowUploadModal(true); } }} disabled={!periodId || !isCurrentTermActive} icon={<Upload size={18} color="#FFFFFF" />} label="Upload Department List" />
                {showTable && isCurrentTermActive && <ActionBtn onClick={() => setShowAddModal(true)} icon={<Plus size={18} color="#FFFFFF" />} label="Add Department" />}
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
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search departments" style={{ border: 0, outline: 'none', background: 'transparent', width: 360, fontSize: 14 }} />
              </div>
            </div>
          )}

          {showTable && (
            <DepartmentsTable
              departments={visibleRows}
              onView={(d) => setViewingDept(d)}
            />
          )}

          {!showTable && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ width: 100, height: 100, borderRadius: 16, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={48} color="#9CA3AF" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>No departments yet</div>
              <div style={{ color: '#6B7280', textAlign: 'center', maxWidth: 420, fontSize: 14, lineHeight: '1.5' }}>{periodId ? ('Upload a department list for ' + (currentPeriod ? currentPeriod.label : 'this period') + ' to get started.') : 'Select an academic period to begin.'}</div>
            </div>
          )}

          {showAddModal && (
            <AddRecordModal
              title="Add Department"
              fields={DEPT_FIELDS}
              onSubmit={onAddDepartment}
              onClose={() => setShowAddModal(false)}
            />
          )}

          {viewingDept && (
            <ViewRecordModal
              title="View"
              fields={DEPT_FIELDS}
              initial={viewingDept}
              canEdit={isCurrentTermActive}
              onEdit={() => { setEditingDept(viewingDept); setViewingDept(null); }}
              onClose={() => setViewingDept(null)}
            />
          )}

          {editingDept && (
            <EditRecordModal
              key={'dept-edit-' + editingDept.id}
              title="Edit"
              fields={DEPT_FIELDS}
              initial={editingDept}
              onSubmit={onSaveEdit}
              onBack={() => { setViewingDept(editingDept); setEditingDept(null); }}
              onClose={() => setEditingDept(null)}
            />
          )}

          <ConfirmModal
            open={confirmUpload}
            title="Replace department data?"
            message={'Uploading this file will replace existing departments for ' + (currentPeriod ? currentPeriod.label : 'this period') + '. Existing rows not in the new file will be flagged for reconciliation. Proceed?'}
            confirmLabel="Continue to upload"
            onConfirm={() => { setConfirmUpload(false); setShowUploadModal(true); }}
            onCancel={() => setConfirmUpload(false)}
          />

          {recon && (
            <ReconciliationModal
              missing={recon.missing}
              onConfirm={onReconConfirm}
              onKeepAll={() => setRecon(null)}
              onClose={() => setRecon(null)}
            />
          )}

          <FloatingArchiveButton moduleType="departments" onEditStatus={onEditStatus} />

          {showUploadModal && (
            <>
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2 }} onClick={() => !uploading && setShowUploadModal(false)} />
              <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, padding: 24, background: '#FFFFFF', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                <div style={{ fontSize: 20, fontWeight: 600 }}>Upload Department List</div>
                <div onClick={() => fileInputRef.current && fileInputRef.current.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) setSelectedFile(f); }} style={{ border: '2px dashed #D1D5DB', borderRadius: 8, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <Upload size={36} color="#9CA3AF" />
                  <div style={{ fontWeight: 600, color: '#111827' }}>{selectedFile ? selectedFile.name : 'Drag & drop file here'}</div>
                  <div style={{ color: '#6B7280', fontSize: 13 }}>Upload .xlsx, .xls or .csv</div>
                  <input type="file" ref={fileInputRef} accept=".csv,.xlsx,.xls" onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) setSelectedFile(f); }} style={{ display: 'none' }} />
                </div>
                {uploadError && <div style={{ color: '#B91C1C', fontSize: 13 }}>{uploadError}</div>}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button disabled={uploading} onClick={() => { setSelectedFile(null); setShowUploadModal(false); }} style={{ flex: 1, height: 40, background: '#FFFFFF', border: '1px solid #111827', borderRadius: 8, color: '#111827', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 500 }}>Cancel</button>
                  <button disabled={uploading} onClick={onConfirmUpload} style={{ flex: 1, height: 40, background: '#1F2937', border: 'none', borderRadius: 8, color: '#FFFFFF', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 500, opacity: uploading ? 0.7 : 1 }}>{uploading ? 'Uploading…' : 'Upload'}</button>
                </div>
              </div>
            </>
          )}
    </div>
  );
};

export default HRStaff;
