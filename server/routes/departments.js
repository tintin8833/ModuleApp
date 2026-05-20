import { Router } from 'express';
import { uploadExcel } from '../middleware/upload.js';
import {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  unlistMany,
  deleteDepartment,
  uploadDepartments,
} from '../controllers/departmentController.js';

const router = Router();

router.get('/',             listDepartments);
router.post('/',            createDepartment);
// PATCH /unlist must come before /:id so :id doesn't swallow "unlist".
router.patch('/unlist',     unlistMany);
router.get('/:id',          getDepartment);
router.patch('/:id',        updateDepartment);
router.delete('/:id',       deleteDepartment);
router.post('/upload',      uploadExcel.single('file'), uploadDepartments);

export default router;
