import {Link} from "react-router-dom";
import {ChevronLeft} from "react-feather";
import React from "react";
import styles from "../styles/FormNavigation.module.sass";

const FormNavigation = ({goBack}) => {

    const goBackHandler = (e) => {goBack()}

    return (
        <div className={styles.navi}>
                <div onClick={goBackHandler} className={styles.return}>
                    <ChevronLeft />
                </div>
            <div className={'fill'}></div>
            <div className={styles.save}>
                Save
            </div>
        </div>
    )
}

export default FormNavigation;