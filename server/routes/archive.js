/**
 * Archive routes — cross-period list of every archived record.
 * Mounted at /api/archive (not period-scoped).
 */
import { Router } from 'express';
import { getArchive } from '../controllers/archiveController.js';

const router = Router();

router.get('/', getArchive);

export default router;
