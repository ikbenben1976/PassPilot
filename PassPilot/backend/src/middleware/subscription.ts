import type { Response, NextFunction } from 'express';
import db from '../lib/db.js';
import type { AuthenticatedRequest, SubscriptionRow } from '../types/index.js';

/**
 * Require an active subscription (active or trialing).
 * Must be used AFTER requireAuth middleware.
 *
 * Returns 403 if user has no active subscription.
 */
export function requireSubscription(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const sub = db
    .prepare(
      `SELECT * FROM subscriptions
       WHERE user_id = ? AND status IN ('active', 'trialing')
       AND current_period_end > datetime('now')`,
    )
    .get(userId) as SubscriptionRow | undefined;

  if (!sub) {
    res.status(403).json({
      error: 'Active subscription required',
      code: 'SUBSCRIPTION_REQUIRED',
    });
    return;
  }

  next();
}
