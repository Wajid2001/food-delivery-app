import type { Response } from 'express';
import pool from '../config/db.js';
import type { AuthRequest } from '../middleware/auth.js';

export async function placeOrder(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { delivery_address, payment_method } = req.body;

  if (!delivery_address) {
    res.status(400).json({ message: 'Delivery address is required' });
    return;
  }

  const client = await pool.connect();

  try {
    // Start transaction
    await client.query('BEGIN');

    // Get user's cart items
    const cartResult = await client.query(
      `SELECT c.quantity, f.id as food_id, f.price, f.restaurant_id
       FROM cart_items c
       JOIN foods f ON c.food_id = f.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );

    if (cartResult.rowCount === 0) {
      await client.query('ROLLBACK');
      res.status(400).json({ message: 'Your cart is empty' });
      return;
    }

    const cartItems = cartResult.rows;
    
    // Ensure all items are from the same restaurant
    const firstRestaurantId = cartItems[0].restaurant_id;
    const allSameRestaurant = cartItems.every(item => item.restaurant_id === firstRestaurantId);

    if (!allSameRestaurant) {
      await client.query('ROLLBACK');
      res.status(400).json({ message: 'All cart items must be from the same restaurant' });
      return;
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of cartItems) {
      totalAmount += parseFloat(item.price) * item.quantity;
    }

    // Insert order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, restaurant_id, total_amount, status, delivery_address, payment_method)
       VALUES ($1, $2, $3, 'Pending', $4, $5)
       RETURNING *`,
      [req.user.id, firstRestaurantId, totalAmount, delivery_address, payment_method || 'Card']
    );

    const order = orderResult.rows[0];

    // Insert order items
    const orderItemsInsertPromises = cartItems.map(item => {
      return client.query(
        `INSERT INTO order_items (order_id, food_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.food_id, item.quantity, item.price]
      );
    });

    await Promise.all(orderItemsInsertPromises);

    // Clear cart
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.id]);

    // Commit transaction
    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Server error placing order' });
  } finally {
    client.release();
  }
}

export async function getOrders(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    let queryText = `
      SELECT o.*, r.name as restaurant_name, r.image as restaurant_image, u.name as customer_name,
             (SELECT COALESCE(json_agg(json_build_object(
                'id', oi.id,
                'food_id', oi.food_id,
                'quantity', oi.quantity,
                'price', oi.price,
                'food_name', f.name,
                'food_image', f.image
              )), '[]'::json)
              FROM order_items oi
              LEFT JOIN foods f ON oi.food_id = f.id
              WHERE oi.order_id = o.id) as items
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      JOIN users u ON o.user_id = u.id
    `;
    
    const queryParams: any[] = [];

    if (req.user.role === 'customer') {
      queryParams.push(req.user.id);
      queryText += ` WHERE o.user_id = $${queryParams.length}`;
    } else if (req.user.role === 'restaurant') {
      queryParams.push(req.user.id);
      queryText += ` WHERE r.owner_id = $${queryParams.length}`;
    } else if (req.user.role === 'admin') {
      // Admin gets all orders, no WHERE filter needed
    }

    queryText += ` ORDER BY o.created_at DESC`;

    const result = await pool.query(queryText, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error fetching orders' });
  }
}

export async function updateOrderStatus(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Preparing', 'Out for delivery', 'Delivered', 'Rejected'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  try {
    // Check order and ownership
    const orderResult = await pool.query(
      `SELECT o.*, r.owner_id 
       FROM orders o
       JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rowCount === 0) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    const order = orderResult.rows[0];

    if (req.user.role !== 'admin' && order.owner_id !== req.user.id) {
      res.status(403).json({ message: 'Access denied: you do not own the restaurant for this order' });
      return;
    }

    const updatedResult = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json({
      message: 'Order status updated successfully',
      order: updatedResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error updating order status' });
  }
}
