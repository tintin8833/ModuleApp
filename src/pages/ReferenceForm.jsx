import Skeleton from "../layouts/Skeleton.jsx";
import Header from "../components/Header.jsx";
import FormNavigation from "../components/FormNavigation.jsx";
import styles from "../styles/Form.module.sass";
import {useNavigate} from "react-router-dom";
import TextField from "../components/TextField.jsx";
import Dropdown from "../components/Dropdown.jsx";
import SideNavigation from "../components/SideNavigation.jsx";

const ReferenceForm = ({}) => {
    const navigate = useNavigate()

    const goBackHandler = () => {
        navigate(-1);
    }

    const ReferenceTypes = ['Textbook', 'Online Resources', 'Open Educational Resources']

    return(
        <Skeleton
            header={<Header role={'Instructor'} name={'NORTON, MONICA'} />}
            nav={<SideNavigation/> }
            content={
                <div className={styles.container}>
                    <FormNavigation goBack={goBackHandler} />
                    <div className={styles['form-container']}>
                            <h2>Reference Details</h2>
                        <Dropdown options={ReferenceTypes} label={'Reference Type'}  />
                        <TextField label={'Reference Title'} />
                        <TextField label={'Author(s)'} />
                        <TextField label={'Publication Year'}  />
                    </div>
                </div>
            }
        />
    )
}

export default ReferenceForm;