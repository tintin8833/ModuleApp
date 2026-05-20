import { Router } from 'express';
import {
  listPeriods,
  createPeriod,
  updatePeriod,
  closePeriod,
  reopenPeriod,
  deletePeriod,
} from '../controllers/academicPeriodController.js';

const router = Router();
router.get('/',              listPeriods);
router.post('/',             createPeriod);
router.patch('/:id',         updatePeriod);
router.patch('/:id/close',   closePeriod);
router.patch('/:id/reopen',  reopenPeriod);
router.delete('/:id',        deletePeriod);
export default router;
