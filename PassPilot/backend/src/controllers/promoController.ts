import type { Request, Response } from 'express';
import db, { generateId } from '../lib/db.js';
import type { PromoRedemptionRow } from '../types/index.js';

const TRIAL_HOURS = 24;

/**
 * POST /api/promo/redeem
 *
 * Redeem a free 1-day promotional trial.
 * Both email and IP address must be unique (not previously used).
 */
export const redeemPromo = (req: Request, res: Response): void => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Get client IP (trust X-Forwarded-For behind proxy)
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    // Check if email already used
    const existingEmail = db
      .prepare('SELECT id FROM promo_redemptions WHERE email = ?')
      .get(normalizedEmail) as PromoRedemptionRow | undefined;

    if (existingEmail) {
      res.status(409).json({ error: 'This email has already been used for a free trial' });
      return;
    }

    // Check if IP already used
    const existingIp = db
      .prepare('SELECT id FROM promo_redemptions WHERE ip_address = ?')
      .get(ip) as PromoRedemptionRow | undefined;

    if (existingIp) {
      res.status(409).json({ error: 'A free trial has already been redeemed from this network' });
      return;
    }

    // Calculate expiry
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TRIAL_HOURS * 60 * 60 * 1000);

    // Create redemption record
    const id = generateId();
    db.prepare(
      `INSERT INTO promo_redemptions (id, email, ip_address, redeemed_at, expires_at)
       VALUES (?, ?, ?, datetime('now'), ?)`,
    ).run(id, normalizedEmail, ip, expiresAt.toISOString());

    res.status(201).json({
      success: true,
      trial: {
        id,
        email: normalizedEmail,
        expiresAt: expiresAt.toISOString(),
        durationHours: TRIAL_HOURS,
      },
    });
  } catch (error) {
    console.error('Promo redemption error:', error);
    res.status(500).json({ error: 'Failed to redeem promotional trial' });
  }
};

/**
 * GET /api/promo/check?email=...
 *
 * Check if a promo trial is still active for a given email.
 */
export const checkPromo = (req: Request, res: Response): void => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email) {
      res.status(400).json({ error: 'Email query parameter is required' });
      return;
    }

    const redemption = db
      .prepare('SELECT * FROM promo_redemptions WHERE email = ?')
      .get(email) as PromoRedemptionRow | undefined;

    if (!redemption) {
      res.json({ active: false, redeemed: false });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(redemption.expires_at);
    const active = now < expiresAt;

    res.json({
      active,
      redeemed: true,
      expiresAt: redemption.expires_at,
    });
  } catch (error) {
    console.error('Promo check error:', error);
    res.status(500).json({ error: 'Failed to check promo status' });
  }
};
