import { Router } from 'express';
import { uploadExcel } from '../middleware/upload.js';
import {
  listConsultants,
  getConsultant,
  createConsultant,
  updateConsultant,
  assignCourse,
  deleteConsultant,
  uploadConsultants,
} from '../controllers/industryConsultantController.js';

const router = Router();
router.get('/',              listConsultants);
router.get('/:id',           getConsultant);
router.post('/',             createConsultant);
router.patch('/:id/assign',  assignCourse);
router.patch('/:id',         updateConsultant);
router.delete('/:id',        deleteConsultant);
router.post('/upload',       uploadExcel.single('file'), uploadConsultants);
export default router;
