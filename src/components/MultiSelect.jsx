
import styles from '../styles/MultiSelect.module.sass'

const MultiSelect = ({label,disabled,initialValue, options}) => {
    return (
        <div className={styles.container}>
            <div className={styles.label}>{label}</div>
            <div className={styles.dropdown}>

                {options.map((option, index) => (
                    <div className={styles.option}>
                        <input type="checkbox"/>
                        {option}
                    </div>
                ))}


            </div>
        </div>
    )
}

export default MultiSelect;