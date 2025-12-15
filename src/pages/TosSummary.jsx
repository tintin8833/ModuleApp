import React from "react";
import layout from "../styles/QuestionCognitiveMapping.module.sass";  // Reuse styles for consistency

const TOSSummary = ({ outcomeData, questions }) => {
    // Cognitive levels (matching QuestionCognitiveMapping)
    const cognitiveLevels = [
        'Remembering',
        'Understanding',
        'Applying',
        'Analyzing',
        'Evaluating',
        'Creating'
    ];

    // Aggregate data from questions: For each CO-ILO-cognitive level, get count (no. of items) and sumPoints (equi points/total)
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

    return (
        <div className={layout.container}>
            {outcomeData.map(co => (
                <div key={co.co} className={layout.section}>
                    {/* Flex container for h2 left, Total Points right */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2>{co.co}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            Total Points [
                            <input
                                type="text"
                                disabled
                                value={co.totalPoints || 0}
                                className={layout.numberInput}
                                style={{ width: '50px', textAlign: 'center', backgroundColor: '#F3F4F6', color: '#6B7280' }}
                            />
                            ]
                        </div>
                    </div>

                    {/* Disabled textfield with CO description */}
                    <div style={{ marginBottom: '16px' }}>
                        <input
                            type="text"
                            disabled
                            value={co.description || ''}  // CO description from outcomeData
                            className={layout.numberInput}
                            style={{ width: '100%', backgroundColor: '#F3F4F6', color: '#6B7280' }}
                        />
                    </div>

                    {/* Loop over ILOs for this CO */}
                    {co.ilos.map(ilo => (
                        <div key={ilo.id} style={{ marginBottom: '20px' }}>
                            <h3>{ilo.id}</h3>

                            {/* Disabled textfield with ILO description */}
                            <div style={{ marginBottom: '10px' }}>
                                <input
                                    type="text"
                                    disabled
                                    value={ilo.description || ''}  // ILO description from outcomeData
                                    className={layout.numberInput}
                                    style={{ width: '100%', backgroundColor: '#F3F4F6', color: '#6B7280' }}
                                />
                            </div>

                            {/* Table for cognitive levels */}
                            <table className={`${layout.qctable} ${layout.TOSTable}`}>
                                <thead>
                                <tr>
                                    <th></th>  {/* Empty for row labels */}
                                    {cognitiveLevels.map(level => (
                                        <th key={level}>{level}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {/* Row: no. of items */}
                                <tr>
                                    <td>
                                        <div className={layout.cellBox}>no. of items</div>
                                    </td>
                                    {cognitiveLevels.map(level => (
                                        <td key={level}>
                                            <div className={layout.cellBox}>
                                                {aggregatedData[co.co][ilo.id][level].count}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                {/* Row: equi points */}
                                <tr>
                                    <td>
                                        <div className={layout.cellBox}>equi points</div>
                                    </td>
                                    {cognitiveLevels.map(level => (
                                        <td key={level}>
                                            <div className={layout.cellBox}>
                                                {aggregatedData[co.co][ilo.id][level].sumPoints}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                {/* Row: total (items times points, i.e., sum of points) */}
                                <tr>
                                    <td>
                                        <div className={layout.cellBox}>total</div>
                                    </td>
                                    {cognitiveLevels.map(level => (
                                        <td key={level}>
                                            <div className={layout.cellBox}>
                                                {aggregatedData[co.co][ilo.id][level].sumPoints}  {/* Same as equi points, as per "items times points" */}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default TOSSummary;