import React from 'react'
import styles from '../styles/CoursesTable.module.sass'
import { User } from 'react-feather'
import { statusPillStyle } from '../services/statusPolicy.js'

const ConsultantsTable = ({ consultants = [], onAssign, hideDepartment = false, readOnly = false }) => {
  return (
    <div className={styles['table-container']} style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflowX: 'auto', overflowY: 'hidden' }}>
      <table>
        <thead style={{ position: 'sticky', top: 0, background: '#FFFFFF', zIndex: 1 }}>
          <tr>
            <th width={260}>NAME</th>
            {!hideDepartment && <th width={400}>DEPARTMENT</th>}
            <th width={220}>ASSIGNED COURSE</th>
            <th width={130}>STATUS</th>
            <th className={styles.fill}></th>
          </tr>
        </thead>
        <tbody>
          {consultants.map((c, idx) => {
            // No default — blank status means the user hasn't picked one
            // in the Manage popup yet.
            const status = c.status || '';
            return (
              <tr key={c.id || idx}>
                <td width={260}>{c.name}</td>
                {!hideDepartment && <td width={400}>{c.department}</td>}
                <td width={220}>
                  {Array.isArray(c.assignedCourse) ? (
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {c.assignedCourse.map((course, i) => (
                        <li key={i} style={{ fontSize: 14, lineHeight: '1.3', marginBottom: 4 }}>{course}</li>
                      ))}
                    </ul>
                  ) : (
                    (c.assignedCourse || '')
                  )}
                </td>
                <td width={130}>
                  {status ? (
                    <span style={{ ...statusPillStyle('consultant', status), padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                      {status}
                    </span>
                  ) : (
                    <span style={{ color: '#9CA3AF', fontSize: 12, fontStyle: 'italic' }}>—</span>
                  )}
                </td>
                <td className={styles.fill} style={{ minWidth: 220, paddingRight: 10, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {/* Single neutral action — opens the popup for both
                      status and course assignment in one place. */}
                  {!readOnly && onAssign && (
                    <a
                      href="#"
                      className={styles.actionLink}
                      onClick={(e) => { e.preventDefault(); onAssign(c, idx); }}
                      style={{ color: '#111827', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <User size={15} style={{ marginRight: 6 }} />
                      <span>Manage</span>
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

export default ConsultantsTable
