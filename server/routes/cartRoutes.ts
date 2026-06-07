import { Router } from 'express';
import { getCart, addToCart, deleteCartItem } from '../controllers/cartController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateToken as any, getCart as any);
router.post('/add', authenticateToken as any, addToCart as any);
router.delete('/:id', authenticateToken as any, deleteCartItem as any);

export default router;
