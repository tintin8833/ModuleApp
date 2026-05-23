/**
 * Auth routes — /api/auth
 *   POST /login  — exchange email + password for a JWT
 *   GET  /me     — current user (requires Bearer token)
 */
import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', requireAuth, me);

export default router;
