import styles from '../styles/SideNavigation.module.sass'
import unclogo from '../assets/unclogo.png';
import { FileText, LogOut } from 'react-feather'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

const SideNavigation = () => {

    const [searchParams, setSearchParams] = useSearchParams()
    const selected = searchParams.get('page') || 'Syllabus'
    const navigate = useNavigate()

    const [showPopup, setShowPopup] = useState(false)
    const logoutRef = useRef(null)

    const handlePageChange = (page) => {
        setSearchParams({ page })
    }

    const onLogoutClick = () => setShowPopup((prev) => !prev)

    const gotoRole = (path) => {
        setShowPopup(false)
        navigate(path)
    }

    useEffect(() => {
        const handler = (e) => {
            if (!showPopup) return
            if (logoutRef.current && !logoutRef.current.contains(e.target)) setShowPopup(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showPopup])

    return(
        <div className={styles.container}>
            <div className={styles.logo}>
                <img src={unclogo} alt=""/>
            </div>
            <div className={styles['nav-list']}>
                <div onClick={() => handlePageChange('Syllabus')} className={`${styles.list} ${selected === 'Syllabus' ? styles.selected: ''}`}>
                    <FileText size={24}/> Syllabus
                </div>
                <div onClick={() => handlePageChange('TOS')}  className={`${styles.list} ${selected === 'TOS' ? styles.selected: ''}`}>
                    <FileText size={24}/> TOS
                </div>
                <div className={styles.logoutWrapper} ref={logoutRef}>
                    <div className={styles.listB} onClick={onLogoutClick}>
                        <LogOut size={24} color={'#F94545'}/> Log Out
                    </div>
                    {showPopup && (
                        <div className={styles.rolePopup}>
                            <div className={styles.popupTitle}>Select role</div>
                            <button className={styles.popupItem} onClick={() => gotoRole('/role/instructor')}>Instructor</button>
                            <button className={styles.popupItem} onClick={() => gotoRole('/role/program-head')}>Program head</button>
                            <button className={styles.popupItem} onClick={() => gotoRole('/role/dean')}>Dean</button>
                            <button className={styles.popupItem} onClick={() => gotoRole('/role/hr-staff')}>HR staff</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SideNavigation