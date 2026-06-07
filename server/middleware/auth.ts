import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'quickbite_super_secret_key';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: 'customer' | 'restaurant' | 'admin';
  };
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authentication token is missing' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      name: string;
      email: string;
      role: 'customer' | 'restaurant' | 'admin';
    };

    // Verify user is not blocked in DB
    const userResult = await pool.query('SELECT is_blocked FROM users WHERE id = $1', [decoded.id]);
    
    if (userResult.rowCount === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (userResult.rows[0].is_blocked) {
      res.status(403).json({ message: 'Account is blocked. Please contact support.' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Token is invalid or expired' });
  }
}

export function requireRole(roles: ('customer' | 'restaurant' | 'admin')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Access denied: insufficient permissions' });
      return;
    }

    next();
  };
}
