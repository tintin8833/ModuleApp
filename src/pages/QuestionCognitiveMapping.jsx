import { useState, useRef } from "react";
import { X, Upload } from "react-feather";
import layout from "../styles/QuestionCognitiveMapping.module.sass";
import Duplicator from "../components/Duplicator.jsx";

const QuestionCognitiveMapping = ({ outcomeData }) => {
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

    const [questions, setQuestions] = useState([createEmptyQuestion()]);

    const handleAddQuestion = () => {
        setQuestions([...questions, createEmptyQuestion()]);
    };

    const handleDeleteQuestion = (id) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleQuestionChange = (id, field, value) => {
        setQuestions(questions.map(q => {
            if (q.id === id) {
                const updated = { ...q, [field]: value };
                if (field === 'co') {
                    updated.ilo = '';
                }
                return updated;
            }
            return q;
        }));
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                // Parse text file - each line is a question
                const lines = content.split('\n').filter(line => line.trim());

                const newQuestions = lines.map(line => ({
                    id: Date.now() + Math.random(),
                    question: line.trim(),
                    co: '',
                    ilo: '',
                    points: '',
                    cognitiveLevel: ''
                }));

                if (newQuestions.length > 0) {
                    setQuestions(newQuestions);
                }
            } catch (error) {
                console.error('Error parsing file:', error);
                alert('Error reading file. Please upload a valid text file with questions.');
            }
        };

        reader.readAsText(file);
        // Reset file input
        event.target.value = '';
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const getAvailableILOs = (coId) => {
        const co = outcomeData.find(c => c.co === coId);
        return co ? co.ilos : [];
    };

    const getCurrentPointCount = () => {
        const counts = {};
        outcomeData.forEach(co => {
            counts[co.co] = { total: 0, ilos: {} };
            co.ilos.forEach(ilo => {
                counts[co.co].ilos[ilo.id] = 0;
            });
        });

        questions.forEach(q => {
            if (q.co && q.ilo && q.points) {
                counts[q.co].total += Number(q.points);
                counts[q.co].ilos[q.ilo] += Number(q.points);
            }
        });

        return counts;
    };

    const currentCounts = getCurrentPointCount();

    return (
        <div className={layout.mainContainer}>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.doc,.docx, .xlsx, .xls"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
            />

            {/* Points Allocated Section */}
            <div className={layout.section}>
                <h2>Points Allocated</h2>

                <table className={`${layout.table} ${layout.TOSTable}`}>
                    <thead>
                    <tr>
                        <th rowSpan="2">
                            <div className={layout.cellBox}> </div>
                        </th>
                        {outcomeData.map(co => (
                            <th key={co.co} colSpan={co.ilos.length}>
                                <div className={layout.cellBox}>{co.co}</div>
                            </th>
                        ))}
                        <th rowSpan="2">
                            <div className={layout.cellBox}>Total</div>
                        </th>
                    </tr>
                    <tr>
                        {outcomeData.map(co => (
                            co.ilos.map(ilo => (
                                <th key={`${co.co}-${ilo.id}`}>
                                    <div className={layout.cellBox}>{ilo.id}</div>
                                </th>
                            ))
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>
                            <div className={layout.blankCell}>Points Needed</div>
                        </td>
                        {outcomeData.map(co => (
                            <>
                                {co.ilos.map(ilo => (
                                    <td key={`needed-${co.co}-${ilo.id}`}>
                                        <div className={`${layout.cellBox} ${layout.muted}`}>
                                            {ilo.points}
                                        </div>
                                    </td>
                                ))}
                            </>
                        ))}
                        <td>
                            <div className={`${layout.cellBox} ${layout.mutedBold}`}>
                                {outcomeData.reduce((sum, co) => sum + co.totalPoints, 0)}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div className={layout.blankCell}>Current Point Count</div>
                        </td>
                        {outcomeData.map(co => (
                            <>
                                {co.ilos.map(ilo => (
                                    <td key={`current-${co.co}-${ilo.id}`}>
                                        <div className={`${layout.cellBox} ${layout.readable}`}>
                                            {currentCounts[co.co]?.ilos[ilo.id] || 0}
                                        </div>
                                    </td>
                                ))}
                            </>
                        ))}
                        <td>
                            <div className={`${layout.cellBox} ${layout.totalCoPoint}`}>
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
                        Question-Cognitive Level Mapping
                    </h2>
                    <button
                        onClick={handleUploadClick}
                        className={layout.uploadButton}
                    >
                        <Upload size={16} style={{ marginRight: '8px' }} />
                        Upload Questions
                    </button>
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
                            className={layout.selectInput}
                        >
                            <option value="">Select Level</option>
                            {cognitiveLevels.map(level => (
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