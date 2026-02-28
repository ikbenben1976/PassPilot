import type { Response } from 'express';
import db, { generateId } from '../lib/db.js';
import type { AuthenticatedRequest, PriceAlertRow } from '../types/index.js';

/**
 * GET /api/alerts
 */
export const listAlerts = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.id;

    const rows = db
      .prepare('SELECT * FROM price_alerts WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as PriceAlertRow[];

    const alerts = rows.map(formatAlert);
    res.json({ alerts });
  } catch (error) {
    console.error('List alerts error:', error);
    res.status(500).json({ error: 'Failed to load alerts' });
  }
};

/**
 * POST /api/alerts
 */
export const createAlert = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { origin, destination, targetPrice } = req.body;

    if (!origin || !destination || targetPrice == null) {
      res.status(400).json({ error: 'Origin, destination, and target price are required' });
      return;
    }

    // Check for duplicate
    const existing = db
      .prepare(
        'SELECT id FROM price_alerts WHERE user_id = ? AND origin = ? AND destination = ?',
      )
      .get(userId, origin, destination);

    if (existing) {
      res.status(409).json({ error: 'Alert already exists for this route' });
      return;
    }

    // Get current lowest price for this route
    const currentRow = db
      .prepare(
        `SELECT MIN(price) as lowest FROM flight_cache
         WHERE origin = ? AND destination = ? AND expires_at > datetime('now')`,
      )
      .get(origin, destination) as { lowest: number | null } | undefined;

    const id = generateId();
    db.prepare(
      `INSERT INTO price_alerts (id, user_id, origin, destination, target_price, current_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, userId, origin, destination, targetPrice, currentRow?.lowest ?? 0);

    const row = db.prepare('SELECT * FROM price_alerts WHERE id = ?').get(id) as PriceAlertRow;
    res.status(201).json({ alert: formatAlert(row) });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
};

/**
 * DELETE /api/alerts/:id
 */
export const deleteAlert = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = db
      .prepare('DELETE FROM price_alerts WHERE id = ? AND user_id = ?')
      .run(id, userId);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
};

function formatAlert(row: PriceAlertRow) {
  return {
    id: row.id,
    route: { origin: row.origin, destination: row.destination },
    targetPrice: row.target_price,
    currentPrice: row.current_price,
    triggered: Boolean(row.triggered),
    createdAt: row.created_at,
  };
}
