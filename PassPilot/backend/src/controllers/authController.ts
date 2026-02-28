import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import db, { generateId } from '../lib/db.js';
import { signToken } from '../middleware/auth.js';
import type { AuthenticatedRequest, UserRow, SubscriptionRow } from '../types/index.js';

/**
 * POST /api/auth/signup
 */
export const signup = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check for existing user
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const userId = generateId();
    const passwordHash = bcrypt.hashSync(password, 10);

    // Create user
    db.prepare(
      `INSERT INTO users (id, email, password_hash, name)
       VALUES (?, ?, ?, ?)`,
    ).run(userId, email.toLowerCase(), passwordHash, name);

    // Create trial subscription (7 days)
    const subId = generateId();
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(
      `INSERT INTO subscriptions (id, user_id, plan, status, current_period_end)
       VALUES (?, ?, 'monthly', 'trialing', ?)`,
    ).run(subId, userId, trialEnd);

    const token = signToken({ id: userId, email: email.toLowerCase() });
    const user = formatUser(userId);

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

/**
 * POST /api/auth/login
 */
export const login = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const row = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.toLowerCase()) as UserRow | undefined;

    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken({ id: row.id, email: row.email });
    const user = formatUser(row.id);

    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
};

/**
 * GET /api/auth/me
 */
export const me = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = formatUser(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUser(userId: string) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!row) return null;

  const sub = db
    .prepare('SELECT * FROM subscriptions WHERE user_id = ?')
    .get(userId) as SubscriptionRow | undefined;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    homeAirport: row.home_airport_code,
    subscription: sub
      ? {
          id: sub.id,
          plan: sub.plan,
          status: sub.status,
          currentPeriodEnd: sub.current_period_end,
          cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
        }
      : null,
    createdAt: row.created_at,
    preferences: {
      homeAirportCode: row.home_airport_code,
      favoriteDestinations: JSON.parse(row.favorite_destinations || '[]'),
      priceAlerts: Boolean(row.price_alerts_enabled),
      emailDigest: row.email_digest,
      darkMode: Boolean(row.dark_mode),
    },
  };
}
