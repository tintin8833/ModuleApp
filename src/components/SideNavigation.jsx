import styles from '../styles/SideNavigation.module.sass'
import unclogo from '../assets/unclogo.png';
import {FileText} from "react-feather";
import {useSearchParams} from "react-router-dom";
import {useState} from "react";
import {LogOut} from "react-feather";

const SideNavigation = () => {

    const [searchParams, setSearchParams] = useSearchParams();
    const selected = searchParams.get('page') || 'Syllabus';

    const handlePageChange = (page) => {
        setSearchParams({ page: page })
        console.log(selected)
    }

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
                <div className={styles.listB}>
                    <LogOut size={24} color={'#F94545'}/> Log Out
                </div>
            </div>
        </div>
    )
}

export default SideNavigation