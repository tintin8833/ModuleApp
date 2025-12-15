import React, { useState } from "react";
import SkeletonA from "../layouts/SkeletonA.jsx";
import HeaderA from "../components/HeaderA.jsx";
import FormNavigation from "../components/FormNavigation.jsx";
import styles from "../styles/Form.module.sass";
import { useNavigate, useParams } from "react-router-dom";
import TextField from "../components/TextField.jsx";
import DropdownA from "../components/DropdownA.jsx";
import { X, AlertCircle, CheckCircle } from "react-feather"; // Icons
import Duplicator from "../components/Duplicator.jsx";
import TextArea from "../components/TextArea.jsx";
import SideNavigation from "../components/SideNavigation.jsx";
import { getSyllabusByCode } from "../data/syllabiData.js";

const TopicForm = () => {
    const navigate = useNavigate();
    const { code, topicId } = useParams();

    const goBackHandler = () => {
        navigate(-1);
    };

    const classPhases = ['Pre-class', 'In-class', 'Post-class'];

    // 1. Get Data
    const syllabus = getSyllabusByCode(code);
    const topicData = syllabus?.topics.find(t => t.id === topicId) || {};

    // 2. Initialize State
    // Core Topic Title
    const [title, setTitle] = useState(topicData.title || '');

    // Subtopics
    const [subtopics, setSubtopics] = useState(
        topicData.subtopics || [{ id: '1', value: '' }]
    );

    // TLAs
    const [tlas, setTlas] = useState(
        topicData.tlas || [{ id: '1', classPhase: '', performedBy: '', tlaName: '', tlaDescription: '', laboratory: false }]
    );

    const [flipped, setFlipped] = useState(false);

    // Error State
    const [errors, setErrors] = useState({});

    // Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);


    // --- HANDLERS ---

    // Title Handler
    const handleTitleChange = (val) => {
        setTitle(val);
        if (errors.title) setErrors(prev => ({ ...prev, title: null }));
    };

    // Subtopic Handlers
    const handleSubtopicAdd = () => {
        const newSubtopic = { id: Date.now() + Math.random(), value: '' };
        setSubtopics([...subtopics, newSubtopic]);
    };

    const handleSubtopicDelete = (idToDelete) => {
        if (subtopics.length === 1) return;
        setSubtopics(subtopics.filter((item) => item.id !== idToDelete));
        // Cleanup errors for deleted item
        const newErrors = { ...errors };
        delete newErrors[`subtopic_${idToDelete}`];
        setErrors(newErrors);
    };

    const handleSubtopicChange = (id, val) => {
        setSubtopics(prev => prev.map(item => item.id === id ? { ...item, value: val } : item));
        // Clear error
        if (errors[`subtopic_${id}`]) {
            setErrors(prev => ({ ...prev, [`subtopic_${id}`]: null }));
        }
    };

    // TLA Handlers
    const handleTlaAdd = () => {
        const newTla = {
            id: Date.now() + Math.random(),
            classPhase: '',
            performedBy: '',
            tlaName: '',
            tlaDescription: '',
            laboratory: false
        };
        setTlas([...tlas, newTla]);
    };

    const handleTlaDelete = (idToDelete) => {
        if (tlas.length === 1) return;
        setTlas(tlas.filter((item) => item.id !== idToDelete));
        // Cleanup errors for deleted item to avoid memory leaks/stale state
        const newErrors = { ...errors };
        Object.keys(newErrors).forEach(key => {
            if (key.startsWith(`tla_${idToDelete}`)) delete newErrors[key];
        });
        setErrors(newErrors);
    };

    const handleTlaChange = (id, field, value) => {
        setTlas(prevTlas => prevTlas.map(tla =>
            tla.id === id ? { ...tla, [field]: value } : tla
        ));

        // Clear error for specific field
        const errorKey = `tla_${id}_${field}`;
        if (errors[errorKey]) {
            setErrors(prev => ({ ...prev, [errorKey]: null }));
        }
    };

    const handleFlipped = (e) => { setFlipped(e.target.checked) };


    // --- VALIDATION LOGIC ---

    const validateForm = () => {
        let newErrors = {};

        // 1. Validate Topic Title
        if (!title.trim()) {
            newErrors.title = "Core Topic Title is required.";
        }

        // 2. Validate Subtopics
        subtopics.forEach((sub, index) => {
            if (!sub.value.trim()) {
                newErrors[`subtopic_${sub.id}`] = "Subtopic cannot be empty.";
            } else if (sub.value.length < 3) {
                newErrors[`subtopic_${sub.id}`] = "Subtopic is too short.";
            }
        });

        // 3. Validate TLAs
        tlas.forEach((tla, index) => {
            if (!tla.classPhase) newErrors[`tla_${tla.id}_classPhase`] = "Required";
            if (!tla.performedBy) newErrors[`tla_${tla.id}_performedBy`] = "Required";

            if (!tla.tlaName.trim()) {
                newErrors[`tla_${tla.id}_tlaName`] = "TLA Name is required.";
            }

            if (!tla.tlaDescription.trim()) {
                newErrors[`tla_${tla.id}_tlaDescription`] = "Description is required.";
            } else if (tla.tlaDescription.length < 10) {
                newErrors[`tla_${tla.id}_tlaDescription`] = "Description is too short (min 10 chars).";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveClick = () => {
        if (validateForm()) {
            setShowConfirmModal(true);
        } else {
            setShowErrorModal(true);
        }
    };

    const handleConfirmSave = () => {
        // Logic to save data to backend/context would go here
        console.log("Saving Topic:", { title, subtopics, tlas, flipped });
        setShowConfirmModal(false);
        navigate(-1);
    };

    return (
        <SkeletonA
            header={<HeaderA role={'Instructor'} name={'NORTON, MONICA'} />}
            nav={<SideNavigation />}
            content={
                <div className={styles.container}>
                    {/* Pass handleSaveClick to Navigation */}
                    <FormNavigation goBack={goBackHandler} onSave={handleSaveClick} />

                    <div className={styles['form-container']}>

                        <h2>Core Topic</h2>
                        <TextField
                            value={title}
                            onChange={handleTitleChange}
                            error={errors.title}
                            placeholder="Enter main topic title..."
                        />

                        <h2>Subtopic Lists</h2>
                        {subtopics.map((item) => (
                            <div className={styles['list']} key={item.id}>
                                <TextField
                                    value={item.value}
                                    onChange={(val) => handleSubtopicChange(item.id, val)}
                                    error={errors[`subtopic_${item.id}`]}
                                    placeholder="Enter subtopic..."
                                />
                                <div onClick={() => handleSubtopicDelete(item.id)} className={'x'}>
                                    <X size={20} color={'white'} />
                                </div>
                            </div>
                        ))}
                        <Duplicator onAdd={handleSubtopicAdd} name={'Subtopic'} />

                        <h2>Teaching & Learning Activities</h2>

                        <div className={'checkbox'}>
                            <input checked={flipped} onChange={handleFlipped} type="checkbox" /> Flipped Approach
                        </div>

                        {tlas.map((item) => (
                            <div className={styles.list} key={item.id}>
                                <div className={styles.tlas}>
                                    <div className={styles.list}>
                                        <DropdownA
                                            options={classPhases}
                                            label={'Class Phase'}
                                            value={item.classPhase}
                                            onChange={(val) => handleTlaChange(item.id, 'classPhase', val)}
                                            error={errors[`tla_${item.id}_classPhase`]}
                                        />
                                        <DropdownA
                                            options={['Student', 'Instructor']}
                                            label={'Performed By'}
                                            value={item.performedBy}
                                            onChange={(val) => handleTlaChange(item.id, 'performedBy', val)}
                                            error={errors[`tla_${item.id}_performedBy`]}
                                        />
                                    </div>

                                    <TextField
                                        label={'TLA Name'}
                                        value={item.tlaName}
                                        onChange={(val) => handleTlaChange(item.id, 'tlaName', val)}
                                        error={errors[`tla_${item.id}_tlaName`]}
                                        placeholder="e.g., Lecture, Group Activity..."
                                    />

                                    {/* Assumes TextArea follows similar pattern to TextField */}
                                    <TextArea
                                        label={'Text Description'}
                                        value={item.tlaDescription}
                                        onChange={(val) => handleTlaChange(item.id, 'tlaDescription', val)}
                                        error={errors[`tla_${item.id}_tlaDescription`]}
                                        rows={4}
                                    />

                                    <div className={'checkbox'}>
                                        <input
                                            type="checkbox"
                                            checked={item.laboratory === true}
                                            onChange={(e) => handleTlaChange(item.id, 'laboratory', e.target.checked)}
                                        /> Laboratory
                                    </div>
                                </div>

                                <div onClick={() => handleTlaDelete(item.id)} className={'x'}>
                                    <X size={20} color={'white'} />
                                </div>
                            </div>
                        ))}

                        <Duplicator onAdd={handleTlaAdd} name={'TLA'} />

                    </div>

                    {/* --- POPUPS / MODALS --- */}

                    {/* 1. CONFIRMATION POPUP */}
                    {showConfirmModal && (
                        <div className={styles.modalOverlay}>
                            <div className={styles.modal}>
                                <div className={styles.modalHeader}>
                                    <h3>Confirm Save</h3>
                                </div>
                                <div className={styles.modalBody}>
                                    <CheckCircle size={40} color="#4CAF50" style={{ marginBottom: '1rem' }} />
                                    <p>Are you sure you want to save these changes?</p>
                                </div>
                                <div className={styles.modalActions}>
                                    <button className={styles.cancelBtn} onClick={() => setShowConfirmModal(false)}>No, Cancel</button>
                                    <button className={styles.confirmBtn} onClick={handleConfirmSave}>Yes, Save</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. ERROR POPUP */}
                    {showErrorModal && (
                        <div className={styles.modalOverlay}>
                            <div className={styles.modal}>
                                <div className={styles.modalHeader} style={{ borderBottomColor: '#FF5252' }}>
                                    <h3 style={{ color: '#FF5252' }}>Validation Error</h3>
                                    <X
                                        size={24}
                                        className={styles.closeIcon}
                                        onClick={() => setShowErrorModal(false)}
                                    />
                                </div>
                                <div className={styles.modalBody}>
                                    <AlertCircle size={40} color="#FF5252" style={{ marginBottom: '1rem' }} />
                                    <p>Please fix the highlighted issues before saving.</p>

                                    {/* Optional: Summary of errors if you want to be specific,
                                        otherwise just the general message above is enough given the field highlighting.
                                        Here we limit the list height if there are many errors. */}
                                    <ul className={styles.errorList} style={{maxHeight: '150px', overflowY: 'auto'}}>
                                        {Object.entries(errors).map(([key, err], idx) => (
                                            <li key={idx}>
                                                {/* Make the error message a bit more descriptive based on key */}
                                                {key.includes('subtopic') ? `Subtopic: ${err}` :
                                                    key.includes('tla') ? `Activity: ${err}` :
                                                        `Topic: ${err}`}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className={styles.modalActions}>
                                    <button className={styles.confirmBtn} style={{ backgroundColor: '#FF5252' }} onClick={() => setShowErrorModal(false)}>
                                        Okay, I'll fix it
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            }
        />
    )
}

export default TopicForm;