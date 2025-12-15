import React from "react";
import layout from "../styles/QuestionCognitiveMapping.module.sass";

const TOSPreview = ({ isOpen, onClose, outcomeData, questions, courseName = "Human & Computer Interaction", semester = "1st Sem", schoolYear = "2024 - 2025" }) => {
    if (!isOpen) return null;

    // Cognitive levels
    const cognitiveLevels = [
        'Remembering',
        'Understanding',
        'Applying',
        'Analyzing',
        'Evaluating',
        'Creating'
    ];

    // Aggregate cognitive data (counts and sums per CO-ILO-level)
    const getAggregatedData = () => {
        const data = {};
        outcomeData.forEach(co => {
            data[co.co] = {};
            co.ilos.forEach(ilo => {
                data[co.co][ilo.id] = {};
                cognitiveLevels.forEach(level => {
                    data[co.co][ilo.id][level] = { count: 0, sumPoints: 0 };
                });
            });
        });

        questions.forEach(q => {
            if (q.co && q.ilo && q.cognitiveLevel && q.points) {
                data[q.co][q.ilo][q.cognitiveLevel].count += 1;
                data[q.co][q.ilo][q.cognitiveLevel].sumPoints += Number(q.points);
            }
        });

        return data;
    };

    const aggregatedData = getAggregatedData();

    // Calculate totals
    const totalHours = outcomeData.reduce((sum, co) => sum + (co.totalHours || 0), 0);
    const totalPercentage = outcomeData.reduce((sum, co) => sum + (co.totalPercentage || 0), 0);
    const totalPoints = outcomeData.reduce((sum, co) => sum + (co.totalPoints || 0), 0);
    const totalCognitive = cognitiveLevels.map(level => {
        return outcomeData.reduce((sum, co) => {
            return sum + co.ilos.reduce((iloSum, ilo) => iloSum + (aggregatedData[co.co][ilo.id][level].sumPoints || 0), 0);
        }, 0);
    });

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className={layout.section} style={{ width: '90%', maxWidth: '1200px', maxHeight: '80vh', overflowY: 'auto' }}>
                <h3>Preview</h3>

                {/* Header Fields */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <label>Course:</label>
                        <input
                            type="text"
                            disabled
                            value={courseName}
                            className={layout.numberInput}
                            style={{ width: '200px' }}
                        />
                        <label>Semester:</label>
                        <input
                            type="text"
                            disabled
                            value={semester}
                            className={layout.numberInput}
                            style={{ width: '100px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <label>
                            <input type="checkbox" disabled /> Midterm
                        </label>
                        <label>
                            <input type="checkbox" disabled /> Final
                        </label>
                        <label>School Year:</label>
                        <input
                            type="text"
                            disabled
                            value={schoolYear}
                            className={layout.numberInput}
                            style={{ width: '120px' }}
                        />
                    </div>
                </div>

                {/* Table */}
                <table className={`${layout.qctable} ${layout.TOSTable}`}>
                    <thead>
                    <tr>
                        <th>COs & ILOs</th>
                        <th>No. of Hours</th>
                        <th>%</th>
                        <th>No. of Points</th>
                        <th colSpan={cognitiveLevels.length}>Cognitive Levels</th>
                    </tr>
                    <tr>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        {cognitiveLevels.map(level => (
                            <th key={level}>{level}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {outcomeData.map(co => (
                        <React.Fragment key={co.co}>
                            {/* CO Row */}
                            <tr>
                                <td>
                                    <div className={layout.cellBox}>{co.co}</div>
                                </td>
                                <td>
                                    <div className={layout.cellBox}>{co.totalHours || 0}</div>
                                </td>
                                <td>
                                    <div className={layout.cellBox}>{co.totalPercentage || 0}</div>
                                </td>
                                <td>
                                    <div className={layout.cellBox}>{co.totalPoints || 0}</div>
                                </td>
                                {cognitiveLevels.map(level => (
                                    <td key={level}>
                                        <div className={layout.cellBox}>
                                            {co.ilos.reduce((sum, ilo) => sum + (aggregatedData[co.co][ilo.id][level].sumPoints || 0), 0)}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                            {/* ILO Rows */}
                            {co.ilos.map(ilo => (
                                <tr key={ilo.id}>
                                    <td>
                                        <div className={layout.cellBox}>{ilo.id}</div>
                                    </td>
                                    <td>
                                        <div className={layout.cellBox}>{ilo.hours || 0}</div>
                                    </td>
                                    <td>
                                        <div className={layout.cellBox}>{ilo.percentage || 0}</div>
                                    </td>
                                    <td>
                                        <div className={layout.cellBox}>{ilo.points || 0}</div>
                                    </td>
                                    {cognitiveLevels.map(level => (
                                        <td key={level}>
                                            <div className={layout.cellBox}>
                                                {aggregatedData[co.co][ilo.id][level].count} x {aggregatedData[co.co][ilo.id][level].sumPoints}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                    {/* Total Row */}
                    <tr>
                        <td>
                            <div className={layout.cellBox}>Total</div>
                        </td>
                        <td>
                            <div className={layout.cellBox}>{totalHours}</div>
                        </td>
                        <td>
                            <div className={layout.cellBox}>{totalPercentage}</div>
                        </td>
                        <td>
                            <div className={layout.cellBox}>{totalPoints}</div>
                        </td>
                        {totalCognitive.map((total, index) => (
                            <td key={index}>
                                <div className={layout.cellBox}>{total}</div>
                            </td>
                        ))}
                    </tr>
                    </tbody>
                </table>

                {/* Export Button */}
                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                    <button className={layout.uploadButton} onClick={onClose}>Export</button>  {/* Placeholder: Add actual export logic here */}
                </div>
            </div>
        </div>
    );
};

export default TOSPreview;