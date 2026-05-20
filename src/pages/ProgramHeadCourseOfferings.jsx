import React from "react";
import SkeletonA from "../layouts/SkeletonA.jsx";
import HeaderA from "../components/HeaderA.jsx";
import SideNavigation from "../components/SideNavigation.jsx";
import { Search, ArrowUp, ArrowDown, Upload, Clipboard, ChevronRight, Plus } from "react-feather";
import PeriodSelector from "../components/PeriodSelector.jsx";
import AddRecordModal from "../components/AddRecordModal.jsx";
import EditRecordModal from "../components/EditRecordModal.jsx";
import ViewRecordModal from "../components/ViewRecordModal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import FloatingArchiveButton from "../components/FloatingArchiveButton.jsx";
import styles from '../styles/CoursesTable.module.sass';
import syllabusStyles from '../styles/SyllabusSections.module.sass';
import { CourseOfferingsAPI } from '../services/api.js';
import { usePeriod } from '../services/period.jsx';
import { STATUS_OPTIONS, statusPillStyle, partitionByArchive } from '../services/statusPolicy.js';

const ActionBtn = ({ onClick, icon, label, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 18px', gap: 8, width: 240, height: 40, background: disabled ? '#9CA3AF' : '#EA1212', borderRadius: 6, color: '#fff', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: disabled ? 0.7 : 1 }}>
    <span style={{ width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
    {label}
  </button>
);

const mapServerRow = (r) => ({
  id: r.id,
  code: r.code,
  description: r.title,
  units: r.units !== null && r.units !== undefined ? Number(r.units) : '',
  status: r.status || 'Active',
});

const ProgramHeadCourseOfferings = () => {
  const { currentPeriod, isCurrentTermActive } = usePeriod();
  const periodId = currentPeriod && currentPeriod.id;

  const [showModal, setShowModal]       = React.useState(false);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [editingCourse, setEditingCourse]   = React.useState(null);
  const [confirmUpload, setConfirmUpload]   = React.useState(false);
  const [sortOpen, setSortOpen]         = React.useState(false);
  const [sortDir, setSortDir]           = React.useState(null);
  const [detailsOpen, setDetailsOpen]   = React.useState(false);
  const [selectedCourseDetails, setSelectedCourseDetails] = React.useState(null);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [searchQuery, setSearchQuery]   = React.useState('');
  const [coursesList, setCoursesList]   = React.useState([]);
  const [uploading, setUploading]       = React.useState(false);
  const [uploadError, setUploadError]   = React.useState(null);
  const fileInputRef = React.useRef(null);

  const refresh = React.useCallback(() => {
    if (!periodId) { setCoursesList([]); return; }
    CourseOfferingsAPI.list(periodId)
      .then((rows) => setCoursesList(Array.isArray(rows) ? rows.map(mapServerRow) : []))
      .catch(() => setCoursesList([]));
  }, [periodId]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const showTable = coursesList.length > 0;

  const onAddCourse = async (record) => {
    await CourseOfferingsAPI.create({
      code: record.code,
      title: record.description,
      units: record.units || null,
    }, periodId);
    await refresh();
  };

  const onSaveEdit = async (patch) => {
    // Map UI keys to server keys.
    const serverPatch = {};
    if (patch.code !== undefined)        serverPatch.code = patch.code;
    if (patch.description !== undefined) serverPatch.title = patch.description;
    if (patch.units !== undefined)       serverPatch.units = patch.units;
    if (patch.status !== undefined)      serverPatch.status = patch.status;

    // Optimistic local patch.
    setCoursesList((prev) => prev.map((r) => r.id === editingCourse.id ? { ...r, ...patch } : r));
    try {
      await CourseOfferingsAPI.update(editingCourse.id, serverPatch);
      await refresh();
    } catch (err) {
      await refresh();
      throw err;
    }
  };


  const handleConfirmUpload = async () => {
    if (!selectedFile) { alert('Please choose a file first'); return; }
    if (!periodId)     { alert('Select an academic period first'); return; }
    setUploading(true); setUploadError(null);
    try {
      await CourseOfferingsAPI.upload(selectedFile, periodId);
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

  // Edit-status handler for the course-offering archive (Active only).
  const onEditStatus = React.useCallback(async (row, newStatus) => {
    await CourseOfferingsAPI.update(row.id, { status: newStatus });
    await refresh();
  }, [refresh]);

  const visibleCourses = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows = q
      ? coursesList.filter((r) => [r.code, r.description].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)))
      : coursesList.slice();
    if (sortDir === 'asc')  rows.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    if (sortDir === 'desc') rows.sort((a, b) => (b.code || '').localeCompare(a.code || ''));
    // Archived statuses (Unlisted / Cancelled) move to the global Archive view.
    return partitionByArchive(rows, 'courseoffer').main;
  }, [coursesList, searchQuery, sortDir]);

  const content = (
    <div style={{ padding: 20, background: '#FFFFFF', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Course Offerings</h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <ActionBtn onClick={() => { if (coursesList.length > 0) { setConfirmUpload(true); } else { setShowModal(true); } }} disabled={!periodId || !isCurrentTermActive} icon={<Upload size={18} color="#FFFFFF" />} label="Upload Course Offerings" />
            {showTable && isCurrentTermActive && <ActionBtn onClick={() => setShowAddModal(true)} icon={<Plus size={18} color="#FFFFFF" />} label="Add Course" />}
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
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search courses" style={{ border: 0, outline: 'none', background: 'transparent', width: 360, fontSize: 14 }} />
          </div>
        </div>
      )}

      {showTable && (
        <div className={styles['table-container']} style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflowX: 'auto', overflowY: 'hidden' }}>
          <table style={{ width: '100%' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 1 }}>
              <tr>
                <th width={180}>COURSE NO.</th>
                <th width={360} style={{ paddingLeft: 24 }}>COURSE NAME</th>
                <th width={100} style={{ paddingLeft: 24 }}>UNITS</th>
                <th width={140} style={{ paddingLeft: 24 }}>STATUS</th>
                <th className={styles.fill}></th>
              </tr>
            </thead>
            <tbody>
              {visibleCourses.map((row) => (
                <tr key={row.id}>
                  <td width={180}>{row.code}</td>
                  <td width={360} style={{ paddingLeft: 24 }}>{row.description}</td>
                  <td width={100} style={{ paddingLeft: 24 }}>{row.units}</td>
                  <td width={140} style={{ paddingLeft: 24 }}>
                    <span style={{ ...statusPillStyle('courseoffer', row.status), padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                      {row.status}
                    </span>
                  </td>
                  <td className={styles.fill} style={{ minWidth: 200, paddingRight: 10, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <a href="#" className={styles.actionLink} onClick={(e) => { e.preventDefault(); setSelectedCourseDetails(row); setDetailsOpen(true); }} style={{ color: '#111827', display: 'inline-flex', alignItems: 'center' }}>
                      <span style={{ marginRight: 6 }}>View</span>
                      <span className={styles.actionIcon} style={{ color: '#111827' }}><ChevronRight size={16} /></span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!showTable && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ width: 92, height: 92, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clipboard size={40} color="#9CA3AF" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>No courses yet</div>
          <div style={{ color: '#6B7280', textAlign: 'center', maxWidth: 420 }}>{periodId ? ('Upload a course list for ' + (currentPeriod ? currentPeriod.label : 'this period') + ' to get started.') : 'Select an academic period to begin.'}</div>
        </div>
      )}

      {detailsOpen && selectedCourseDetails && (
        <ViewRecordModal
          title="View"
          fields={[
            { key: 'code', label: 'Course No.' },
            { key: 'description', label: 'Description' },
            { key: 'units', label: 'Units' },
            { key: 'status', label: 'Status' },
          ]}
          initial={selectedCourseDetails}
          canEdit={isCurrentTermActive}
          onEdit={() => { setEditingCourse(selectedCourseDetails); setDetailsOpen(false); }}
          onClose={() => setDetailsOpen(false)}
        />
      )}

      {showAddModal && (
        <AddRecordModal
          title="Add Course"
          fields={[
            { key: 'code', label: 'Course No.', required: true },
            { key: 'description', label: 'Description', required: true },
            { key: 'units', label: 'Units' },
            { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS.courseoffer },
          ]}
          onSubmit={onAddCourse}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingCourse && (
        <EditRecordModal
          key={'course-edit-' + editingCourse.id}
          title="Edit"
          fields={[
            { key: 'code', label: 'Course No.', required: true },
            { key: 'description', label: 'Description', required: true },
            { key: 'units', label: 'Units' },
            { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS.courseoffer },
          ]}
          initial={editingCourse}
          onSubmit={onSaveEdit}
          onBack={() => { setSelectedCourseDetails(editingCourse); setDetailsOpen(true); setEditingCourse(null); }}
          onClose={() => setEditingCourse(null)}
        />
      )}

      <ConfirmModal
        open={confirmUpload}
        title="Replace course offerings?"
        message={'Uploading this file will replace existing course offerings for ' + (currentPeriod ? currentPeriod.label : 'this period') + '. Proceed?'}
        confirmLabel="Continue to upload"
        onConfirm={() => { setConfirmUpload(false); setShowModal(true); }}
        onCancel={() => setConfirmUpload(false)}
      />

      <FloatingArchiveButton moduleType="course_offerings" onEditStatus={onEditStatus} />

      {showModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2 }} onClick={() => !uploading && setShowModal(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, padding: 24, background: '#FFFFFF', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>Upload Course Offerings</div>
            <div
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) setSelectedFile(f); }}
              style={{ border: '2px dashed #D1D5DB', borderRadius: 8, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
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

export default ProgramHeadCourseOfferings;
