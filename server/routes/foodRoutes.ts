import { Router } from 'express';
import { getAllFoods, createFood, updateFood, deleteFood } from '../controllers/foodController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllFoods as any);
router.post('/', authenticateToken as any, requireRole(['restaurant', 'admin']) as any, createFood as any);
router.put('/:id', authenticateToken as any, requireRole(['restaurant', 'admin']) as any, updateFood as any);
router.delete('/:id', authenticateToken as any, requireRole(['restaurant', 'admin']) as any, deleteFood as any);

export default router;
