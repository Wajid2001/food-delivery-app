import { Router } from 'express';
import { 
  getAllRestaurants, 
  getRestaurantById, 
  createRestaurant, 
  updateRestaurant, 
  deleteRestaurant,
  addReview
} from '../controllers/restaurantController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', getAllRestaurants as any);
router.get('/:id', getRestaurantById as any);
router.post('/', authenticateToken as any, requireRole(['restaurant', 'admin']) as any, createRestaurant as any);
router.put('/:id', authenticateToken as any, requireRole(['restaurant', 'admin']) as any, updateRestaurant as any);
router.delete('/:id', authenticateToken as any, requireRole(['restaurant', 'admin']) as any, deleteRestaurant as any);
router.post('/:id/reviews', authenticateToken as any, addReview as any);

export default router;
