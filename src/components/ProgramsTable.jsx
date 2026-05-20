import styles from '../styles/CoursesTable.module.sass'
import { ChevronRight } from 'react-feather'
import { statusPillStyle } from '../services/statusPolicy.js'

/**
 * Programs table.
 * Columns: CODE | NAME | FACULTY NAME | STATUS | (edit).
 *
 * When `readOnly` is set (period is closed) the Edit pencil is
 * hidden so the table renders cleanly without any per-row controls.
 *
 * If a `facultyNameSet` (Set of normalized names) is provided, any
 * program_head that isn't in the set gets a red "⚠️ Unmatched" tag
 * rendered directly above the name in the cell.
 */
const ProgramsTable = ({ programs = [], onView, facultyNameSet, normalizeFacultyName }) => {
  const isUnmatched = (head) => {
    if (!facultyNameSet || !normalizeFacultyName) return false;
    if (!head) return false;
    return !facultyNameSet.has(normalizeFacultyName(head));
  };
  return (
    <div className={styles['table-container']} style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflowX: 'auto', overflowY: 'hidden' }}>
      <table>
        <thead style={{ position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 1 }}>
          <tr>
            <th width={120}>CODE</th>
            <th width={460}>NAME</th>
            <th width={240}>FACULTY NAME</th>
            <th width={120}>STATUS</th>
            <th className={styles.fill}></th>
          </tr>
        </thead>
        <tbody>
          {programs.map((p) => {
            const status = p.status || 'Active';
            const head = p.program_head || p.head || p.faculty_name || '';
            const unmatched = isUnmatched(head);
            return (
            <tr key={p.id || (p.code + '-' + p.name)}>
              <td width={120}>{p.code}</td>
              <td width={460}>{p.name}</td>
              <td width={240}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: 2 }}>
                  {unmatched && (
                    <span style={{ color: '#B91C1C', fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>
                      Unmatched
                    </span>
                  )}
                  <span>{head}</span>
                </div>
              </td>
              <td width={120}>
                <span style={{ ...statusPillStyle('program', status), padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                  {status}
                </span>
              </td>
              <td className={styles.fill} style={{ paddingRight: 12, textAlign: 'right', whiteSpace: 'nowrap' }}>
                {onView && (
                  <a href="#" onClick={(e) => { e.preventDefault(); onView(p); }} style={{ color: '#111827', display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{ marginRight: 6 }}>View</span>
                    <ChevronRight size={16} />
                  </a>
                )}
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ProgramsTable
