import { Router } from 'express';
import { getStats, getAllUsers, toggleUserBlock } from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken as any);
router.use(requireRole(['admin']) as any);

router.get('/stats', getStats as any);
router.get('/users', getAllUsers as any);
router.put('/users/:id/block', toggleUserBlock as any);

export default router;
