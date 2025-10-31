
import styles from '../styles/Fields.module.sass'

const TextArea = ({label,disabled,rows,initailValue}) => {
    return (
        <div className={styles.container}>
            <div className={styles.label}>{label}</div>
            <div className={styles.textfield}>
                <textarea rows={rows}
                    className={`${disabled ? styles['disabled-style'] : ''}`}
                    disabled={disabled}
                    value={initailValue}
                >
                </textarea>
            </div>
        </div>
    )
}

export default TextArea;