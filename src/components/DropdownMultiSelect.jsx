import { useState, useRef, useEffect } from "react";
import styles from "../styles/CriteriaForGradingForm.module.sass";

const DropdownMultiSelect = ({ options = [], initialValue = [], onChange }) => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(initialValue);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOption = (option) => {
        const updated = selected.includes(option)
            ? selected.filter(o => o !== option)
            : [...selected, option];

        setSelected(updated);
        onChange?.(updated);
    };

    return (
        <div className={styles.multiSelect} ref={ref}>
            <div
                className={styles.dropdown}
                onClick={() => setOpen(!open)}
            >
                {selected.length ? selected.join(", ") : "Select assessments"}
            </div>

            {open && (
                <div className={styles.dropdownMenu}>
                    {options.map(opt => (
                        <label
                            key={opt}
                            className={styles.option}
                            onClick={(e) => {
                                e.preventDefault();
                                toggleOption(opt);
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(opt)}
                                readOnly             // prevents React warnings
                            />
                            {opt}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DropdownMultiSelect;
