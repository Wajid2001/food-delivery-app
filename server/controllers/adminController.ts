import type { Response } from 'express';
import pool from '../config/db.js';
import type { AuthRequest } from '../middleware/auth.js';

export async function getStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const usersCountPromise = pool.query("SELECT COUNT(*) FROM users WHERE role != 'admin'");
    const restaurantsCountPromise = pool.query("SELECT COUNT(*) FROM restaurants");
    const ordersCountPromise = pool.query("SELECT COUNT(*) FROM orders");
    
    // Revenue from completed orders
    const revenuePromise = pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'Delivered'");
    
    // Recent orders
    const recentOrdersPromise = pool.query(
      `SELECT o.id, o.total_amount, o.status, o.created_at, u.name as customer_name, r.name as restaurant_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN restaurants r ON o.restaurant_id = r.id
       ORDER BY o.created_at DESC
       LIMIT 5`
    );

    const [
      usersCount,
      restaurantsCount,
      ordersCount,
      revenueResult,
      recentOrders
    ] = await Promise.all([
      usersCountPromise,
      restaurantsCountPromise,
      ordersCountPromise,
      revenuePromise,
      recentOrdersPromise
    ]);

    res.json({
      totalUsers: parseInt(usersCount.rows[0].count),
      totalRestaurants: parseInt(restaurantsCount.rows[0].count),
      totalOrders: parseInt(ordersCount.rows[0].count),
      totalRevenue: parseFloat(revenueResult.rows[0].total),
      recentOrders: recentOrders.rows
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
}

export async function getAllUsers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role, is_blocked, created_at FROM users WHERE role != 'admin' ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
}

export async function toggleUserBlock(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { is_blocked } = req.body;

  if (is_blocked === undefined) {
    res.status(400).json({ message: 'is_blocked status is required' });
    return;
  }

  try {
    // Check if user exists
    const userCheck = await pool.query('SELECT id, role FROM users WHERE id = $1', [id]);
    if (userCheck.rowCount === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (userCheck.rows[0].role === 'admin') {
      res.status(400).json({ message: 'Cannot block/unblock admin accounts' });
      return;
    }

    const result = await pool.query(
      'UPDATE users SET is_blocked = $1 WHERE id = $2 RETURNING id, name, email, role, is_blocked',
      [is_blocked === true || is_blocked === 'true', id]
    );

    res.json({
      message: `User account ${is_blocked ? 'blocked' : 'unblocked'} successfully`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error toggling user block status:', error);
    res.status(500).json({ message: 'Server error updating user block status' });
  }
}
