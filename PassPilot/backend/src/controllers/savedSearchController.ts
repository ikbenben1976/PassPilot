import type { Response } from 'express';
import db, { generateId } from '../lib/db.js';
import type { AuthenticatedRequest, SavedSearchRow } from '../types/index.js';

/**
 * GET /api/saved-searches
 */
export const listSavedSearches = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.id;

    const rows = db
      .prepare('SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as SavedSearchRow[];

    const searches = rows.map(formatSavedSearch);
    res.json({ searches });
  } catch (error) {
    console.error('List saved searches error:', error);
    res.status(500).json({ error: 'Failed to load saved searches' });
  }
};

/**
 * POST /api/saved-searches
 */
export const createSavedSearch = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { name, params, alertEnabled } = req.body;

    if (!name || !params) {
      res.status(400).json({ error: 'Name and search params are required' });
      return;
    }

    const id = generateId();
    db.prepare(
      `INSERT INTO saved_searches (id, user_id, name, params, alert_enabled)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(id, userId, name, JSON.stringify(params), alertEnabled ? 1 : 0);

    const row = db.prepare('SELECT * FROM saved_searches WHERE id = ?').get(id) as SavedSearchRow;
    res.status(201).json({ search: formatSavedSearch(row) });
  } catch (error) {
    console.error('Create saved search error:', error);
    res.status(500).json({ error: 'Failed to create saved search' });
  }
};

/**
 * DELETE /api/saved-searches/:id
 */
export const deleteSavedSearch = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const result = db
      .prepare('DELETE FROM saved_searches WHERE id = ? AND user_id = ?')
      .run(id, userId);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Saved search not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete saved search error:', error);
    res.status(500).json({ error: 'Failed to delete saved search' });
  }
};

function formatSavedSearch(row: SavedSearchRow) {
  return {
    id: row.id,
    name: row.name,
    params: JSON.parse(row.params),
    alertEnabled: Boolean(row.alert_enabled),
    lastChecked: row.last_checked,
    newResults: row.new_results,
    createdAt: row.created_at,
  };
}
