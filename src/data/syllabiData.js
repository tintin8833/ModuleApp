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
        ]

    },
]

export const getSyllabusByCode = (code) => syllabiData.find(s => s.code === code);