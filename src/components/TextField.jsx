
import styles from '../styles/Fields.module.sass'

const TextField = ({label,disabled,initailValue}) => {
    return (
        <div className={styles.container}>
            <div className={styles.label}>{label}</div>
            <div className={styles.textfield}>
                <input
                    className={`${disabled ? styles['disabled-style'] : ''}`}
                    disabled={disabled}
                    value={initailValue}
                    type="text"
                />
            </div>
        </div>
    )
}

export default TextField;