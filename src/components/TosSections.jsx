import styles from '../styles/SyllabusSections.module.sass'
import {ChevronLeft, ChevronRight, Plus, Search} from 'react-feather';
import { Info } from 'react-feather';
import React, {useState} from "react";
import TextField from "./TextField.jsx";
import TextArea from "./TextArea.jsx";
import Duplicator from "../components/Duplicator.jsx";
import {Link, useParams, useSearchParams} from "react-router-dom";
import { getSyllabusByCode } from "../data/syllabiData.js";
import layout from "../styles/TosSections.module.sass";
import TOSSummary from "../pages/TosSummary.jsx";
import QuestionCognitiveMapping from "../pages/QuestionCognitiveMapping.jsx";

const tosSections = ({status}) => {

    const [searchParams, setSearchParams] = useSearchParams();
    const selectedSection = searchParams.get('section') || 'Outcome Overview';

    const courseOutlines = [
        {
            co: "CO1",
            description: "Design and develop user-centered interfaces that emphasize usability, accessibility, and intuitive interaction. Students will also demonstrate the ability to incorporate feedback from usability testing into iterative design improvements.",
            totalHours: 12,
            totalPercentage: 100,
            totalPoints: 50,
            ilos: [
                { id: "ILO1", description: "Understanding basic HCI principles", hours: 3, percentage: 20, points: 10 },
                { id: "ILO2", description: "Applying user-centered design methods", hours: 3, percentage: 30, points: 20 },
                { id: "ILO3", description: "Evaluating interface usability", hours: 6, percentage: 50, points: 30 },
            ]
        },
        {
            co: "CO2",
            description: "Evaluate interactive systems using HCI methods, identify usability issues, and recommend improvements for better user experience. Students will further be able to communicate evaluation results effectively through structured reports and presentations\n",
            totalHours: 18,
            totalPercentage: 100,
            totalPoints: 40,
            ilos: [
                { id: "ILO1", description: "Analyzing user requirements", hours: 3, percentage: 22, points: 5 },
                { id: "ILO2", description: "Designing interactive prototypes", hours: 3, percentage: 33, points: 15 },
                { id: "ILO3", description: "Implementing accessibility features", hours: 6, percentage: 28, points: 20 }
            ]
        }
    ];

    const [rows, setRows] = useState(courseOutlines);

    const handlePointsChange = (coIndex, iloIndex, value) => {
        setRows(prev => {
            const updated = [...prev];
            updated[coIndex].ilos[iloIndex].points = value === "" ? "" : Number(value);
            return updated;
        });
    };

    const handleTotalPointsChange = (coIndex, value) => {
        setRows(prev => {
            const updated = [...prev];
            updated[coIndex].totalPoints = value === "" ? "" : Number(value);
            return updated;
        });
    };

    const handleSectionChange = (e) => {
        setSearchParams({ section: e.target.value })

    }

    const [questions, setQuestions] = useState([]);  // Lifted state for questions; starts empty

    const { code } = useParams();
    const syllabus = getSyllabusByCode(code);

        return (
            <div className={styles.container}>
                <div className={styles.navi}>
                    <Link to={`/`} className={'actionLink'}>
                        <div className={styles.return}>
                            <ChevronLeft size={22}/>
                        </div>
                    </Link>

                    <div className={styles['section-select']}>
                        <select value={selectedSection} onChange={handleSectionChange}>
                            <option value="Outcome Overview">Outcome Overview</option>
                            <option value="Question/Item-Cognitive Alignment">Question/Item-Cognitive Alignment</option>
                            <option value="TOS Summary">TOS Summary</option>
                        </select>
                    </div>

                    <div className={styles.draft}>Save as Draft</div>

                    <div className={styles.submit}>Submit</div>
                </div>

                <div className={styles['dynamic-sections']}>
                    {selectedSection === 'Outcome Overview' &&
                        <section>
                            <table className={`${layout.table} ${layout.TOSTable}`}>
                                <thead>
                                <tr>
                                    <th>ILOs</th>
                                    <th>DESCRIPTION</th>
                                    <th>NO. OF HOURS</th>
                                    <th>%</th>
                                    <th>NO. OF POINTS</th>
                                </tr>
                                </thead>

                                <tbody>
                                {rows.map((co, coIndex) => (
                                    <>
                                        {/* CO Header Row */}
                                        <tr key={`${co.co}-header`}>
                                            <td>
                                                <div className={`${layout.cellBox} ${layout.blankCell}`}>
                                                    {co.co}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={layout.blankCell}>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={`${layout.cellBox} ${layout.blankCell}`}>
                                                    {co.totalHours}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={`${layout.cellBox} ${layout.blankCell}`}>
                                                    {co.totalPercentage}
                                                </div>
                                            </td>
                                            <td>
                                                <div className={layout.cellBox}>
                                                    <input
                                                        className={`${layout.totalCoPoint} ${layout.input}`}
                                                        type="number"
                                                        value={co.totalPoints}
                                                        onChange={(e) => handleTotalPointsChange(coIndex, e.target.value)}
                                                    />
                                                </div>
                                            </td>
                                        </tr>

                                        {/* ILO Rows */}
                                        {co.ilos.map((ilo, iloIndex) => (
                                            <tr key={`${co.co}-${ilo.id}`}>
                                                <td>
                                                    <div className={`${layout.cellBox} ${layout.mutedBold}`}>
                                                        {ilo.id}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={`${layout.cellBox} ${layout.readable}`}>
                                                        {ilo.description}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={`${layout.cellBox} ${layout.muted}`}>
                                                        {ilo.hours}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={`${layout.cellBox} ${layout.muted}`}>
                                                        {ilo.percentage}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={layout.cellBox}>
                                                        <input
                                                            className={`${layout.point} ${layout.input}`}
                                                            type="number"
                                                            value={ilo.points}
                                                            onChange={(e) => handlePointsChange(coIndex, iloIndex, e.target.value)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}


                                        {coIndex < rows.length - 1 && (
                                            <tr key={`${co.co}-spacer`} style={{height: '16px'}}>
                                            </tr>
                                        )}
                                    </>
                                ))}
                                </tbody>
                            </table>
                        </section>
                    }
                    {selectedSection === 'Question/Item-Cognitive Alignment' &&
                        <section>
                            <QuestionCognitiveMapping outcomeData={rows} questions={questions} setQuestions={setQuestions} />
                        </section>
                    }
                    {selectedSection === 'TOS Summary' &&
                        <section>
                            <TOSSummary outcomeData={rows} questions={questions} />
                        </section>
                    }
                </div>
            </div>
        )
    }

export default tosSections;