import { Router } from 'express';
import { uploadExcel } from '../middleware/upload.js';
import {
  listCourseAssignments,
  getCourseAssignment,
  createCourseAssignment,
  updateCourseAssignment,
  deleteCourseAssignment,
  uploadCourseAssignments,
} from '../controllers/courseAssignmentController.js';

const router = Router();
router.get('/',         listCourseAssignments);
router.get('/:id',      getCourseAssignment);
router.post('/',        createCourseAssignment);
router.patch('/:id',    updateCourseAssignment);
router.delete('/:id',   deleteCourseAssignment);
router.post('/upload',  uploadExcel.single('file'), uploadCourseAssignments);
export default router;
