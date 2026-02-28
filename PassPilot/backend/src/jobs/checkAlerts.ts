import db from '../lib/db.js';
import { createNotification } from '../controllers/notificationController.js';
import type { PriceAlertRow } from '../types/index.js';

/**
 * Check all active price alerts against current flight cache data.
 *
 * For each untriggered alert:
 * 1. Look up the current lowest price for the route
 * 2. Update the alert's current_price
 * 3. If price <= target_price, trigger the alert and create a notification
 */
export async function checkAlerts(): Promise<{ checked: number; triggered: number }> {
  const alerts = db
    .prepare(
      `SELECT * FROM price_alerts WHERE triggered = 0`,
    )
    .all() as PriceAlertRow[];

  let triggered = 0;

  const updatePrice = db.prepare(
    `UPDATE price_alerts SET current_price = ? WHERE id = ?`,
  );

  const triggerAlert = db.prepare(
    `UPDATE price_alerts SET triggered = 1, current_price = ? WHERE id = ?`,
  );

  for (const alert of alerts) {
    // Get current lowest price for this route
    const row = db
      .prepare(
        `SELECT MIN(price) as lowest FROM flight_cache
         WHERE origin = ? AND destination = ? AND expires_at > datetime('now')`,
      )
      .get(alert.origin, alert.destination) as { lowest: number | null } | undefined;

    const currentPrice = row?.lowest ?? 0;
    if (currentPrice === 0) continue; // No data for this route

    if (currentPrice <= alert.target_price) {
      // Price dropped to or below target — trigger alert
      triggerAlert.run(currentPrice, alert.id);
      triggered++;

      // Create notification for the user
      const priceStr = `$${(currentPrice / 100).toFixed(2)}`;
      const targetStr = `$${(alert.target_price / 100).toFixed(2)}`;

      createNotification(
        alert.user_id,
        'price_drop',
        `Price Alert: ${alert.origin} → ${alert.destination}`,
        `Price dropped to ${priceStr} (your target: ${targetStr}). Book now before it goes back up!`,
        `/search?origin=${alert.origin}&dest=${alert.destination}`,
      );
    } else {
      // Update current price tracking
      updatePrice.run(currentPrice, alert.id);
    }
  }

  return { checked: alerts.length, triggered };
}
