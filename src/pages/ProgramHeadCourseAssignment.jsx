/**
 * Course Assignment — Program Head feature.
 *
 * The Course Assignment module has its own table (course_assignments),
 * separate from Course Offerings. Each row pairs a course with an
 * assigned faculty member and carries a validation status:
 *
 *   Verified      — course + faculty matched against this period's
 *                   master lists, and both are Active.
 *   Pending Match — the course code or faculty name was not found
 *                   (only reachable via upload — Add/Edit use dropdowns).
 *   Flagged       — matched, but the course or faculty is not Active.
 *   Archived      — removed from the main table via the Edit modal's
 *                   "Remove" action; shown in the global Archive.
 *
 * The table starts blank each term. Add/Edit use dropdowns bound to the
 * period's Course Offerings + Faculty, so manual entry resolves straight
 * to Verified / Flagged. Uploading a file validates every row and
 * surfaces non-Verified rows in a review modal.
 */
import React from "react";
import SkeletonA from "../layouts/SkeletonA.jsx";
import HeaderA from "../components/HeaderA.jsx";
import SideNavigation from "../components/SideNavigation.jsx";
import PeriodSelector from "../components/PeriodSelector.jsx";
import AddRecordModal from "../components/AddRecordModal.jsx";
import EditRecordModal from "../components/EditRecordModal.jsx";
import ViewRecordModal from "../components/ViewRecordModal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import FloatingArchiveButton from "../components/FloatingArchiveButton.jsx";
import { Search, ArrowUp, ArrowDown, Upload, Plus, Clipboard, ChevronRight } from "react-feather";
import styles from '../styles/CoursesTable.module.sass';
import syllabusStyles from '../styles/SyllabusSections.module.sass';
import { CourseAssignmentsAPI, CourseOfferingsAPI, FacultyAPI } from '../services/api.js';
import { usePeriod } from '../services/period.jsx';
import { statusPillStyle, partitionByArchive } from '../services/statusPolicy.js';

const ActionBtn = ({ onClick, icon, label, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8px 18px', gap: 8, minWidth: 240, height: 40, background: disabled ? '#9CA3AF' : '#EA1212', borderRadius: 6, color: '#fff', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: disabled ? 0.7 : 1 }}>
    <span style={{ width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
    {label}
  </button>
);

// Drop common honorifics so "Dr. Maria Santos" still matches a Faculty
// row stored as "Maria Santos". Mirrors normalizeName in the controller.
const normalizeName = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/\b(dr|prof|professor|engr|engineer|atty|mr|mrs|ms|sir|maam|ma'?am)\.?\s+/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Roles offered when creating a missing Faculty profile from the
// "Confirm & Add" popup (createFaculty requires name + role).
const FACULTY_ROLES = ['Instructor', 'Assistant Professor', 'Associate Professor', 'Professor', 'Program Head', 'Dean'];

const ProgramHeadCourseAssignment = () => {
  const { currentPeriod, isCurrentTermActive } = usePeriod();
  const periodId = currentPeriod && currentPeriod.id;

  const [assignments, setAssignments]         = React.useState([]);
  const [courses, setCourses]                 = React.useState([]);
  const [faculty, setFaculty]                 = React.useState([]);
  const [searchQuery, setSearchQuery]         = React.useState('');
  const [sortOpen, setSortOpen]               = React.useState(false);
  const [sortDir, setSortDir]                 = React.useState(null);
  const [showModal, setShowModal]             = React.useState(false);  // upload modal
  const [showAddModal, setShowAddModal]       = React.useState(false);
  const [editingAssignment, setEditingAssignment] = React.useState(null);
  const [viewingAssignment, setViewingAssignment] = React.useState(null);
  const [confirmUpload, setConfirmUpload]     = React.useState(false);
  const [selectedFile, setSelectedFile]       = React.useState(null);
  const [uploading, setUploading]             = React.useState(false);
  const [uploadError, setUploadError]         = React.useState(null);
  const [uploadReview, setUploadReview]       = React.useState(null);   // { inserted, warnings: [] }
  const [pendingConfirm, setPendingConfirm]   = React.useState(null);   // { mode, id?, payload, status }
  const fileInputRef = React.useRef(null);

  const refresh = React.useCallback(() => {
    if (!periodId) { setAssignments([]); setCourses([]); setFaculty([]); return; }
    CourseAssignmentsAPI.list(periodId).then((rows) => setAssignments(Array.isArray(rows) ? rows : [])).catch(() => setAssignments([]));
    CourseOfferingsAPI.list(periodId).then((rows) => setCourses(Array.isArray(rows) ? rows : [])).catch(() => setCourses([]));
    FacultyAPI.list(periodId).then((rows) => setFaculty(Array.isArray(rows) ? rows : [])).catch(() => setFaculty([]));
  }, [periodId]);

  React.useEffect(() => { refresh(); }, [refresh]);

  const showTable = assignments.length > 0;

  // Look up a course / faculty in the current period's master lists.
  // Faculty matching is exact first, then honorific-stripped.
  const findCourse = (code) => {
    const cc = String(code || '').trim().toLowerCase();
    return cc ? (courses.find((c) => String(c.code).trim().toLowerCase() === cc) || null) : null;
  };
  const findFaculty = (name) => {
    if (!name) return null;
    const fn = String(name).trim().toLowerCase();
    const norm = normalizeName(name);
    return faculty.find((f) => String(f.name).trim().toLowerCase() === fn)
        || faculty.find((f) => normalizeName(f.name) === norm)
        || null;
  };

  // Mirrors the backend resolveAssignment rule so Add/Edit can warn
  // before saving: Verified needs the course AND faculty both found and
  // both 'Active'; anything matched-but-not-Active is Flagged.
  const resolveStatus = (courseCode, facultyName) => {
    const course = findCourse(courseCode);
    const fac = findFaculty(facultyName);
    if (!course || !fac) return 'Pending Match';
    if (course.status !== 'Active' || fac.status !== 'Active') return 'Flagged';
    return 'Verified';
  };

  // Build the pending-confirm state, flagging which entities are missing
  // so the "Confirm & Add" popup can offer to create them.
  const buildPendingConfirm = ({ mode, id, payload, status, courseCode, facultyName }) => ({
    mode, id, payload, status, courseCode, facultyName,
    courseMissing:  !!courseCode  && !findCourse(courseCode),
    facultyMissing: !!facultyName && !findFaculty(facultyName),
    courseTitle: '',
    facultyRole: FACULTY_ROLES[0],
  });

  const statusReason = (status) =>
    status === 'Pending Match'
      ? "the course or faculty was not found in this period's Course Offerings / Faculty lists"
      : 'the matched course or faculty is not Active (Inactive / On Leave / Emeritus, etc.)';

  const handleConfirmUpload = async () => {
    if (!selectedFile) { alert('Please choose a file first'); return; }
    if (!periodId)     { alert('Select an academic period first'); return; }
    setUploading(true); setUploadError(null);
    try {
      const result = await CourseAssignmentsAPI.upload(selectedFile, periodId);
      await refresh();
      setShowModal(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (result && Array.isArray(result.warnings) && result.warnings.length > 0) {
        setUploadReview({ inserted: result.inserted, warnings: result.warnings });
      }
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onAddAssignment = async (record) => {
    const status = resolveStatus(record.course_code, record.faculty_name);
    if (status !== 'Verified') {
      // Add modal closes; the confirm / Confirm & Add popup gates the save.
      setPendingConfirm(buildPendingConfirm({ mode: 'add', payload: record, status, courseCode: record.course_code, facultyName: record.faculty_name }));
      return;
    }
    await CourseAssignmentsAPI.create(record, periodId);
    await refresh();
  };

  const onSaveEdit = async (patch) => {
    const merged = { ...editingAssignment, ...patch };
    const status = resolveStatus(merged.course_code, merged.faculty_name);
    if (status !== 'Verified') {
      setPendingConfirm(buildPendingConfirm({ mode: 'edit', id: editingAssignment.id, payload: patch, status, courseCode: merged.course_code, facultyName: merged.faculty_name }));
      return;
    }
    await CourseAssignmentsAPI.update(editingAssignment.id, patch);
    await refresh();
  };

  // Save the assignment as-is (status stays Pending Match / Flagged).
  const commitPendingConfirm = async () => {
    if (!pendingConfirm) return;
    try {
      if (pendingConfirm.mode === 'add') {
        await CourseAssignmentsAPI.create(pendingConfirm.payload, periodId);
      } else {
        await CourseAssignmentsAPI.update(pendingConfirm.id, pendingConfirm.payload);
      }
      await refresh();
    } catch (err) {
      alert('Could not save: ' + err.message);
    } finally {
      setPendingConfirm(null);
    }
  };

  // Create the missing Faculty / Course Offering in the current period,
  // then save the assignment — the backend re-resolves against the now
  // up-to-date master lists, so the row lands as Verified.
  const createMissingAndSave = async () => {
    if (!pendingConfirm) return;
    try {
      if (pendingConfirm.courseMissing) {
        await CourseOfferingsAPI.create({
          code: pendingConfirm.courseCode,
          title: pendingConfirm.courseTitle || pendingConfirm.courseCode,
          status: 'Active',
        }, periodId);
      }
      if (pendingConfirm.facultyMissing) {
        await FacultyAPI.create({
          name: pendingConfirm.facultyName,
          role: pendingConfirm.facultyRole || FACULTY_ROLES[0],
          status: 'Active',
        }, periodId);
      }
      if (pendingConfirm.mode === 'add') {
        await CourseAssignmentsAPI.create(pendingConfirm.payload, periodId);
      } else {
        await CourseAssignmentsAPI.update(pendingConfirm.id, pendingConfirm.payload);
      }
      await refresh();
    } catch (err) {
      alert('Could not create & save: ' + err.message);
    } finally {
      setPendingConfirm(null);
    }
  };

  // "Remove" in the Edit modal archives the row — it leaves the main
  // table and shows up in the global Floating Archive instead.
  const onArchiveAssignment = async () => {
    if (!editingAssignment) return;
    await CourseAssignmentsAPI.update(editingAssignment.id, { status: 'Archived' });
    await refresh();
    setEditingAssignment(null);
  };

  // Edit-status handler for the course-assignment archive
  // (Verified / Pending Match / Flagged).
  const onEditStatus = React.useCallback(async (row, newStatus) => {
    await CourseAssignmentsAPI.update(row.id, { status: newStatus });
    await refresh();
  }, [refresh]);

  const visibleAssignments = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows = q
      ? assignments.filter((a) => [a.course_code, a.course_name, a.faculty_name].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)))
      : assignments.slice();
    if (sortDir === 'asc')  rows.sort((a, b) => (a.course_code || '').localeCompare(b.course_code || ''));
    if (sortDir === 'desc') rows.sort((a, b) => (b.course_code || '').localeCompare(a.course_code || ''));
    // Archived assignments move to the global Archive view.
    return partitionByArchive(rows, 'courseassign').main;
  }, [assignments, searchQuery, sortDir]);

  // Dropdown options bound to this period's master lists. Picking a
  // Course ID syncs the Course Name and vice-versa, so the two never
  // disagree; the Faculty list drives the Assigned Faculty dropdown.
  const courseCodeOptions = courses.map((c) => ({ value: c.code, label: c.code }));
  const courseNameOptions = courses.map((c) => ({ value: c.title, label: c.title }));
  const facultyOptions = faculty.map((f) => ({ value: f.name, label: f.name + (f.role ? ' (' + f.role + ')' : '') }));

  const onPickCourseCode = (code) => {
    const c = courses.find((x) => x.code === code);
    return { course_name: c ? c.title : '' };
  };
  const onPickCourseName = (title) => {
    const c = courses.find((x) => x.title === title);
    return c ? { course_code: c.code } : {};
  };

  const addFields = [
    { key: 'course_code', label: 'Course No.', required: true, type: 'select', options: courseCodeOptions, onSelect: onPickCourseCode },
    { key: 'course_name', label: 'Course Name', type: 'select', options: courseNameOptions, onSelect: onPickCourseName },
    { key: 'faculty_name', label: 'Assigned Faculty', type: 'select', options: facultyOptions },
  ];

  const content = (
    <div style={{ padding: 20, background: '#FFFFFF', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Course Assignment</h2>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <ActionBtn onClick={() => { if (assignments.length > 0) { setConfirmUpload(true); } else { setShowModal(true); } }} disabled={!periodId || !isCurrentTermActive} icon={<Upload size={18} color="#FFFFFF" />} label="Upload Course Assignment" />
            {showTable && isCurrentTermActive && <ActionBtn onClick={() => setShowAddModal(true)} icon={<Plus size={18} color="#FFFFFF" />} label="Add Assignment" />}
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
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search assignments" style={{ border: 0, outline: 'none', background: 'transparent', width: 360, fontSize: 14 }} />
          </div>
        </div>
      )}

      {showTable && (
        <div className={styles['table-container']} style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflowX: 'auto', overflowY: 'hidden' }}>
          <table style={{ width: '100%' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 1 }}>
              <tr>
                <th width={160}>COURSE NO.</th>
                <th width={420}>COURSE NAME</th>
                <th width={280}>ASSIGNED FACULTY</th>
                <th width={140}>STATUS</th>
                <th className={styles.fill}></th>
              </tr>
            </thead>
            <tbody>
              {visibleAssignments.map((row) => (
                <tr key={row.id}>
                  <td width={160}>{row.course_code}</td>
                  <td width={420}>{row.course_name || ''}</td>
                  <td width={280}>{row.faculty_name || <span style={{ color: '#9CA3AF' }}>— Unassigned —</span>}</td>
                  <td width={140}>
                    <span style={{ ...statusPillStyle('courseassign', row.status), padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                      {row.status}
                    </span>
                  </td>
                  <td className={styles.fill} style={{ minWidth: 120, paddingRight: 10, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <a href="#" className={styles.actionLink} onClick={(e) => { e.preventDefault(); setViewingAssignment(row); }} style={{ color: '#111827', display: 'inline-flex', alignItems: 'center' }}>
                      <span style={{ marginRight: 6 }}>View</span>
                      <ChevronRight size={16} />
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
          <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>No course assignments yet</div>
          <div style={{ color: '#6B7280', textAlign: 'center', maxWidth: 480 }}>{periodId ? ('Upload a course assignment file for ' + (currentPeriod ? currentPeriod.label : 'this period') + ' to get started — each row is validated against Course Offerings and Faculty.') : 'Select an academic period to begin.'}</div>
        </div>
      )}

      {showAddModal && (
        <AddRecordModal
          title="Add Course Assignment"
          fields={addFields}
          onSubmit={onAddAssignment}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {viewingAssignment && (
        <ViewRecordModal
          title="View"
          fields={[
            { key: 'course_code', label: 'Course No.' },
            { key: 'course_name', label: 'Course Name' },
            { key: 'faculty_name', label: 'Assigned Faculty' },
            { key: 'status', label: 'Status' },
          ]}
          initial={viewingAssignment}
          canEdit={isCurrentTermActive}
          onEdit={() => { setEditingAssignment(viewingAssignment); setViewingAssignment(null); }}
          onClose={() => setViewingAssignment(null)}
        />
      )}

      {editingAssignment && (
        <EditRecordModal
          key={'ca-edit-' + editingAssignment.id}
          title="Edit"
          fields={[
            {
              key: 'course_code', label: 'Course No.', required: true, type: 'select',
              options: courseCodeOptions, onSelect: onPickCourseCode,
              highlight: editingAssignment.status === 'Pending Match' && !editingAssignment.course_offering_id,
            },
            { key: 'course_name', label: 'Course Name', type: 'select', options: courseNameOptions, onSelect: onPickCourseName },
            {
              key: 'faculty_name', label: 'Assigned Faculty', type: 'select',
              options: facultyOptions,
              highlight: editingAssignment.status === 'Pending Match' && !editingAssignment.faculty_id,
            },
          ]}
          initial={editingAssignment}
          onSubmit={onSaveEdit}
          onBack={() => { setViewingAssignment(editingAssignment); setEditingAssignment(null); }}
          onClose={() => setEditingAssignment(null)}
          onRemove={onArchiveAssignment}
          removeLabel="Remove"
        />
      )}

      <ConfirmModal
        open={confirmUpload}
        title="Replace course assignment data?"
        message={'Uploading this file will replace existing course assignments for ' + (currentPeriod ? currentPeriod.label : 'this period') + '. Proceed?'}
        confirmLabel="Continue to upload"
        onConfirm={() => { setConfirmUpload(false); setShowModal(true); }}
        onCancel={() => setConfirmUpload(false)}
      />

      {/* Flagged → simple override confirm. Pending Match → Confirm & Add (below). */}
      <ConfirmModal
        open={!!pendingConfirm && pendingConfirm.status === 'Flagged'}
        title={pendingConfirm ? ('Save as ' + pendingConfirm.status + '?') : ''}
        message={pendingConfirm ? ('This course assignment will be saved as "' + pendingConfirm.status + '" because ' + statusReason(pendingConfirm.status) + '. Save it anyway?') : ''}
        confirmLabel="Save anyway"
        onConfirm={commitPendingConfirm}
        onCancel={() => setPendingConfirm(null)}
      />

      {pendingConfirm && pendingConfirm.status === 'Pending Match' && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60 }} onClick={() => setPendingConfirm(null)} />
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(520px, 92vw)', maxHeight: '85vh', background: '#FFFFFF', borderRadius: 12, zIndex: 61, display: 'flex', flexDirection: 'column', boxShadow: '0 18px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#111827' }}>Confirm &amp; Add</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                {(pendingConfirm.courseMissing || pendingConfirm.facultyMissing)
                  ? "The highlighted records aren't in this period's master lists yet. Create them now to verify the assignment, or save it as Pending Match for later."
                  : 'This assignment has no matching faculty yet. Save it as Pending Match, or cancel and pick a faculty.'}
              </div>
            </div>
            <div style={{ padding: '16px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
              {pendingConfirm.courseMissing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#B91C1C' }}>New Course Offering</div>
                  <label style={{ fontSize: 12, color: '#6B7280' }}>Course ID</label>
                  <input value={pendingConfirm.courseCode || ''} disabled style={{ height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#F9FAFB', fontSize: 14 }} />
                  <label style={{ fontSize: 12, color: '#6B7280' }}>Course Title</label>
                  <input
                    value={pendingConfirm.courseTitle}
                    onChange={(e) => setPendingConfirm((p) => ({ ...p, courseTitle: e.target.value }))}
                    placeholder="e.g. Introduction to Computing"
                    style={{ height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 14 }}
                  />
                </div>
              )}
              {pendingConfirm.facultyMissing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#B91C1C' }}>New Faculty Profile</div>
                  <label style={{ fontSize: 12, color: '#6B7280' }}>Name</label>
                  <input value={pendingConfirm.facultyName || ''} disabled style={{ height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#F9FAFB', fontSize: 14 }} />
                  <label style={{ fontSize: 12, color: '#6B7280' }}>Role</label>
                  <select
                    value={pendingConfirm.facultyRole}
                    onChange={(e) => setPendingConfirm((p) => ({ ...p, facultyRole: e.target.value }))}
                    style={{ height: 38, padding: '0 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 14, background: '#FFFFFF' }}
                  >
                    {FACULTY_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={() => setPendingConfirm(null)} style={{ height: 40, padding: '0 16px', background: '#FFFFFF', border: '1px solid #111827', borderRadius: 8, color: '#111827', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button onClick={commitPendingConfirm} style={{ height: 40, padding: '0 16px', background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 8, color: '#374151', cursor: 'pointer', fontWeight: 500 }}>Save as Pending Match</button>
              {(pendingConfirm.courseMissing || pendingConfirm.facultyMissing) && (
                <button onClick={createMissingAndSave} style={{ height: 40, padding: '0 16px', background: '#1F2937', border: 'none', borderRadius: 8, color: '#FFFFFF', cursor: 'pointer', fontWeight: 500 }}>Create &amp; Save</button>
              )}
            </div>
          </div>
        </>
      )}

      {uploadReview && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60 }} onClick={() => setUploadReview(null)} />
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(640px, 92vw)', maxHeight: '80vh', background: '#FFFFFF', borderRadius: 12, zIndex: 61, display: 'flex', flexDirection: 'column', boxShadow: '0 18px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#111827' }}>Upload validation</div>
              <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                {uploadReview.inserted} assignment{uploadReview.inserted === 1 ? '' : 's'} imported. {uploadReview.warnings.length} need{uploadReview.warnings.length === 1 ? 's' : ''} attention:
              </div>
            </div>
            <div style={{ padding: '8px 24px', overflowY: 'auto' }}>
              {uploadReview.warnings.map((w, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: 14, color: '#111827' }}>
                    <strong>Row {w.row}</strong> — {w.course_code}{w.faculty_name ? ' / ' + w.faculty_name : ''}
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{w.message}</div>
                  </div>
                  <span style={{ ...statusPillStyle('courseassign', w.status), padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{w.status}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setUploadReview(null)} style={{ height: 40, padding: '0 20px', background: '#1F2937', color: '#FFFFFF', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>Got it</button>
            </div>
          </div>
        </>
      )}

      <FloatingArchiveButton moduleType="course_assignments" onEditStatus={onEditStatus} />

      {showModal && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2 }} onClick={() => !uploading && setShowModal(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, padding: 24, background: '#FFFFFF', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 16, zIndex: 3, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 20, fontWeight: 600 }}>Upload Course Assignment</div>
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

export default ProgramHeadCourseAssignment;
