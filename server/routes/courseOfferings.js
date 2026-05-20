import { Router } from 'express';
import { uploadExcel } from '../middleware/upload.js';
import {
  listCourseOfferings,
  getCourseOffering,
  createCourseOffering,
  updateCourseOffering,
  assignInstructor,
  deleteCourseOffering,
  uploadCourseOfferings,
} from '../controllers/courseOfferingController.js';

const router = Router();
router.get('/',             listCourseOfferings);
router.get('/:id',          getCourseOffering);
router.post('/',            createCourseOffering);
// The narrow /:id/assign route must come before the broader /:id PATCH
// so it doesn't get swallowed by the generic edit handler.
router.patch('/:id/assign', assignInstructor);
router.patch('/:id',        updateCourseOffering);
router.delete('/:id',       deleteCourseOffering);
router.post('/upload',      uploadExcel.single('file'), uploadCourseOfferings);
export default router;
