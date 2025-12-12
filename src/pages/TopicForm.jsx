import Skeleton from "../layouts/Skeleton.jsx";
import Header from "../components/Header.jsx";
import FormNavigation from "../components/FormNavigation.jsx";
import styles from "../styles/Form.module.sass";
import {useNavigate, useParams} from "react-router-dom";
import TextField from "../components/TextField.jsx";
import Dropdown from "../components/Dropdown.jsx";
import {useState} from "react";
import {X} from "react-feather";
import Duplicator from "../components/Duplicator.jsx";
import TextArea from "../components/TextArea.jsx";
import SideNavigation from "../components/SideNavigation.jsx";
import {getSyllabusByCode} from "../data/syllabiData.js";

const TopicForm = ({}) => {
    const navigate = useNavigate()

    const goBackHandler = () => {
        navigate(-1);
    }

    const classPhases = ['Pre-class', 'In-class', 'Post-class']



    const { code, topicId } = useParams();
    const syllabus = getSyllabusByCode(code);
    const topicData = syllabus?.topics.find(t => t.id === topicId) || {};

    const [subtopics, setSubtopics] = useState(
        topicData.subtopics || [{id: '1', value: ''}]
    );

    const [tlas, setTlas] = useState(
        topicData.tlas || [{id: '1', classPhase: '', performedBy: '', tlaName: '', tlaDescription: ''}]
    );

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
            nav={<SideNavigation/> }
            content={
                <div className={styles.container}>
                    <FormNavigation goBack={goBackHandler} />
                    <div className={styles['form-container']}>
                        <h2>Core Topic</h2>
                        <TextField initialValue={topicData.title || ''} />
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
                            <div className={styles.list} key={item.id}>
                                <div className={styles.tlas}>
                                    <div className={styles.list}>
                                        <Dropdown
                                            options={classPhases}
                                            // options={flipped === true ? classPhases : ['Asynchronous', 'Synchronous']}
                                            label={'Class Phase'}
                                            initialValue={item.classPhase} // Bind data
                                        />
                                        <Dropdown
                                            options={['Student','Instructor']}
                                            label={'Performed By'}
                                            initialValue={item.performedBy} // Bind data
                                        />
                                    </div>
                                    <TextField
                                        label={'TLA Name'}
                                        initialValue={item.tlaName} // Bind data
                                    />
                                    <TextArea
                                        label={'Text Description'}
                                        initialValue={item.tlaDescription} // Bind data
                                    />
                                    <div className={'checkbox'}>
                                        <input type="checkbox"/> Laboratory
                                    </div>                                </div>
                                <div onClick={() => handleTlaDelete(item.id)} className={'x'}>
                                    <X size={20} color={'white'}/>
                                </div>
                            </div>
                        ))}


                        <Duplicator onAdd={handleTlaAdd}  name={'TLA'}/>

                    </div>


                </div>
            }
        />
    )
}

export default TopicForm;