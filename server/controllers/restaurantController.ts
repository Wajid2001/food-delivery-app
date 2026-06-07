import type { Response } from 'express';
import pool from '../config/db';
import type { AuthRequest } from '../middleware/auth';

export async function getAllRestaurants(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { search, is_veg, rating, distance, price_range } = req.query;

    let queryText = 'SELECT * FROM restaurants WHERE 1=1';
    const queryParams: any[] = [];

    if (search) {
      queryParams.push(`%${search}%`);
      queryText += ` AND (name ILIKE $${queryParams.length} OR cuisine ILIKE $${queryParams.length})`;
    }

    if (is_veg === 'true') {
      queryText += ` AND is_veg = true`;
    }

    if (rating) {
      queryParams.push(parseFloat(rating as string));
      queryText += ` AND rating >= $${queryParams.length}`;
    }

    if (distance) {
      queryParams.push(parseFloat(distance as string));
      queryText += ` AND distance <= $${queryParams.length}`;
    }

    if (price_range) {
      queryParams.push(price_range);
      queryText += ` AND price_range = $${queryParams.length}`;
    }

    queryText += ' ORDER BY rating DESC, name ASC';

    const result = await pool.query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Server error fetching restaurants' });
  }
}

export async function getRestaurantById(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    // Run queries in parallel for efficiency
    const restaurantPromise = pool.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    const foodsPromise = pool.query('SELECT * FROM foods WHERE restaurant_id = $1 ORDER BY category, name', [id]);
    const reviewsPromise = pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.restaurant_id = $1 
       ORDER BY r.created_at DESC`,
      [id]
    );

    const [restaurantResult, foodsResult, reviewsResult] = await Promise.all([
      restaurantPromise,
      foodsPromise,
      reviewsPromise
    ]);

    if (restaurantResult.rowCount === 0) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const restaurant = restaurantResult.rows[0];
    const foods = foodsResult.rows;
    const reviews = reviewsResult.rows;

    res.json({
      ...restaurant,
      foods,
      reviews
    });
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    res.status(500).json({ message: 'Server error fetching restaurant details' });
  }
}

export async function createRestaurant(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  // Only restaurant owner or admin can create restaurant
  const { name, image, address, cuisine, distance, delivery_time, price_range, is_veg, owner_id } = req.body;

  if (!name || !address) {
    res.status(400).json({ message: 'Name and address are required' });
    return;
  }

  // If role is restaurant, they are the owner. If admin, they can set owner_id or default to their own.
  let owner = req.user.id;
  if (req.user.role === 'admin' && owner_id) {
    owner = parseInt(owner_id);
  }

  try {
    const result = await pool.query(
      `INSERT INTO restaurants (name, image, address, owner_id, cuisine, distance, delivery_time, price_range, is_veg)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        name,
        image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60',
        address,
        owner,
        cuisine || 'General',
        distance ? parseFloat(distance) : 1.0,
        delivery_time ? parseInt(delivery_time) : 30,
        price_range || '$$',
        is_veg === true || is_veg === 'true'
      ]
    );

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ message: 'Server error creating restaurant' });
  }
}

export async function updateRestaurant(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params;
  const { name, image, address, cuisine, distance, delivery_time, price_range, is_veg } = req.body;

  try {
    // Check if restaurant exists
    const restResult = await pool.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    if (restResult.rowCount === 0) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const restaurant = restResult.rows[0];

    // Check ownership
    if (req.user.role !== 'admin' && restaurant.owner_id !== req.user.id) {
      res.status(403).json({ message: 'Access denied: you do not own this restaurant' });
      return;
    }

    const updatedResult = await pool.query(
      `UPDATE restaurants 
       SET name = COALESCE($1, name),
           image = COALESCE($2, image),
           address = COALESCE($3, address),
           cuisine = COALESCE($4, cuisine),
           distance = COALESCE($5, distance),
           delivery_time = COALESCE($6, delivery_time),
           price_range = COALESCE($7, price_range),
           is_veg = COALESCE($8, is_veg)
       WHERE id = $9 
       RETURNING *`,
      [
        name,
        image,
        address,
        cuisine,
        distance ? parseFloat(distance) : null,
        delivery_time ? parseInt(delivery_time) : null,
        price_range,
        is_veg !== undefined ? (is_veg === true || is_veg === 'true') : null,
        id
      ]
    );

    res.json({
      message: 'Restaurant updated successfully',
      restaurant: updatedResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ message: 'Server error updating restaurant' });
  }
}

export async function deleteRestaurant(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params;

  try {
    // Check if restaurant exists
    const restResult = await pool.query('SELECT * FROM restaurants WHERE id = $1', [id]);
    if (restResult.rowCount === 0) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    const restaurant = restResult.rows[0];

    // Check ownership
    if (req.user.role !== 'admin' && restaurant.owner_id !== req.user.id) {
      res.status(403).json({ message: 'Access denied: you do not own this restaurant' });
      return;
    }

    await pool.query('DELETE FROM restaurants WHERE id = $1', [id]);

    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ message: 'Server error deleting restaurant' });
  }
}

// Add a review
export async function addReview(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id: restaurant_id } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ message: 'Rating is required and must be between 1 and 5' });
    return;
  }

  try {
    // Check if restaurant exists
    const restCheck = await pool.query('SELECT id FROM restaurants WHERE id = $1', [restaurant_id]);
    if (restCheck.rowCount === 0) {
      res.status(404).json({ message: 'Restaurant not found' });
      return;
    }

    // Insert review
    await pool.query(
      'INSERT INTO reviews (user_id, restaurant_id, rating, comment) VALUES ($1, $2, $3, $4)',
      [req.user.id, restaurant_id, parseInt(rating), comment || '']
    );

    // Update restaurant's overall rating
    await pool.query(
      `UPDATE restaurants r
       SET rating = (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE restaurant_id = r.id)
       WHERE id = $1`,
      [restaurant_id]
    );

    res.status(201).json({ message: 'Review added successfully' });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server error adding review' });
  }
}
