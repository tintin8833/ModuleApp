
import styles from '../styles/Dropdown.module.sass'

// Props:
// - label: string shown as label
// - disabled: boolean
// - initialValue: selected value (controlled)
// - options: array of strings
// - inline: render label beside the select in one line (compact)
// - onChange: callback when selection changes
const Dropdown = ({ label, disabled, initialValue, options, inline = false, onChange }) => {
    const handleChange = (e) => {
        if (onChange) onChange(e.target.value)
    }

    if (inline) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className={styles.label} style={{ fontWeight: 600 }}>{label}</div>
                <div className={styles.dropdown} style={{ minWidth: 260, height: 44 }}>
                    <select
                        className={`${disabled ? styles['disabled-style'] : ''}`}
                        value={initialValue}
                        disabled={disabled}
                        onChange={handleChange}
                    >
                        <option value=""></option>
                        {options.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                        ))}
                    </select>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.label}>{label}</div>
            <div className={styles.dropdown}>
                <select
                    className={`${disabled ? styles['disabled-style'] : ''}`}
                    value={initialValue}
                    disabled={disabled}
                    onChange={handleChange}
                >
                    <option value=""></option>
                    {options.map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                    ))}
                </select>
            </div>
        </div>
    )
}

export default Dropdown;