
import styles from '../styles/SyllabusSections.module.sass'
import { ChevronLeft } from 'react-feather';
import {useState} from "react";
import TextField from "./TextField.jsx";
import TextArea from "./TextArea.jsx";
const syllabusSections = ({status}) => {

    const [selectedSection, setSelectedSection] = useState('Course Details')

    const handleSectionChange = (e) => {
        setSelectedSection(e.target.value)

    }
    return(
        <div className={styles.container}>
            <div className={styles.navi}>
                <div className={styles.return}>
                    <ChevronLeft size={18}/>
                    Return
                </div>

                <div className={styles['section-select']}>
                    <select value={selectedSection} onChange={handleSectionChange}>
                        <option value="Course Details">Course Details</option>
                        <option value="Course and Program Outcome Alignment">Course and Program Outcome Alignment</option>
                        <option value="References">References</option>
                        <option value="Topics">Topics</option>
                        <option value="Teaching & Learning Activities">Teaching & Learning Activities</option>
                        <option value="Course Coverage">Course Coverage</option>
                        <option value="Assessments">Assessments</option>
                        <option value="Criteria for Grading">Criteria for Grading</option>
                    </select>
                </div>

                <div className={styles.draft}>Save as Draft</div>

                <div className={styles.submit}>Submit</div>
            </div>

            <div className={styles['dynamic-sections']}>

                {selectedSection === 'Course Details' &&
                    <section>
                        {/*<div className={styles.header}>*/}
                        {/*    <h2>Course Details</h2>*/}
                        {/*</div>*/}

                        <div className={styles.form}>
                            <TextField
                                initailValue={'Human & Computer Interaction'}
                                disabled={true}
                                label="Course Name"
                            />
                            <div className={styles['double-field']}>
                                <div className={styles.colA}>
                                    <TextField
                                        initailValue={'BSCS313L'}
                                        disabled={true}
                                        label="Course Number"
                                    />
                                    <TextField
                                        initailValue={'3'}
                                        disabled={true}
                                        label="Contact Hours"
                                    />
                                    <TextField
                                        initailValue={'BSCS313L'}
                                        disabled={true}
                                        label="Course Number"
                                    />
                                    <TextField
                                        initailValue={'THIRD YEAR'}
                                        disabled={true}
                                        label="Year Level"
                                    />

                                </div>
                                <div className={styles.colB}>
                                    <TextField
                                        initailValue={'2 LEC, 1 LAB'}
                                        disabled={true}
                                        label="Credits"
                                    />
                                    <TextField
                                        initailValue={'Professional Courses'}
                                        disabled={true}
                                        label="Classification/Field"
                                    />
                                    <TextField
                                        initailValue={'25 S, 2015'}
                                        disabled={true}
                                        label="CMO"
                                    />
                                    <TextField
                                        initailValue={'1st Semester'}
                                        disabled={true}
                                        label="Term"
                                    />
                                </div>
                            </div>
                            <TextField
                                initailValue={'Human & Computer Interaction'}
                                disabled={true}
                                label="Course Name"
                            />
                            <TextArea
                                initailValue={'This course explores the principles and practices of Human-Computer Interaction (HCI), focusing on how people engage with digital systems and how to design technology that enhances user experience.\n' +
                                    '\n' +
                                    'Students will examine user-centered design methodologies, usability principles, interaction design processes, and evaluation techniques. The course also emphasizes the integration of emerging technologies for software product design (UI/UX), equipping students with insights into modern tools and trends that shape interactive systems.\n' +
                                    '\n' +
                                    'Through lectures, hands-on projects, and usability testing, learners will develop practical skills in designing intuitive and user-friendly interfaces that address real human needs. Drawing from foundational theories in psychology, design, and computer science, this course prepares students to create digital products that are both functional and forward-thinking, aligning with current and future developments\n' +
                                    'in UI/UX design.\n' +
                                    '\n'}
                                disabled={false}
                                label="Course Name"
                                rows={10}
                            />
                        </div>

                    </section>
                }

            </div>
        </div>
    )
}

export default syllabusSections;