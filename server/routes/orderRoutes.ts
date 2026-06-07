import { Router } from 'express';
import { placeOrder, getOrders, updateOrderStatus } from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/', authenticateToken as any, placeOrder as any);
router.get('/', authenticateToken as any, getOrders as any);
router.put('/:id/status', authenticateToken as any, updateOrderStatus as any);

export default router;
