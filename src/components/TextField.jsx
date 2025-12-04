
import styles from '../styles/Fields.module.sass'

const TextField = ({label,disabled,initialValue}) => {
    return (
        <div className={styles.container}>
            <div className={styles.label}>{label}</div>
            <div className={styles.textfield}>
                <input
                    className={`${disabled ? styles['disabled-style'] : ''}`}
                    disabled={disabled}
                    value={initialValue}
                    type="text"
                />
            </div>
        </div>
    )
}

export default TextField;