import styles from '../styles/SideNavigation.module.sass'
import unclogo from '../assets/unclogo.png'
import { FileText, LogOut, Users, BookOpen, Calendar, Grid } from 'react-feather'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../services/auth.jsx'
import ConfirmModal from './ConfirmModal.jsx'

const SideNavigation = ({ mode = 'instructor' }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams, setSearchParams] = useSearchParams()
    const { logout } = useAuth()

    // --- MERGED SELECTION LOGIC ---
    let defaultPage = 'Syllabus';
    if (mode === 'ovpaa') defaultPage = 'Dashboard';
    if (mode === 'admin') defaultPage = 'Accounts';
    let selected = searchParams.get('page') || defaultPage;
    if (mode === 'admin') selected = 'Accounts';

    if (location.pathname.startsWith('/assignedtos') || location.pathname.startsWith('/tos')) {
        selected = 'TOS';
    }

    const [showPopup, setShowPopup] = useState(false)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const logoutRef = useRef(null)
    const navRef = useRef(null)
    const [pinned, setPinned] = useState(false)

    const handlePageChange = (page) => {
        if (page === 'Syllabus') {
            if (mode === 'program-head') navigate('/role/program-head/approval-course-table?page=Syllabus');
            else if (mode === 'dean') navigate('/role/dean?page=Syllabus');
            else navigate('/');
        }
        else if (page === 'TOS') {
            navigate('/assignedtos');
        }
        else {
            setSearchParams({ page });
        }
    }

    const onLogoutClick = () => setShowLogoutConfirm(true)
    const confirmLogout = () => { setShowLogoutConfirm(false); logout(); navigate('/login'); }

    const gotoRole = (path) => {
        setShowPopup(false)
        navigate(path)
    }

    // --- POPUP & RESIZE LOGIC ---
    useEffect(() => {
        const handler = (e) => {
            if (!showPopup) return
            if (logoutRef.current && !logoutRef.current.contains(e.target)) setShowPopup(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showPopup])

    useEffect(() => {
        if (showPopup) setShowPopup(false)
    }, [selected])

    useEffect(() => {
        if (!navRef.current) return
        let ro
        try {
            ro = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const w = entry.contentRect.width
                    setIsExpanded(w > 120)
                    if (w < 100 && showPopup) {
                        setShowPopup(false)
                    }
                }
            })
            ro.observe(navRef.current)
        } catch (e) {}
        return () => { if (ro && navRef.current) ro.disconnect() }
    }, [showPopup])

    useEffect(() => {
        const el = navRef.current
        if (!el) return
        const findSidebarAncestor = (node) => {
            let n = node.parentElement
            while (n && n !== document.body) {
                try {
                    const w = window.getComputedStyle(n).width
                    const num = parseFloat(w)
                    if (!isNaN(num) && num <= 110) return n
                } catch (e) {}
                n = n.parentElement
            }
            return null
        }
        const target = findSidebarAncestor(el) || el.parentElement
        const enter = () => { if (target && !pinned) { target.classList.add('expanded'); target.classList.add('expanded-left') } }
        const leave = () => { if (target && !pinned) { target.classList.remove('expanded'); target.classList.remove('expanded-left') } }
        el.addEventListener('mouseenter', enter)
        el.addEventListener('mouseleave', leave)
        return () => {
            el.removeEventListener('mouseenter', enter)
            el.removeEventListener('mouseleave', leave)
            if (target) { target.classList.remove('expanded'); target.classList.remove('expanded-left') }
        }
    }, [pinned])

    return (
        <div ref={navRef} className={styles.container}>
            <div className={styles.logo}>
                <img src={unclogo} alt="University Of Nueva Caceres Logo" onClick={() => {
                    setPinned(p => !p)
                    const target = navRef.current ? navRef.current.parentElement : null
                    if (target) { target.classList.toggle('expanded'); target.classList.toggle('expanded-left') }
                }} style={{ cursor: 'pointer' }} />
            </div>

            {/* Dynamic Title with 3-line format */}
            <div className={styles.lpms}>
                {isExpanded ? (
                    <>
                        Learning Plan<br />
                        Management System
                    </>
                ) : (
                    "LPMS"
                )}
            </div>

            <div className={styles['nav-list']}>
                {(mode === 'instructor' || mode === 'director-of-libraries' || mode === 'industry-consultant') && (
                    <div
                        onClick={() => handlePageChange('Syllabus')}
                        className={`${styles.list} ${selected === 'Syllabus' ? styles.selected : ''}`}
                    >
                        <FileText size={24} />
                        <span className={styles.listText}>Learning Plan</span>
                    </div>
                )}

                {mode === 'admin' && (
                    <div
                        onClick={() => navigate('/admin')}
                        className={`${styles.list} ${selected === 'Accounts' ? styles.selected : ''}`}
                    >
                        <Users size={24} />
                        <span className={styles.listText}>Accounts</span>
                    </div>
                )}

                {mode === 'instructor' && (
                    <div
                        onClick={() => handlePageChange('TOS')}
                        className={`${styles.list} ${selected === 'TOS' ? styles.selected : ''}`}
                    >
                        <FileText size={24} />
                        <span className={styles.listText}>TOS</span>
                    </div>
                )}

                {mode === 'program-head' && (
                    <>
                        <div onClick={() => { navigate('/role/program-head/industry-consultant?page=Industry%20Consultant') }} className={`${styles.list} ${selected === 'Industry Consultant' ? styles.selected : ''}`}>
                            <Users size={24} /> <span className={styles.listText}>Industry Consultant</span>
                        </div>

                        <div onClick={() => { navigate('/role/program-head/course-offerings?page=Course%20Offerings') }} className={`${styles.list} ${selected === 'Course Offerings' ? styles.selected : ''}`}>
                            <BookOpen size={24} /> <span className={styles.listText}>Course Offerings</span>
                        </div>

                        <div onClick={() => { navigate('/role/program-head/course-assignment?page=Course%20Assignment') }} className={`${styles.list} ${selected === 'Course Assignment' ? styles.selected : ''}`}>
                            <BookOpen size={24} /> <span className={styles.listText}>Course Assignment</span>
                        </div>
                    </>
                )}

                {mode === 'dean' && (
                    <>
                        <div onClick={() => { navigate('/role/dean?page=Faculty') }} className={`${styles.list} ${selected === 'Faculty' ? styles.selected : ''}`}>
                            <Users size={24} /> <span className={styles.listText}>Faculty</span>
                        </div>

                        <div onClick={() => { navigate('/role/dean?page=Programs') }} className={`${styles.list} ${selected === 'Programs' ? styles.selected : ''}`}>
                            <BookOpen size={24} /> <span className={styles.listText}>Programs</span>
                        </div>
                    </>
                )}

                {(mode === 'ovpaa' || mode === 'hr-staff') && (
                    <>
                        <div onClick={() => { navigate('/role/ovpaa?page=Dashboard') }} className={`${styles.list} ${selected === 'Dashboard' ? styles.selected : ''}`}>
                            <Calendar size={24} /> <span className={styles.listText}>Academic Terms</span>
                        </div>

                        <div onClick={() => { navigate('/role/ovpaa?page=Department%20List') }} className={`${styles.list} ${selected === 'Department List' ? styles.selected : ''}`}>
                            <Grid size={24} /> <span className={styles.listText}>Departments</span>
                        </div>

                        {mode === 'ovpaa' && (
                            <>
                                <div onClick={() => { navigate('/role/ovpaa?page=TOS') }} className={`${styles.list} ${selected === 'TOS' ? styles.selected : ''}`}>
                                    <FileText size={24} /> <span className={styles.listText}>TOS</span>
                                </div>

                                <div onClick={() => { navigate('/role/ovpaa?page=Syllabus') }} className={`${styles.list} ${selected === 'Syllabus' ? styles.selected : ''}`}>
                                    <FileText size={24} /> <span className={styles.listText}>Learning Plan</span>
                                </div>
                            </>
                        )}
                    </>
                )}

                <div className={styles.logoutWrapper} ref={logoutRef}>
                    <div className={styles.listB} onClick={onLogoutClick}>
                        <LogOut size={24} color={'#F94545'} /> <span className={styles.listText}>Log Out</span>
                    </div>
                </div>

                <ConfirmModal
                    open={showLogoutConfirm}
                    title="Log out?"
                    message="You will be signed out and returned to the login page."
                    confirmLabel="Log Out"
                    cancelLabel="Cancel"
                    tone="destructive"
                    onConfirm={confirmLogout}
                    onCancel={() => setShowLogoutConfirm(false)}
                />
            </div>
        </div>
    )
}

export default SideNavigation