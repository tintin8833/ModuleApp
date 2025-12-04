
import styles from '../styles/Fields.module.sass'

const TextArea = ({label,disabled,rows,initialValue}) => {
    return (
        <div className={styles.container}>
            <div className={styles.label}>{label}</div>
            <div className={styles.textfield}>
                <textarea rows={rows}
                    className={`${disabled ? styles['disabled-style'] : ''}`}
                    disabled={disabled}
                    value={initialValue}
                >
                </textarea>
            </div>
        </div>
    )
}

export default TextArea;