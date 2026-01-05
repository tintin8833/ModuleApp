import { useState, useRef, useEffect } from "react";
import { X, Upload, Trash2 } from "react-feather";  // Added Trash2 for the clear icon
import layout from "../styles/QuestionCognitiveMapping.module.sass";
import Duplicator from "../components/Duplicator.jsx";

const QuestionCognitiveMapping = ({ outcomeData, questions, setQuestions }) => {
    const fileInputRef = useRef(null);

    const cognitiveLevels = [
        'Remembering',
        'Understanding',
        'Applying',
        'Analyzing',
        'Evaluating',
        'Creating'
    ];

    const createEmptyQuestion = () => ({
        id: Date.now() + Math.random(),
        question: '',
        co: '',
        ilo: '',
        points: '',
        cognitiveLevel: ''
    });

    const handleAddQuestion = () => {
        const max = getTotalRequiredItems();

        if (questions.length >= max) {
            alert("TOS is already full.");
            return;
        }

        setQuestions(prev => [...prev, createEmptyQuestion()]);
    };


    const handleDeleteQuestion = (id) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleQuestionChange = (id, field, value) => {
        setQuestions(questions.map(q => {
            if (q.id === id) {
                const updated = { ...q, [field]: value };

                // If CO changes → reset ILO & Cognitive Level
                if (field === 'co') {
                    updated.ilo = '';
                    updated.cognitiveLevel = '';
                }

                // If ILO changes → reset Cognitive Level if it’s not allowed
                if (field === 'ilo') {
                    const allowed = getAllowedCognitiveLevels(value);
                    if (!allowed.includes(updated.cognitiveLevel)) {
                        updated.cognitiveLevel = '';
                    }
                }

                return updated;
            }
            return q;
        }));
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleClearQuestions = () => {
        setQuestions([]);  // Clear all questions; useEffect will add one back
    };

    const getAvailableILOs = (coId) => {
        const co = outcomeData.find(c => c.co === coId);
        return co ? co.ilos : [];
    };

    const getCurrentItemCount = () => {
        const counts = {};

        outcomeData.forEach(co => {
            counts[co.co] = { total: 0, ilos: {} };
            co.ilos.forEach(ilo => {
                counts[co.co].ilos[ilo.id] = 0;
            });
        });

        questions.forEach(q => {
            if (q.co && q.ilo) {
                counts[q.co].total += 1;
                counts[q.co].ilos[q.ilo] += 1;
            }
        });

        return counts;
    };

    const currentCounts = getCurrentItemCount();

    const labelColPct = 18;   // width for first label column
    const totalColPct = 10;   // width for Total column
    const remainingPct = 100 - labelColPct - totalColPct;
    const totalILOs = outcomeData.reduce((sum, co) => sum + co.ilos.length, 0) || 1;
    const perIloPct = remainingPct / totalILOs;

    useEffect(() => {
        // Only ensure UI is not blank
        if (questions.length === 0) {
            setQuestions([createEmptyQuestion()]);
        }
    }, [questions.length]);


    const getAllowedCognitiveLevels = (iloId) => {
        if (!iloId) return [];

        switch (iloId) {
            case 'ILO1':
                return ['Remembering', 'Understanding'];
            case 'ILO2':
                return ['Understanding', 'Applying', 'Analyzing', 'Evaluating'];
            case 'ILO3':
                return ['Applying', 'Analyzing', 'Evaluating', 'Creating'];
            default:
                return cognitiveLevels;
        }
    };

    const getTotalRequiredItems = () =>
        outcomeData.reduce((sum, co) => sum + Number(co.totalItems || 0), 0);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const lines = content.split('\n').filter(l => l.trim());

                const newQuestions = lines.map(line => ({
                    id: Date.now() + Math.random(),
                    question: line.trim(),
                    co: '',
                    ilo: '',
                    points: '',
                    cognitiveLevel: ''
                }));

                const maxItems = getTotalRequiredItems();
                const currentItems = questions.filter(q => q.co && q.ilo).length;
                const available = maxItems - currentItems;

                if (available <= 0) {
                    alert("TOS is already full. No more items can be added.");
                    return;
                }

                const accepted = newQuestions.slice(0, available);

                setQuestions(prev => {
                    const cleaned = prev.filter(q => q.co || q.ilo || q.question);
                    return [...cleaned, ...accepted];
                });

                if (newQuestions.length > available) {
                    alert(`Only ${available} items were accepted. TOS is already full.`);
                }

            } catch (err) {
                console.error(err);
                alert("Invalid file.");
            }
        };

        reader.readAsText(file);
        event.target.value = '';
    };

    return (
        <div className={layout.container}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.doc,.docx, .xlsx, .xls"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
            />

            <div className={layout.section}>
                <h2>Items Allocated</h2>

                <table className={`${layout.qctable} ${layout.TOSTable}`}>
                    <thead>
                    <tr>
                        <th style={{ width: `${labelColPct}%` }}>
                            <div className={`${layout.cellBox} ${layout.mainHeader}`}></div>
                        </th>

                        {outcomeData.map(co => (
                            <th
                                key={co.co}
                                style={{ width: `${co.ilos.length * perIloPct}%` }}
                            >
                                <div className={`${layout.cellBox} ${layout.mainHeader}`}>{co.co}</div>
                            </th>
                        ))}

                        <th style={{ width: `${totalColPct}%` }}>
                            <div className={`${layout.cellBox} ${layout.mainHeader}`}>Total</div>
                        </th>
                    </tr>

                    <tr>
                        {/* Empty cell to align with the first label column */}
                        <th style={{ width: `${labelColPct}%` }}>
                            <div className={`${layout.cellBox} ${layout.mainHeader}`}></div>
                        </th>

                        {/* ILO subheaders (each gets perIloPct) */}
                        {outcomeData.flatMap(co =>
                            co.ilos.map(ilo => (
                                <th
                                    key={`${co.co}-${ilo.id}`}
                                    style={{ width: `${perIloPct}%` }}
                                >
                                    <div className={`${layout.cellBox} ${layout.subHeader}`}>{ilo.id}</div>
                                </th>
                            ))
                        )}

                        {/* Empty cell to align under the Total column */}
                        <th style={{ width: `${totalColPct}%` }}>
                            <div className={`${layout.cellBox} ${layout.mainHeader}`}></div>
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    <tr>
                        <td style={{ width: `${labelColPct}%` }}>
                            <div className={layout.firstRow}>Items Needed</div>
                        </td>

                        {outcomeData.flatMap(co =>
                            co.ilos.map(ilo => (
                                <td key={`needed-${co.co}-${ilo.id}`} style={{ width: `${perIloPct}%` }}>
                                    <div className={`${layout.cellBox}`}>{ilo.items}</div>
                                </td>
                            ))
                        )}

                        <td style={{ width: `${totalColPct}%` }}>
                            <div className={`${layout.cellBox} ${layout.totalReqPoint}`}>
                                {outcomeData.reduce((sum, co) => sum + co.totalItems, 0)}
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style={{ width: `${labelColPct}%` }}>
                            <div className={layout.firstRow}>Current Item Count</div>
                        </td>

                        {outcomeData.flatMap(co =>
                            co.ilos.map(ilo => (
                                <td key={`current-${co.co}-${ilo.id}`} style={{ width: `${perIloPct}%` }}>
                                    <div className={`${layout.cellBox}`}>
                                        {currentCounts[co.co]?.ilos[ilo.id] || 0}
                                    </div>
                                </td>
                            ))
                        )}

                        <td style={{ width: `${totalColPct}%` }}>
                            <div className={`${layout.cellBox} ${layout.totalCuPoint}`}>
                                {Object.values(currentCounts).reduce((sum, co) => sum + co.total, 0)}
                            </div>
                        </td>
                    </tr>
                    </tbody>

                </table>
            </div>

            {/* Question-Cognitive Mapping Section */}
            <div className={layout.section}>
                <div className={layout.sectionHeader}>
                    <h2>
                        Assessment Item-Cognitive Level Alignment
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleUploadClick}
                            className={layout.uploadButton}
                        >
                            <Upload size={16} style={{ marginRight: '8px' }} />
                            Upload File
                        </button>
                        <button
                            onClick={handleClearQuestions}
                            className={`${layout.uploadButton} ${layout.clearButton}`}
                        >
                            <Trash2 size={16} style={{ marginRight: '8px' }} />
                            Clear
                        </button>
                    </div>
                </div>

                <div className={layout.tableHeader}>
                    <div className={layout.headerCell}>No.</div>
                    <div className={layout.headerCell}>Question</div>
                    <div className={layout.headerCell}>CO</div>
                    <div className={layout.headerCell}>ILO</div>
                    <div className={layout.headerCell}>Points</div>
                    <div className={layout.headerCell}>Cognitive Level</div>
                    <div></div>
                </div>

                {questions.map((q, index) => (
                    <div key={q.id} className={layout.tableRow}>
                        <div className={layout.numberCell}>
                            {index + 1}
                        </div>

                        <textarea
                            value={q.question}
                            onChange={(e) => handleQuestionChange(q.id, 'question', e.target.value)}
                            placeholder="Enter question"
                            className={layout.questionInput}
                        />

                        <select
                            value={q.co}
                            onChange={(e) => handleQuestionChange(q.id, 'co', e.target.value)}
                            className={layout.selectInput}
                        >
                            <option value="">Select CO</option>
                            {outcomeData.map(co => (
                                <option key={co.co} value={co.co}>{co.co}</option>
                            ))}
                        </select>

                        <select
                            value={q.ilo}
                            onChange={(e) => handleQuestionChange(q.id, 'ilo', e.target.value)}
                            disabled={!q.co}
                            className={`${layout.selectInput} ${!q.co ? layout.disabled : ''}`}
                        >
                            <option value="">Select ILO</option>
                            {q.co && getAvailableILOs(q.co).map(ilo => (
                                <option key={ilo.id} value={ilo.id}>{ilo.id}</option>
                            ))}
                        </select>

                        <input
                            type="number"
                            value={q.points}
                            onChange={(e) => handleQuestionChange(q.id, 'points', e.target.value)}
                            placeholder="0"
                            className={layout.numberInput}
                        />

                        <select
                            value={q.cognitiveLevel}
                            onChange={(e) => handleQuestionChange(q.id, 'cognitiveLevel', e.target.value)}
                            disabled={!q.ilo}
                            className={`${layout.selectInput} ${!q.ilo ? layout.disabled : ''}`}
                        >
                            <option value="">Select Level</option>

                            {getAllowedCognitiveLevels(q.ilo).map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>


                        <div onClick={() => handleDeleteQuestion(q.id)} className={layout.deleteButton}>
                            <X size={20} color={'white'} />
                        </div>
                    </div>
                ))}
                <div className={layout.addRow}>
                    <Duplicator onAdd={handleAddQuestion} name={'Question'} />
                </div>
            </div>
        </div>
    );
};

export default QuestionCognitiveMapping;
