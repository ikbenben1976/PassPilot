import db from '../lib/db.js';

/**
 * Remove expired flight cache entries from SQLite.
 */
export function pruneCache(): number {
  const result = db
    .prepare(`DELETE FROM flight_cache WHERE expires_at < datetime('now')`)
    .run();
  return result.changes;
}
