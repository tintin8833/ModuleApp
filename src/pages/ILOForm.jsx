import Skeleton from "../layouts/Skeleton.jsx";
import Header from "../components/Header.jsx";
import FormNavigation from "../components/FormNavigation.jsx";
import styles from "../styles/Form.module.sass";
import {useNavigate, useParams} from "react-router-dom"; // Added useParams
import TextField from "../components/TextField.jsx";
import Dropdown from "../components/Dropdown.jsx";
import TextArea from "../components/TextArea.jsx";
import MultiSelect from "../components/MultiSelect.jsx";
import SideNavigation from "../components/SideNavigation.jsx";
import { getSyllabusByCode } from "../data/syllabiData"; // Import your data function

const ILOForm = ({}) => {
    const navigate = useNavigate()
    const { code, iloId } = useParams();

    const goBackHandler = () => {
        navigate(-1);
    }

    // 1. Get the specific Syllabus and ILO Data
    const syllabus = getSyllabusByCode(code);
    console.log(syllabus)
    const iloData = syllabus?.ilos.find(i => i.id === iloId) || {};
    console.log(iloData)

    const weeks = () => Array.from({ length: 10 }, (_, i) => `Week ${i + 1}`);

    const availableTopics = syllabus?.topics
        ? syllabus.topics.map(t => t.title)
        : [];

    const availableReferences = syllabus?.references
        ? syllabus.references.map(r => `${r.id} - ${r.title}`)
        : [];

    return(
        <Skeleton
            header={<Header role={'Instructor'} name={'NORTON, MONICA'} />}
            nav={<SideNavigation/> }
            content={
                <div className={styles.container}>
                    <FormNavigation goBack={goBackHandler} />
                    <div className={styles['form-container']}>
                        <h2>ILO & Course Outcome Alignment</h2>
                        <TextArea
                            disabled={true}
                            label={'Course Outcome'}
                            initialValue={iloData.courseOutcome}
                        />
                        <TextArea
                            label={'Intended Learning Outcome'}
                            initialValue={iloData.intendedLearningOutcome}
                        />
                        <div className={styles.list}>
                            <Dropdown
                                label={'Delivery Week'}
                                options={weeks()}
                                initialValue={iloData.deliveryWeek}
                            />
                            <Dropdown
                                label={'Allocated Time'}
                                options={['1 hour', '1.5 hour','2 hours']}
                                initialValue={iloData.allocatedTime}
                            />
                        </div>

                        <h2>Topics</h2>
                        {/* 4. Pass the dynamic options and the saved values */}
                        <MultiSelect
                            label={'Name(s)'}
                            options={availableTopics}
                            initialValue={iloData.topics || []}
                        />

                        <h2>References</h2>
                        {/* 5. Pass the dynamic options and the saved values */}
                        <MultiSelect
                            label={'Title(s)'}
                            options={availableReferences}
                            initialValue={iloData.references || []}
                        />

                    </div>
                </div>
            }
        />
    )
}

export default ILOForm;