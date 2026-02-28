import db from '../lib/db.js';
import { getPipeline } from '../services/frontier/index.js';

interface MonitoredAirport {
  code: string;
  priority: number;
  last_refreshed: string | null;
  refresh_interval_minutes: number;
  active: number;
}

/**
 * Refresh flight data for all monitored airports.
 *
 * Airports are prioritized by:
 * 1. Highest priority value (set based on member home airports)
 * 2. Stalest data (longest time since last refresh)
 *
 * The job fetches "search everywhere from origin" for tomorrow's date
 * (the primary use case for GoWild — booking 1 day ahead).
 */
export async function refreshFlights(): Promise<{
  airportsRefreshed: number;
  totalFetched: number;
  totalPersisted: number;
}> {
  const pipeline = getPipeline();

  // Get airports that need refreshing
  const airports = db
    .prepare(
      `SELECT * FROM monitored_airports
       WHERE active = 1
       AND (
         last_refreshed IS NULL
         OR datetime(last_refreshed, '+' || refresh_interval_minutes || ' minutes') < datetime('now')
       )
       ORDER BY priority DESC, last_refreshed ASC
       LIMIT 10`,
    )
    .all() as MonitoredAirport[];

  if (airports.length === 0) return { airportsRefreshed: 0, totalFetched: 0, totalPersisted: 0 };

  // Tomorrow's date (GoWild books 1 day ahead for domestic)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0]!;

  let totalFetched = 0;
  let totalPersisted = 0;

  for (const airport of airports) {
    try {
      const result = await pipeline.refreshOrigin(airport.code, dateStr);
      totalFetched += result.fetched;
      totalPersisted += result.persisted;

      // Update last_refreshed timestamp
      db.prepare(
        `UPDATE monitored_airports SET last_refreshed = datetime('now') WHERE code = ?`,
      ).run(airport.code);
    } catch (err) {
      console.error(`[RefreshFlights] Failed for ${airport.code}:`, err);
    }
  }

  return { airportsRefreshed: airports.length, totalFetched, totalPersisted };
}

/**
 * Update airport monitoring priorities based on member home airports.
 * Called periodically to ensure popular airports are refreshed more often.
 */
export function updateAirportPriorities(): void {
  // Count how many users have each airport as their home
  const counts = db
    .prepare(
      `SELECT home_airport_code as code, COUNT(*) as user_count
       FROM users
       WHERE home_airport_code IS NOT NULL
       GROUP BY home_airport_code`,
    )
    .all() as { code: string; user_count: number }[];

  const upsert = db.prepare(
    `INSERT INTO monitored_airports (code, priority, refresh_interval_minutes, active)
     VALUES (?, ?, ?, 1)
     ON CONFLICT(code) DO UPDATE SET priority = excluded.priority, refresh_interval_minutes = excluded.refresh_interval_minutes`,
  );

  const updateMany = db.transaction(() => {
    for (const { code, user_count } of counts) {
      // More users = higher priority, shorter refresh interval
      const priority = user_count;
      const refreshInterval = user_count >= 10 ? 15 : user_count >= 5 ? 20 : 30;
      upsert.run(code, priority, refreshInterval);
    }
  });

  updateMany();
}
