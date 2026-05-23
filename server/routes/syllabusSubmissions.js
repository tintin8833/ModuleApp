/**
 * Syllabus submission routes — /api/syllabus-submissions
 * Read endpoints require any authenticated user; create is admin/OVPAA.
 */
import { Router } from 'express';
import { makeSubmissionController } from '../controllers/submissionController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const ctrl = makeSubmissionController('SyllabusSubmission');

router.use(requireAuth);

router.get('/summary', ctrl.summary);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', requireRole('admin', 'ovpaa'), ctrl.create);

export default router;
