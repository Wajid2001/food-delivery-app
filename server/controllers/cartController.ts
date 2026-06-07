import type { Response } from 'express';
import pool from '../config/db';
import type { AuthRequest } from '../middleware/auth';

export async function getCart(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT c.id, c.food_id, c.quantity, 
              f.name as food_name, f.price, f.image, f.restaurant_id,
              r.name as restaurant_name
       FROM cart_items c
       JOIN foods f ON c.food_id = f.id
       JOIN restaurants r ON f.restaurant_id = r.id
       WHERE c.user_id = $1
       ORDER BY c.id`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error fetching cart' });
  }
}

export async function addToCart(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { food_id, quantity, replace } = req.body;

  if (!food_id) {
    res.status(400).json({ message: 'Food ID is required' });
    return;
  }

  const parsedQty = parseInt(quantity);
  const qty = isNaN(parsedQty) ? 1 : parsedQty;

  try {
    // Check if food exists
    const foodCheck = await pool.query('SELECT id FROM foods WHERE id = $1', [food_id]);
    if (foodCheck.rowCount === 0) {
      res.status(404).json({ message: 'Food item not found' });
      return;
    }

    // Check if item already in cart
    const existing = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND food_id = $2',
      [req.user.id, food_id]
    );

    let result;
    if (existing.rowCount && existing.rowCount > 0) {
      const newQty = replace ? qty : (existing.rows[0].quantity + qty);
      
      if (newQty <= 0) {
        // Remove item if quantity goes to 0 or less
        await pool.query('DELETE FROM cart_items WHERE id = $1', [existing.rows[0].id]);
        res.json({ message: 'Item removed from cart' });
        return;
      }

      result = await pool.query(
        'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *',
        [newQty, existing.rows[0].id]
      );
    } else {
      if (qty <= 0) {
        res.status(400).json({ message: 'Quantity must be greater than 0' });
        return;
      }
      result = await pool.query(
        'INSERT INTO cart_items (user_id, food_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [req.user.id, food_id, qty]
      );
    }

    res.json({
      message: 'Cart updated successfully',
      cartItem: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error updating cart' });
  }
}

export async function deleteCartItem(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params;

  try {
    // Check if cart item exists and belongs to user
    const existing = await pool.query('SELECT id, user_id FROM cart_items WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      res.status(404).json({ message: 'Cart item not found' });
      return;
    }

    if (existing.rows[0].user_id !== req.user.id) {
      res.status(403).json({ message: 'Access denied: this is not your cart item' });
      return;
    }

    await pool.query('DELETE FROM cart_items WHERE id = $1', [id]);
    res.json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    res.status(500).json({ message: 'Server error deleting cart item' });
  }
}
