
import styles from '../styles/CoursesTable.module.sass';
import { ChevronRight } from 'react-feather';
import { Link } from 'react-router-dom';
import { statusPillStyle } from '../services/statusPolicy.js';

const FacultyTable = ({ faculty = [], onView, hideDepartment = false }) => {
  return (
    <div className={styles['table-container']} style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflowX: 'auto', overflowY: 'hidden' }}>
      <table>
        <thead style={{ position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 1 }}>
          <tr>
            <th width={hideDepartment ? 500 : 380}>NAME</th>
            {!hideDepartment && <th width={180}>DEPARTMENT</th>}
            <th width={180}>ROLE</th>
            <th width={120}>STATUS</th>
            <th className={styles.fill}></th>
          </tr>
        </thead>
        <tbody>
          {faculty.map((f, idx) => {
            const status = f.status || 'Active';
            return (
              <tr key={f.id || idx}>
                <td width={hideDepartment ? 500 : 380}>{f.name}</td>
                {!hideDepartment && <td width={180}>{f.department}</td>}
                <td width={180}>{f.role}</td>
                <td width={120}>
                  <span style={{ ...statusPillStyle('faculty', status), padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                    {status}
                  </span>
                </td>
                <td className={styles.fill} style={{ paddingRight: 12, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {onView && (
                    <Link
                      to="#"
                      className={'actionLink'}
                      onClick={(e) => { e.preventDefault(); onView(f); }}
                      style={{ background: 'transparent', display: 'inline-flex', alignItems: 'center', color: '#111827' }}
                    >
                      View
                      <ChevronRight size={18} />
                    </Link>
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

export default FacultyTable
