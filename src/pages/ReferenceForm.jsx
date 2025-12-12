import Skeleton from "../layouts/Skeleton.jsx";
import Header from "../components/Header.jsx";
import FormNavigation from "../components/FormNavigation.jsx";
import styles from "../styles/Form.module.sass";
import {useNavigate, useParams} from "react-router-dom";
import TextField from "../components/TextField.jsx";
import Dropdown from "../components/Dropdown.jsx";
import SideNavigation from "../components/SideNavigation.jsx";
import {getSyllabusByCode} from "../data/syllabiData.js";

const ReferenceForm = ({}) => {
    const navigate = useNavigate()

    const goBackHandler = () => {
        navigate(-1);
    }

    const ReferenceTypes = ['Textbook', 'Online Resources', 'Open Educational Resources']

    const { code, refId } = useParams();

    const syllabus = getSyllabusByCode(code);
    // Find the specific reference, or default to empty object if creating new
    const referenceData = syllabus?.references.find(r => r.id === refId) || {};

    return(
        <Skeleton
            header={<Header role={'Instructor'} name={'NORTON, MONICA'} />}
            nav={<SideNavigation/> }
            content={
                <div className={styles.container}>
                    <FormNavigation goBack={goBackHandler} />
                    <div className={styles['form-container']}>
                        <h2>Reference Details</h2>
                        <Dropdown
                            options={ReferenceTypes}
                            label={'Reference Type'}
                            initialValue={referenceData.type || ''}
                        />
                        <TextField
                            label={'Reference Title'}
                            initialValue={referenceData.title || ''}
                        />
                        <TextField
                            label={'Author(s)'}
                            initialValue={referenceData.authors || ''}
                        />
                        <TextField
                            label={'Publication Year'}
                            initialValue={referenceData.year ? referenceData.year.toString() : ''}
                        />
                    </div>
                </div>
            }
        />
    )
}

export default ReferenceForm;