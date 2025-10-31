import React from 'react';
import styles from '../styles/CoursesTable.module.sass';
import { ChevronRight } from 'react-feather';
const CoursesTable = ({}) => {

    const currentYear = new Date().getFullYear();
    const startYear = 2000;
    const semOptions = ['1st Sem', '2nd Sem'];

    const yearOptions = [];
    for (let i = currentYear; i >= startYear; i--) {
        yearOptions.push(<option key={i} value={i}>{i}</option>);
    }

    const tableHeaders = [
        { key: 'code', label: 'CODE' },
        { key: 'course-name', label: 'COURSE NAME' },
        { key: 'update', label: 'LAST UPDATED' },
        { key: 'status', label: 'STATUS' },
        { key: 'fill', label: '' },
    ];

    const tableBodyData = [
        { code: 'BSCS313L', name: 'Human & Computer Interaction', update: 'Aug 01, 2025', status: 'DRAFT', action: 'Compose' },
        { code: 'BSCS212L', name: 'Web Development I', update: 'Sept 15, 2025', status: 'DRAFT', action: 'Compose' },
        { code: 'BSCS111L', name: 'Fundamentals of Programming', update: 'Aug 05, 2025', status: 'DRAFT', action: 'Compose' },
        // Add more rows here...
    ];


    return (
        <div className={styles['courses-table']}>

            <div className={styles.header}>
                <h2>ASSIGNED COURSES</h2>
                <div className={styles.filterA}>
                    <select>
                        {yearOptions}
                    </select>
                    <select>
                        {semOptions.map(sem => (
                            <option key={sem} value={sem}>{sem}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles['table-container']}>
                <table>
                    <thead>
                    <tr>
                        {tableHeaders.map(header => (
                            <th key={header.key} className={styles[header.key]}>{header.label}</th>
                        ))}
                    </tr>
                    </thead>

                    <tbody>
                    {tableBodyData.map((row, index) => (
                        <tr key={index}>
                            <td className={styles.code}>{row.code}</td>
                            <td className={styles['course-name']}>{row.name}</td>
                            <td className={styles.update}>{row.update}</td>
                            <td className={styles.status}>{row.status}</td>
                            <td className={styles.fill}>
                                {row.action}
                                <ChevronRight size={18} />
                            </td>
                        </tr>
                    ))}
                    </tbody>

                </table>
            </div>

        </div>
    );
};

export default CoursesTable;