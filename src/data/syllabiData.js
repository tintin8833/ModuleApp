export const syllabiData = [
    {
        code: 'BSCS313L',
        name: 'Human & Computer Interaction',
        update: 'Aug 01, 2025',
        status: 'DRAFT',
        approved: '',
        revision: '0',
        credits: '2 LEC, 1 LAB',
        contact: '3',
        class: 'Professional Courses',
        cmo: '25 S, 2015',
        year: 'THIRD YEAR',
        sem: '1st Semester',
        description: 'This course explores the principles and practices of Human-Computer Interaction (HCI), focusing on how people engage with digital systems and how to design technology that enhances user experience.\n' +
            '\n' +
            'Students will examine user-centered design methodologies, usability principles, interaction design processes, and evaluation techniques. The course also emphasizes the integration of emerging technologies for software product design (UI/UX), equipping students with insights into modern tools and trends that shape interactive systems.\n' +
            '\n' +
            'Through lectures, hands-on projects, and usability testing, learners will develop practical skills in designing intuitive and user-friendly interfaces that address real human needs. Drawing from foundational theories in psychology, design, and computer science, this course prepares students to create digital products that are both functional and forward-thinking, aligning with current and future developments\n' +
            'in UI/UX design.\n' +
            '\n',
        references:  [
            {
                id: "OR1",
                title: "UI PRINCIPLES",
                type: "Textbook",
                authors: "Author Name(s)",
                year: 2020
            },
            {
                id: "OR2",
                title: "Design Guidelines",
                type: "Online Resources",
                authors: "Author Name(s)",
                year: 2021
            },
            {
                id: "OR3",
                title: "Imagery",
                type: "Textbook",
                authors: "Author Name(s)",
                year: 2019
            },
            {
                id: "OE1",
                title: "UI PRINCIPLES",
                type: "Open Educational Resources",
                authors: "Author Name(s)",
                year: 2022
            },
            {
                id: "OE2",
                title: "Introduction to Generative AI",
                type: "Online Resources",
                authors: "Author Name(s)",
                year: 2023
            }
        ],
        topics: [
            {
                id: "T1",
                title: "HCI Models",
                subtopics: [
                    { id: "S1", value: "Example Subtopic 1" },
                    { id: "S2", value: "Example Subtopic 2" }
                ],
                tlas: [
                    {
                        id: "TLA1",
                        classPhase: "Pre-class",      // or "In-class", "Post-class"
                        performedBy: "Instructor",    // or "Student"
                        tlaName: "Lecture on HCI Models",
                        tlaDescription: "Introduce different models of HCI and their applications.",
                        laboratory: false
                    },
                    {
                        id: "TLA2",
                        classPhase: "In-class",
                        performedBy: "Student",
                        tlaName: "Group Activity",
                        tlaDescription: "Students analyze case studies of HCI models.",
                        laboratory: true
                    }
                ]
            },
            {
                id: "T2",
                title: "Introduction to HCI",
                subtopics: [
                    { id: "S3", value: "History of HCI" },
                    { id: "S4", value: "Importance of HCI" }
                ],
                tlas: [
                    {
                        id: "TLA3",
                        classPhase: "Pre-class",
                        performedBy: "Instructor",
                        tlaName: "Overview Lecture",
                        tlaDescription: "Provide background and context for HCI.",
                        laboratory: false
                    }
                ]
            },
            {
                id: "T3",
                title: "User Centered Design",
                subtopics: [
                    { id: "S5", value: "Principles of UCD" },
                    { id: "S6", value: "Iterative Design" }
                ],
                tlas: [
                    {
                        id: "TLA4",
                        classPhase: "In-class",
                        performedBy: "Student",
                        tlaName: "Design Workshop",
                        tlaDescription: "Students create prototypes following UCD principles.",
                        laboratory: true
                    }
                ]
            },
            {
                id: "T4",
                title: "Front End Prototyping",
                subtopics: [
                    { id: "S7", value: "Wireframing" },
                    { id: "S8", value: "Interactive Mockups" }
                ],
                tlas: [
                    {
                        id: "TLA5",
                        classPhase: "Post-class",
                        performedBy: "Instructor",
                        tlaName: "Prototype Review",
                        tlaDescription: "Evaluate student prototypes and provide feedback.",
                        laboratory: false
                    }
                ]
            }
        ],
        ilos: [
            {
                id: "CO0-ILO0",
                courseOutcome: "Apply core concepts, theories, and principles of Human-Computer Interface (HCI)...",
                intendedLearningOutcome: "Understand the role of HCI models in UI design.",
                deliveryWeek: "Week 1",
                allocatedTime: "1 hour",
                topics: ["HCI Models", "Introduction to HCI"],   // multiple topics
                references: ["OR1 - UI PRINCIPLES", "OR2 - Design Guidelines"] // multiple references
            },
            {
                id: "CO1-ILO1",
                courseOutcome: "Apply core concepts, theories, and principles of Human-Computer Interface (HCI)...",
                intendedLearningOutcome: "Introduce fundamental concepts of HCI.",
                deliveryWeek: "Week 2",
                allocatedTime: "1.5 hour",
                topics: ["User Centered Design", "Front End Prototyping"],
                references: ["OR3 - Imagery", "OE1 - UI PRINCIPLES"]
            },
            {
                id: "CO1-ILO2",
                courseOutcome: "Apply core concepts, theories, and principles of Human-Computer Interface (HCI)...",
                intendedLearningOutcome: "Apply user-centered design principles in prototype creation.",
                deliveryWeek: "Week 3",
                allocatedTime: "2 hours",
                topics: ["Front End Prototyping", "HCI Models"],
                references: ["OE2 - Introduction to Generative AI", "OR2 - Design Guidelines"]
            },
            {
                id: "CO1-ILO3",
                courseOutcome: "Apply core concepts, theories, and principles of Human-Computer Interface (HCI)...",
                intendedLearningOutcome: "Develop front-end prototypes using modern tools.",
                deliveryWeek: "Week 4",
                allocatedTime: "2 hours",
                topics: ["Introduction to HCI", "User Centered Design"],
                references: ["OR1 - UI PRINCIPLES", "OE2 - Introduction to Generative AI"]
            },
            {
                id: "CO2-ILO1",
                courseOutcome: "Apply core concepts, theories, and principles of Human-Computer Interface (HCI)...",
                intendedLearningOutcome: "Evaluate usability principles in interactive systems.",
                deliveryWeek: "Week 5",
                allocatedTime: "1 hour",
                topics: ["HCI Models", "Front End Prototyping"],
                references: ["OR3 - Imagery", "OE1 - UI PRINCIPLES"]
            },
            {
                id: "CO2-ILO2",
                courseOutcome: "Apply core concepts, theories, and principles of Human-Computer Interface (HCI)...",
                intendedLearningOutcome: "Analyze design guidelines for effective UI.",
                deliveryWeek: "Week 6",
                allocatedTime: "1.5 hour",
                topics: ["Introduction to HCI", "User Centered Design"],
                references: ["OR2 - Design Guidelines", "OE2 - Introduction to Generative AI"]
            },
            {
                id: "CO2-ILO3",
                courseOutcome: "Apply core concepts, theories, and principles of Human-Computer Interface (HCI)...",
                intendedLearningOutcome: "Integrate imagery and visual hierarchy in UI design.",
                deliveryWeek: "Week 7",
                allocatedTime: "2 hours",
                topics: ["Front End Prototyping", "HCI Models"],
                references: ["OR3 - Imagery", "OR1 - UI PRINCIPLES"]
            },
            {
                id: "CO3-ILO1",
                courseOutcome: "Apply core concepts, theories, and principles of Human-Computer Interface (HCI)...",
                intendedLearningOutcome: "Design prototypes with clarity and consistency.",
                deliveryWeek: "Week 8",
                allocatedTime: "1 hour",
                topics: ["User Centered Design", "Front End Prototyping"],
                references: ["OE1 - UI PRINCIPLES", "OR2 - Design Guidelines"]
            },
            {
                id: "CO3-ILO2",
                courseOutcome: "Apply core concepts, theories, and principles of Human-Computer Interface (HCI)...",
                intendedLearningOutcome: "Apply visual hierarchy in UI layouts.",
                deliveryWeek: "Week 9",
                allocatedTime: "1.5 hour",
                topics: ["Front End Prototyping", "Introduction to HCI"],
                references: ["OE2 - Introduction to Generative AI", "OR3 - Imagery"]
            },
            {
                id: "CO3-ILO3",
                courseOutcome: "Apply core concepts, theories, and principles of Human-Computer Interface (HCI)...",
                intendedLearningOutcome: "Evaluate prototypes through usability testing.",
                deliveryWeek: "Week 10",
                allocatedTime: "2 hours",
                topics: ["HCI Models", "User Centered Design"],
                references: ["OR1 - UI PRINCIPLES", "OE2 - Introduction to Generative AI"]
            },
            {
                id: "CO4-ILO1",
                courseOutcome: "Apply core concepts, theories, and principles of Human-Computer Interface (HCI)...",
                intendedLearningOutcome: "Demonstrate consistency in UI component design.",
                deliveryWeek: "Week 11",
                allocatedTime: "1 hour",
                topics: ["Introduction to HCI", "Front End Prototyping"],
                references: ["OR2 - Design Guidelines", "OE1 - UI PRINCIPLES"]
            },
            {
                id: "CO4-ILO2",
                courseOutcome: "Apply core concepts, theories, and principles of Human-Computer Interface (HCI)...",
                intendedLearningOutcome: "Apply advanced prototyping techniques.",
                deliveryWeek: "Week 12",
                allocatedTime: "1.5 hour",
                topics: ["Front End Prototyping", "HCI Models"],
                references: ["OR3 - Imagery", "OE2 - Introduction to Generative AI"]
            },
            {
                id: "CO4-ILO3",
                courseOutcome: "Apply core concepts, theories, and principles of Human-Computer Interface (HCI)...",
                intendedLearningOutcome: "Integrate generative AI concepts in UI design.",
                deliveryWeek: "Week 13",
                allocatedTime: "2 hours",
                topics: ["User Centered Design", "Introduction to HCI"],
                references: ["OE2 - Introduction to Generative AI", "OR1 - UI PRINCIPLES"]
            }
        ],
        assessments: [
            {
                id: 'A1',
                tlaName: 'UI Evaluation Checklist',
                topic: 'Interface Design Principles',
                phase: 'Pre-Class',
                tlaDescription:
                    'Students review and analyze UI components against established interface design principles, identifying inconsistencies and potential usability issues before starting their own designs...',

                assessmentMethod: 'Checklist-Based Evaluation',
                assessmentDescription:
                    'Students will evaluate existing UI samples using a structured checklist based on usability heuristics and interface design principles. The goal is to familiarize students with identifying issues and articulating UI flaws clearly.',
                hasRubric: false
            },
            {
                id: 'A2',
                tlaName: 'Prototype Usability Test',
                topic: 'Interface Design Principles',
                phase: 'In-Class',
                tlaDescription:
                    'Students conduct usability testing on prototypes, observing user interactions and documenting pain points and successes...',

                assessmentMethod: 'Usability Testing Session',
                assessmentDescription:
                    'Students carry out structured usability tests, record user behavior, summarize findings, and identify key pain points. Observations will be used to propose improvements.',
                hasRubric: false
            },
            {
                id: 'A3',
                tlaName: 'Redesign & Reflection Output',
                topic: 'Interface Design Principles',
                phase: 'Post-Class',
                tlaDescription:
                    'After usability testing, students produce a redesigned version of the interface along with a detailed reflection report...',

                assessmentMethod: 'Redesign Project + Reflection Essay',
                assessmentDescription:
                    'Students improve their UI design based on usability test feedback and submit a reflection explaining all design changes and the reasoning behind them.',
                hasRubric: true,
                rubrics: [
                    { id: 1, criteria: 'Quality of Redesigned Interface', maxScore: '20', weight: '50' },
                    { id: 2, criteria: 'Justification of Design Decisions', maxScore: '10', weight: '30' },
                    { id: 3, criteria: 'Reflection Depth', maxScore: '10', weight: '20' }
                ]
            },
            {
                id: 'A4',
                tlaName: 'User Requirements Review',
                topic: 'User-Centered Design',
                phase: 'Pre-Class',
                tlaDescription:
                    'Students review the collected user requirements and analyze them to ensure clarity and alignment with project goals...',

                assessmentMethod: 'Requirements Analysis Task',
                assessmentDescription:
                    'Students analyze a set of user requirements, verify completeness, identify missing information, and check alignment with user goals and system constraints.',
                hasRubric: false
            },
            {
                id: 'A5',
                tlaName: 'Persona & Scenario Workshop',
                topic: 'User-Centered Design',
                phase: 'In-Class',
                tlaDescription:
                    'Students create detailed personas and scenarios to represent different user types...',

                assessmentMethod: 'Persona & Scenario Creation Activity',
                assessmentDescription:
                    'Students work individually or in groups to create realistic user personas and usage scenarios that reflect actual user needs and behaviors.',
                hasRubric: true,
                rubrics: [
                    { id: 1, criteria: 'Persona Detail & Realism', maxScore: '15', weight: '40' },
                    { id: 2, criteria: 'Scenario Completeness', maxScore: '10', weight: '15' },
                    { id: 3, criteria: 'Correctness', maxScore: '10', weight: '20' },
                    { id: 4, criteria: 'Presentation & Clarity', maxScore: '10', weight: '25' }

                ]
            },
            {
                id: 'A6',
                tlaName: 'Refined User Flow Output',
                topic: 'User-Centered Design',
                phase: 'Post-Class',
                tlaDescription: 'Students document and present a refined user flow that incorporates feedback from previous design iterations. The exercise emphasizes improving navigation, interaction clarity, and overall usability while reflecting on design decisions.',
                assessmentMethod: 'User Flow Refinement Task',
                assessmentDescription: 'Students produce an improved user flow based on collected feedback and usability findings. The submission must clearly highlight changes, demonstrate logical interaction paths, and explain improvements made for usability and user clarity.',
                hasRubric: true,
                rubrics: [
                    { id: 1, criteria: 'Flow Clarity & Structure', maxScore: '15', weight: '40' },
                    { id: 2, criteria: 'Integration of Feedback', maxScore: '10', weight: '35' },
                    { id: 3, criteria: 'Consistency & Accuracy', maxScore: '10', weight: '25' }
                ]
            },
            {
                id: 'A7',
                tlaName: 'Intro to Heuristics Brief',
                topic: 'Usability Principles',
                phase: 'Pre-Class',
                tlaDescription: 'Students read and analyze heuristic evaluation guidelines, learning to identify common usability issues. They prepare notes and examples to apply these principles in subsequent evaluation exercises.',
                assessmentMethod: 'Heuristic Principles Summary',
                assessmentDescription: 'Students create a written brief summarizing key heuristic principles, including interpretations and examples. The output should reflect understanding of usability heuristics and their relevance to interface evaluation.',
                hasRubric: false
            },
            {
                id: 'A8',
                tlaName: 'Heuristic Evaluation Activity',
                topic: 'Usability Principles',
                phase: 'In-Class',
                tlaDescription:
                    'In a collaborative exercise, students perform heuristic evaluations on sample interfaces...',
                assessmentMethod: 'Heuristic Evaluation Submission',
                assessmentDescription:
                    'Students evaluate sample interfaces using standard heuristic principles. They document usability issues, classify them by severity, and propose actionable recommendations.',
                hasRubric: true,
                rubrics: [
                    { id: 1, criteria: 'Correct Identification of Usability Issues', maxScore: '15', weight: '25' },
                    { id: 2, criteria: 'Severity Rating Accuracy', maxScore: '10', weight: '20' },
                    { id: 3, criteria: 'Quality of Recommendations', maxScore: '15', weight: '25' },
                    { id: 4, criteria: 'Clarity & Organization of Report', maxScore: '10', weight: '15' },
                    { id: 5, criteria: 'Application of Heuristic Principles', maxScore: '10', weight: '15' }
                ]
            },
            {
                id: 'A9',
                tlaName: 'Usability Issue Prioritization Report',
                topic: 'Usability Principles',
                phase: 'Post-Class',
                tlaDescription:
                    'Students compile all identified usability issues and prioritize them based on impact...',
                assessmentMethod: 'Issue Prioritization Analysis Report',
                assessmentDescription:
                    'Students document usability issues, categorize them, justify prioritization levels, and propose feasible solutions supported by design reasoning.',
                hasRubric: true,
                rubrics: [
                    { id: 1, criteria: 'Completeness of Identified Issues', maxScore: '10', weight: '15' },
                    { id: 2, criteria: 'Accuracy of Prioritization Logic', maxScore: '15', weight: '25' },
                    { id: 3, criteria: 'Quality & Feasibility of Proposed Solutions', maxScore: '15', weight: '25' },
                    { id: 4, criteria: 'Justification & Critical Reasoning', maxScore: '10', weight: '15' },
                    { id: 5, criteria: 'Report Structure & Organization', maxScore: '5', weight: '10' },
                    { id: 6, criteria: 'Clarity & Professionalism of Writing', maxScore: '5', weight: '10' }
                ]
            }
        ]
    },
]

export const getSyllabusByCode = (code) => syllabiData.find(s => s.code === code);