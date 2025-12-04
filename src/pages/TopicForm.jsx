import Skeleton from "../layouts/Skeleton.jsx";
import Header from "../components/Header.jsx";
import FormNavigation from "../components/FormNavigation.jsx";
import styles from "../styles/Form.module.sass";
import {useNavigate} from "react-router-dom";
import TextField from "../components/TextField.jsx";
import Dropdown from "../components/Dropdown.jsx";
import {useState} from "react";
import {X} from "react-feather";
import Duplicator from "../components/Duplicator.jsx";
import TextArea from "../components/TextArea.jsx";

const ReferenceForm = ({}) => {
    const navigate = useNavigate()

    const goBackHandler = () => {
        navigate(-1);
    }

    const classPhases = ['Pre-class', 'In-class', 'Post-class']



    const [tlas, setTlas] = useState([
        {id: '1', classPhase: '', performedBy: '', tlaName: '', tlaDescription: ''},
    ]);

    const handleTlaAdd = () => {
        const newTla = {
            id: Date.now() + Math.random(),
            classPhase: '',
            performedBy: '',
            tlaName: '',
            tlaDescription: ''
        };
        setTlas([...tlas, newTla]);
    }
    const handleTlaDelete = (idToDelete) => {
        if (tlas.length === 1) return
        setTlas(tlas.filter((item) => item.id !== idToDelete))
    }

    const [subtopics, setSubtopics] = useState([
        {id: '1', value: ''},
    ]);

    const handleSubtopicAdd = () => {
        const newSubtopic = {id: Date.now() + Math.random(), value: ''};
        setSubtopics([...subtopics, newSubtopic]);
    }
    const handleSubtopicDelete = (idToDelete) => {
        if (subtopics.length === 1) return
        setSubtopics(subtopics.filter((item) => item.id !== idToDelete))
    }

    const [flipped, setFlipped] = useState(false)
    const handleFlipped = (e) => {setFlipped(e.target.checked)}



    return(
        <Skeleton
            header={<Header role={'Instructor'} name={'NORTON, MONICA'} />}
            content={
                <div className={styles.container}>
                    <FormNavigation goBack={goBackHandler} />
                    <div className={styles['form-container']}>
                        <h2>Core Topic</h2>
                        <TextField  />
                        <h2>Subtopic Lists</h2>

                        {subtopics.map((item) => (
                            <div className={styles['list']}>
                                <TextField initialValue={item.value} />
                                <div onClick={() => handleSubtopicDelete(item.id)} className={'x'} > <X size={20} color={'white'}/> </div>
                            </div>
                        ))}
                        <Duplicator onAdd={handleSubtopicAdd} name={'Subtopic'}/>


                        <h2>Teaching & Learning Activities</h2>
                        
                        <div className={'checkbox'}>
                            <input checked={flipped} onClick={handleFlipped} type="checkbox"/> Flipped Approach
                        </div>
                        {tlas.map((item) => (
                            <div className={styles.list}>
                                <div className={styles.tlas}>
                                    <div className={styles.list}>
                                        <Dropdown options={flipped === true ? classPhases : ['Asynchronous', 'Synchronous']} label={'Class Phase'} initialValue={''}/>
                                        <Dropdown options={['Student','Instructor']} label={'Performed By'} initialValue={''}/>
                                    </div>

                                    <TextField label={'TLA Name'} />
                                    <TextArea label={'Text Description'} />
                                    <div className={'checkbox'}>
                                        <input type="checkbox"/> Laboratory
                                    </div>

                                </div>
                                <div onClick={() => handleTlaDelete(item.id)} className={'x'} > <X size={20} color={'white'}/> </div>

                            </div>
                        ))}

                        <Duplicator onAdd={handleTlaAdd}  name={'TLA'}/>

                    </div>


                </div>
            }
        />
    )
}

export default ReferenceForm;