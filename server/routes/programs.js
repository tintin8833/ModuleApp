import { Router } from 'express';
import { uploadExcel } from '../middleware/upload.js';
import {
  listPrograms,
  getProgram,
  createProgram,
  updateProgram,
  deleteProgram,
  uploadPrograms,
} from '../controllers/programController.js';

const router = Router();
router.get('/',        listPrograms);
router.get('/:id',     getProgram);
router.post('/',       createProgram);
router.patch('/:id',   updateProgram);
router.delete('/:id',  deleteProgram);
router.post('/upload', uploadExcel.single('file'), uploadPrograms);
export default router;
