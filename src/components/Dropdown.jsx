
import styles from '../styles/Dropdown.module.sass'

const Dropdown = ({label,disabled,initialValue, options}) => {
    return (
        <div className={styles.container}>
            <div className={styles.label}>{label}</div>
            <div className={styles.dropdown}>

                <select
                    className={`${disabled ? styles['disabled-style'] : ''}`}
                    value={initialValue}
                    disabled={disabled}>
                    <option selected value=""></option>

                    {options.map((option,index) => (
                        <option id={index} value={option}>
                            {option}
                        </option>
                    ))}


                </select>
            </div>
        </div>
    )
}

export default Dropdown;