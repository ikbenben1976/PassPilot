import type { Response } from 'express';
import db, { generateId } from '../lib/db.js';
import type { AuthenticatedRequest, NotificationRow } from '../types/index.js';

/**
 * GET /api/notifications
 */
export const listNotifications = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.id;

    const rows = db
      .prepare(
        `SELECT * FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50`,
      )
      .all(userId) as NotificationRow[];

    const notifications = rows.map(formatNotification);
    res.json({ notifications });
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
export const markRead = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = db
      .prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?')
      .run(id, userId);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

/**
 * Create a notification for a user (internal helper, not an endpoint).
 */
export function createNotification(
  userId: string,
  type: NotificationRow['type'],
  title: string,
  message: string,
  actionUrl?: string,
): void {
  db.prepare(
    `INSERT INTO notifications (id, user_id, type, title, message, action_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(generateId(), userId, type, title, message, actionUrl ?? null);
}

function formatNotification(row: NotificationRow) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: Boolean(row.read),
    createdAt: row.created_at,
    actionUrl: row.action_url,
  };
}
