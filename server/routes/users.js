/**
 * User routes — /api/users (admin only).
 */
import { Router } from 'express';
import { listUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
