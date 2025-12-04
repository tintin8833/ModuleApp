import Skeleton from "../layouts/Skeleton.jsx";
import Header from "../components/Header.jsx";
import FormNavigation from "../components/FormNavigation.jsx";
import styles from "../styles/Form.module.sass";
import {useNavigate} from "react-router-dom";
import TextField from "../components/TextField.jsx";
import Dropdown from "../components/Dropdown.jsx";
import TextArea from "../components/TextArea.jsx";
import MultiSelect from "../components/MultiSelect.jsx";

const ILOForm = ({}) => {
    const navigate = useNavigate()

    const goBackHandler = () => {
        navigate(-1);
    }
    const co1 =
        'Apply core concepts, theories, and principles of Human-Computer Interface (HCI) in proposing a User Interface (UI) design using Figma to translate a design brief into interactive screen layouts and UI components with a high-fidelity prototype demonstrating clarity, consistency, and appropriate use of visual hierarchy.'

    const weeks = () => Array.from({ length: 10 }, (_, i) => `Week ${i + 1}`);
    const titles = [
        "HCI Models",
        "Introduction to HCI",
        "User Centered Design",
        "Front End Prototyping"
    ];
    const topics = [
        "OR1 - UI PRINCIPLES",
        "OR2 - Design Guidelines",
        "OR3 - Imagery",
        "OE1 - UI PRINCIPLES",
        "OE2 - Introduction to Generative AI"
    ];



    return(
        <Skeleton
            header={<Header role={'Instructor'} name={'NORTON, MONICA'} />}
            content={
                <div className={styles.container}>
                    <FormNavigation goBack={goBackHandler} />
                    <div className={styles['form-container']}>
                        <h2>ILO & Course Outcome Alignment</h2>
                        <TextArea disabled={true} label={'Course Outcome'} initialValue={co1}  />
                        <TextArea label={'Intended Learning Outcome'} />
                        <div className={styles.list}>
                            <Dropdown label={'Delivery Week'} options={weeks()}/>
                            <Dropdown label={'Allocated Time'} options={['1 hour', '1.5 hour','2 hours']}/>
                        </div>

                        <h2>Topics</h2>
                        <MultiSelect label={'Name(s)'} options={titles} />

                        <h2>References</h2>
                        <MultiSelect label={'Title(s)'}  options={topics} />


                    </div>
                </div>
            }
        />
    )
}

export default ILOForm;