import type { Response } from 'express';
import pool from '../config/db';
import type { AuthRequest } from '../middleware/auth';

export async function getAllFoods(req: AuthRequest, res: Response): Promise<void> {
  const { restaurant_id } = req.query;

  try {
    let result;
    if (restaurant_id) {
      result = await pool.query('SELECT * FROM foods WHERE restaurant_id = $1 ORDER BY category, name', [restaurant_id]);
    } else {
      result = await pool.query('SELECT * FROM foods ORDER BY name');
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching foods:', error);
    res.status(500).json({ message: 'Server error fetching foods' });
  }
}

export async function createFood(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { restaurant_id, name, price, image, category, description, is_veg } = req.body;

  if (!restaurant_id || !name || price === undefined || !category) {
    res.status(400).json({ message: 'Restaurant ID, name, price, and category are required' });
    return;
  }

  try {
    // Check if restaurant exists and belongs to owner (unless user is admin)
    const restResult = await pool.query('SELECT owner_id FROM restaurants WHERE id = $1', [restaurant_id]);
    if (restResult.rowCount === 0) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const restaurant = restResult.rows[0];
    if (req.user.role !== 'admin' && restaurant.owner_id !== req.user.id) {
      res.status(403).json({ message: 'Access denied: you do not own this restaurant' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO foods (restaurant_id, name, price, image, category, description, is_veg)
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        restaurant_id,
        name,
        parseFloat(price),
        image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
        category,
        description || '',
        is_veg === true || is_veg === 'true'
      ]
    );

    res.status(201).json({
      message: 'Food item created successfully',
      food: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating food item:', error);
    res.status(500).json({ message: 'Server error creating food item' });
  }
}

export async function updateFood(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params;
  const { name, price, image, category, description, is_veg } = req.body;

  try {
    // Check if food item exists
    const foodResult = await pool.query(
      `SELECT f.*, r.owner_id 
       FROM foods f 
       JOIN restaurants r ON f.restaurant_id = r.id 
       WHERE f.id = $1`,
      [id]
    );

    if (foodResult.rowCount === 0) {
      res.status(404).json({ message: 'Food item not found' });
      return;
    }

    const food = foodResult.rows[0];

    // Check ownership
    if (req.user.role !== 'admin' && food.owner_id !== req.user.id) {
      res.status(403).json({ message: 'Access denied: you do not own the restaurant for this food item' });
      return;
    }

    const updatedResult = await pool.query(
      `UPDATE foods 
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           image = COALESCE($3, image),
           category = COALESCE($4, category),
           description = COALESCE($5, description),
           is_veg = COALESCE($6, is_veg)
       WHERE id = $7 
       RETURNING *`,
      [
        name,
        price !== undefined ? parseFloat(price) : null,
        image,
        category,
        description,
        is_veg !== undefined ? (is_veg === true || is_veg === 'true') : null,
        id
      ]
    );

    res.json({
      message: 'Food item updated successfully',
      food: updatedResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(500).json({ message: 'Server error updating food item' });
  }
}

export async function deleteFood(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params;

  try {
    // Check if food item exists
    const foodResult = await pool.query(
      `SELECT f.*, r.owner_id 
       FROM foods f 
       JOIN restaurants r ON f.restaurant_id = r.id 
       WHERE f.id = $1`,
      [id]
    );

    if (foodResult.rowCount === 0) {
      res.status(404).json({ message: 'Food item not found' });
      return;
    }

    const food = foodResult.rows[0];

    // Check ownership
    if (req.user.role !== 'admin' && food.owner_id !== req.user.id) {
      res.status(403).json({ message: 'Access denied: you do not own the restaurant for this food item' });
      return;
    }

    await pool.query('DELETE FROM foods WHERE id = $1', [id]);

    res.json({ message: 'Food item deleted successfully' });
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({ message: 'Server error deleting food item' });
  }
}
