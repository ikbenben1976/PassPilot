import cron from 'node-cron';
import { refreshFlights, seedAllAirports, updateAirportPriorities } from './refreshFlights.js';
import { checkAlerts } from './checkAlerts.js';
import { pruneCache } from './pruneCache.js';
import { flightCache, calendarCache, destCache } from '../lib/cache.js';

/**
 * Background Job Scheduler
 *
 * Manages periodic tasks that keep the data pipeline fresh:
 *
 * 1. Flight Refresh (every 15 min)
 *    - Refreshes flight data for monitored airports
 *    - Prioritizes high-traffic origins
 *
 * 2. Alert Checker (every 5 min)
 *    - Scans price alerts for triggered conditions
 *    - Creates notifications for price drops
 *
 * 3. Cache Pruning (every hour)
 *    - Removes expired entries from SQLite flight_cache
 *    - Prunes in-memory caches
 *
 * All jobs are idempotent and safe to run concurrently.
 */

let initialized = false;

export function startScheduler(): void {
  if (initialized) return;
  initialized = true;

  console.log('[Scheduler] Starting background jobs...');

  // Seed all Frontier airports into monitored_airports on startup
  try {
    const inserted = seedAllAirports();
    if (inserted > 0) {
      console.log(`[Scheduler] Seeded ${inserted} Frontier airports for monitoring`);
    }
    // Boost priority for airports where users are concentrated
    updateAirportPriorities();
    console.log('[Scheduler] Airport monitoring initialized');
  } catch (err) {
    console.error('[Scheduler] Failed to initialize airport monitoring:', err);
  }

  // Update airport priorities every 30 minutes (picks up new user registrations)
  cron.schedule('*/30 * * * *', () => {
    try {
      updateAirportPriorities();
    } catch (err) {
      console.error('[Scheduler] Failed to update airport priorities:', err);
    }
  });

  // Refresh flight data every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Scheduler] Running flight refresh...');
    try {
      const result = await refreshFlights();
      console.log(`[Scheduler] Flight refresh complete: ${result.totalFetched} fetched, ${result.totalPersisted} persisted, ${result.airportsRefreshed} airports`);
    } catch (err) {
      console.error('[Scheduler] Flight refresh failed:', err);
    }
  });

  // Check price alerts every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const result = await checkAlerts();
      if (result.triggered > 0) {
        console.log(`[Scheduler] Alert check: ${result.triggered} alerts triggered out of ${result.checked}`);
      }
    } catch (err) {
      console.error('[Scheduler] Alert check failed:', err);
    }
  });

  // Prune expired cache entries every hour
  cron.schedule('0 * * * *', () => {
    try {
      const dbPruned = pruneCache();
      const memPruned =
        flightCache.prune() +
        calendarCache.prune() +
        destCache.prune();

      if (dbPruned > 0 || memPruned > 0) {
        console.log(`[Scheduler] Cache pruned: ${dbPruned} DB rows, ${memPruned} memory entries`);
      }
    } catch (err) {
      console.error('[Scheduler] Cache prune failed:', err);
    }
  });

  console.log('[Scheduler] Jobs scheduled:');
  console.log('  - Airport priorities: every 30 min');
  console.log('  - Flight refresh:     every 15 min');
  console.log('  - Alert checker:      every 5 min');
  console.log('  - Cache pruning:      every hour');
}
