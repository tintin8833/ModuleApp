import styles from '../styles/SkeletonA.module.sass'

const SkeletonA = ({ nav, header, content }) => {
    // The Floating Archive button is no longer mounted here. Each
    // module page renders its own <FloatingArchiveButton moduleType=…>
    // so the archive is strictly page-scoped (1 page = 1 archive).
    return(
        <div className={styles['main-layout']}>
            <div  className={styles.left}>
                {nav}
            </div>
            <div className={styles.right}>
                <div className={styles.up}>
                    {header}
                </div>
                <div className={styles.down}>
                    {content}
                </div>
            </div>
        </div>
    )
}

export default SkeletonA;