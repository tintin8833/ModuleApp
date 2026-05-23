/**
 * Root router. Everything under /api/* is mounted here so the
 * Express entry point (index.js) stays a one-liner.
 */
import { Router } from 'express';
import departments       from './departments.js';
import faculty           from './faculty.js';
import programs          from './programs.js';
import courseOfferings   from './courseOfferings.js';
import industryConsultants from './industryConsultants.js';
import academicPeriods   from './academicPeriods.js';
import courseAssignments from './courseAssignments.js';
import archive           from './archive.js';
import auth              from './auth.js';
import users            from './users.js';
import syllabusSubmissions from './syllabusSubmissions.js';
import tosSubmissions   from './tosSubmissions.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

router.use('/auth',                auth);
router.use('/users',               users);
router.use('/syllabus-submissions', syllabusSubmissions);
router.use('/tos-submissions',     tosSubmissions);
router.use('/academic-periods',    academicPeriods);
router.use('/departments',         departments);
router.use('/faculty',             faculty);
router.use('/programs',            programs);
router.use('/course-offerings',    courseOfferings);
router.use('/industry-consultants', industryConsultants);
router.use('/course-assignments',  courseAssignments);
router.use('/archive',             archive);

export default router;
