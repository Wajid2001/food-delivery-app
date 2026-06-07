import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { AuthRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'quickbite_super_secret_key';

export async function register(req: AuthRequest, res: Response): Promise<void> {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: 'Name, email, and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters long' });
    return;
  }

  // Restrict register to valid roles
  const requestedRole = role || 'customer';
  if (!['customer', 'restaurant'].includes(requestedRole)) {
    res.status(400).json({ message: 'Invalid role selection' });
    return;
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existingUser.rowCount && existingUser.rowCount > 0) {
      res.status(400).json({ message: 'Email is already registered' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const newUserResult = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email.toLowerCase(), hashedPassword, requestedRole]
    );

    const user = newUserResult.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
}

export async function login(req: AuthRequest, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  try {
    // Find user
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userResult.rowCount === 0) {
      res.status(400).json({ message: 'Invalid email or password' });
      return;
    }

    const user = userResult.rows[0];

    // Check if user is blocked
    if (user.is_blocked) {
      res.status(403).json({ message: 'Account is blocked. Please contact support.' });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid email or password' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Exclude password from response user object
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
}

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const userResult = await pool.query(
      'SELECT id, name, email, role, is_blocked, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rowCount === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user: userResult.rows[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
}
