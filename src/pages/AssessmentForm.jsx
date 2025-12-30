import SkeletonA from "../layouts/SkeletonA.jsx";
import HeaderA from "../components/HeaderA.jsx";
import FormNavigation from "../components/FormNavigation.jsx";
import styles from "../styles/Form.module.sass";
import {useNavigate, useParams} from "react-router-dom";
import TextField from "../components/TextField.jsx";
import TextArea from "../components/TextArea.jsx";
import SideNavigation from "../components/SideNavigation.jsx";
import {useEffect, useState} from "react";
import {X} from "react-feather";
import Duplicator from "../components/Duplicator.jsx";
import {getSyllabusByCode} from "../data/syllabiData.js";
import { useRef } from "react";
import { ChevronDown } from 'react-feather'


const AssessmentForm = () => {
    const navigate = useNavigate();
    const goBackHandler = () => navigate(-1);

    const { code, assessmentId } = useParams();
    const syllabus = getSyllabusByCode(code);
    const assessmentData = syllabus?.assessments.find(a => a.id === assessmentId) || {};

    const [method, setMethod] = useState(assessmentData.assessmentMethod || '');
    const [description, setDescription] = useState(assessmentData.assessmentDescription || '');
    const [rubric, setRubric] = useState(assessmentData.hasRubric || false);

    const createEmptyRubricRows = (count = 3) =>
        Array.from({ length: count }, () => ({
            id: Date.now() + Math.random(),
            criteria: '',
            maxScore: ''
        }))

    const [rubricRows, setRubricRows] = useState(
        assessmentData.rubrics && assessmentData.rubrics.length > 0
            ? assessmentData.rubrics
            : createEmptyRubricRows(3)
    );

    const handleRubricAdd = () => {
        const newRow = { id: Date.now() + Math.random(), criteria: '', maxScore: '', weight: '' };
        setRubricRows([...rubricRows, newRow]);
    };

    const handleRubricDelete = (id) => {
        if (rubricRows.length === 1) return;
        setRubricRows(rubricRows.filter(row => row.id !== id));
    };

    const handleRubricChange = (id, field, value) => {
        let updated = rubricRows.map(r =>
            r.id === id ? { ...r, [field]: value } : r
        )

        const total = updated.reduce((sum, r) => sum + Number(r.maxScore || 0), 0)

        if (total > 0) {
            updated = updated.map(r => {
                const raw = (Number(r.maxScore || 0) / total) * 100
                return {
                    ...r,
                    weight: formatPercent(raw)
                }
            })
        }

        setRubricRows(updated)
    }

    const assessmentOptions = [
        "Observation Report",
        "Interview Synthesis",
        "Research Plan Document",
        "Persona Creation",
        "Information Architecture Map",
        "Evaluation Report",
        "High-Fidelity Prototype",
        "Usability Test Log"
    ];

    const dropdownRef = useRef(null);

    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!dropdownRef.current) return;

            if (!dropdownRef.current.contains(e.target)) {
                setShowOptions(false);
            }
        };

        document.addEventListener("pointerdown", handleClickOutside);
        return () => document.removeEventListener("pointerdown", handleClickOutside);
    }, []);

    const allScoresFilled = rubricRows.every(
        r => r.maxScore !== "" && Number(r.maxScore) > 0
    )

    const formatPercent = (num) => {
        if (!isFinite(num)) return ""
        return Number.isInteger(num) ? num : Number(num.toFixed(2))
    }

    const totalMaxScore = rubricRows.reduce(
        (sum, r) => sum + Number(r.maxScore || 0),
        0
    )

    const getWeight = score => {
        if (!allScoresFilled) return ""
        if (!totalMaxScore) return ""

        const raw = (Number(score) / totalMaxScore) * 100
        return Number.isInteger(raw) ? raw : raw.toFixed(2)
    }

    return (
        <SkeletonA
            header={<HeaderA role={'Instructor'} name={'NORTON, MONICA'} />}
            nav={<SideNavigation />}
            content={
                <div className={styles.container}>
                    <FormNavigation goBack={goBackHandler} />
                    <div className={styles['form-container']}>

                        <h2>Topic</h2>
                        <TextField
                            initialValue={assessmentData.topic || 'No topic linked.'}
                            disabled={true}
                            readOnly={true}
                        />

                        <h2>TLA Details</h2>
                        <TextField
                            label={'TLA Name'}
                            disabled={true}
                            initialValue={assessmentData.tlaName || ''}
                            readOnly={true}
                        />
                        <TextArea
                            label={'TLA Description'}
                            disabled={true}
                            initialValue={assessmentData.tlaDescription || 'No description available.'}
                            readOnly={true}
                        />

                        <h2>Assessment Details</h2>
                        <div className={styles['tlas']}>
                            <div className={styles.assessmentField} ref={dropdownRef}>
                                <label>Assessment Method</label>

                                <div
                                    className={`${styles.assessmentDropdown} ${
                                        showOptions ? styles.open : ''
                                    }`}
                                    onClick={() => setShowOptions(v => !v)}
                                >
                                    <input
                                        value={method}
                                        onChange={e => {
                                            setMethod(e.target.value)
                                            setShowOptions(true)
                                        }}
                                        placeholder="Select or type…"
                                    />

                                    <ChevronDown className={styles.dropdownArrow} size={16} />

                                </div>

                                {showOptions && (
                                    <div className={styles.assessmentOptions}>
                                        {assessmentOptions
                                            .filter(opt =>
                                                opt.toLowerCase().includes(method.toLowerCase())
                                            )
                                            .map(opt => (
                                                <div
                                                    key={opt}
                                                    className={styles.assessmentOption}
                                                    onMouseDown={() => {
                                                        setMethod(opt)
                                                        setShowOptions(false)
                                                    }}
                                                >
                                                    {opt}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>


                            <TextArea
                                label={'Assessment Description'}
                                initialValue={description}
                                onChange={(value) => setDescription(value)}
                            />
                            <div className={'checkbox'}>
                                <input
                                    type="checkbox"
                                    checked={rubric}
                                    onChange={() => setRubric(!rubric)}
                                />
                                Include Rubric
                            </div>
                        </div>

                        {rubric && (
                            <>
                                <h2>Rubric Criteria</h2>
                                <div className={styles['rubrics']}>
                                    <div className={styles['rubric-header']}>
                                        <div className={styles['rubric-cell']}>Criteria</div>
                                        <div className={styles['rubric-cell']}>Max Score</div>
                                        <div className={styles['rubric-cell']}>Weight</div>
                                        <div className={styles['rubric-cell']}></div>
                                    </div>
                                    {rubricRows.map((row) => (
                                        <div key={row.id} className={styles['rubric-row']}>
                                            <TextField
                                                initialValue={row.criteria}
                                                onChange={(val) => handleRubricChange(row.id, 'criteria', val)}
                                            />
                                            <TextField
                                                initialValue={row.maxScore}
                                                onChange={(val) => handleRubricChange(row.id, 'maxScore', val)}
                                            />
                                            <TextField
                                                value={getWeight(row.maxScore)}
                                                disabled
                                                readOnly
                                            />
                                            <div onClick={() => handleRubricDelete(row.id)} className={styles['x']}>
                                                <X size={20} color={'white'}/>
                                            </div>
                                        </div>
                                    ))}
                                    <div className={styles['rubric-row']}>
                                        <TextField
                                            initialValue={'TOTAL'}
                                            disabled={true}
                                            readOnly={true}
                                        />
                                        <TextField
                                            initialValue={rubricRows.reduce((sum, r) => sum + Number(r.maxScore || 0), 0)}
                                            disabled={true}
                                            readOnly={true}
                                        />
                                        <TextField
                                            value={totalMaxScore ? "100%" : "0%"}
                                            disabled
                                            readOnly
                                        />
                                        <div className={styles['x']} style={{ visibility: 'hidden' }}>
                                            <X size={20} color={'transparent'} />
                                        </div>
                                    </div>
                                    <div className={styles['rubric-add']}>
                                            <Duplicator onAdd={handleRubricAdd} name={'Add Row'} />
                                        </div>
                                </div>
                            </>
                        )}

                    </div>
                </div>
            }
        />
    )
}

export default AssessmentForm;
