import styles from '../styles/MultiSelect.module.sass'

const MultiSelect = ({label, disabled, initialValue = [], options = []}) => {
    return (
        <div className={styles.container}>
            <div className={styles.label}>{label}</div>
            <div className={styles.dropdown}>

                {options.map((option, index) => {
                    const isChecked = initialValue.includes(option);

                    return (
                        <div key={index} className={styles.option}>
                            <input
                                type="checkbox"
                                defaultChecked={isChecked}
                                disabled={disabled}
                            />
                            {option}
                        </div>
                    );
                })}

            </div>
        </div>
    )
}

export default MultiSelect;