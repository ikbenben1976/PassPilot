import type { FrontierFare, FrontierSearchParams } from '../../types/index.js';
import type { FrontierDataAdapter } from './adapter.js';
import { FrontierResponseParser } from './parser.js';
import { browserHeaders } from './userAgents.js';
import { AIRPORTS } from '../../lib/airports.js';

/**
 * Live Frontier Booking Client
 *
 * Hits Frontier's actual booking engine at booking.flyfrontier.com — the same
 * Navitaire-powered endpoints their website uses when you search for flights.
 *
 * This is the approach used by community tools like the 1491 Club, SearchGWP,
 * and open-source scrapers (GWsearch, FlightFinder). There is no official
 * public REST API; these booking engine URLs are the de-facto standard.
 *
 * Endpoints:
 *   - Flight search: /Flight/InternalSelect?o1=DEN&d1=ATL&dd1=2026-03-01&ADT=1&mon=true&promo=
 *   - Schedule/calendar: /Flight/RetrieveSchedule?calendarSelectableDays.Origin=DEN&calendarSelectableDays.Destination=ATL
 *
 * Anti-detection:
 *   - Randomized browser User-Agent strings (Chrome/Firefox on Win/Mac/Linux)
 *   - Standard browser headers (Accept, Sec-Fetch-*, etc.)
 *   - Configurable delay between requests (default 1.5s)
 *   - Exponential backoff on failures
 *
 * Architecture:
 *   [Scheduler] → [FrontierClient] → booking.flyfrontier.com → [Parser] → FrontierFare[] → [DB cache]
 */

const BOOKING_BASE = process.env.FRONTIER_BOOKING_URL || 'https://booking.flyfrontier.com';
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 2_000;

export class FrontierClient implements FrontierDataAdapter {
  private parser = new FrontierResponseParser();
  private requestCount = 0;
  private lastRequestTime = 0;
  private minIntervalMs: number;

  constructor(minIntervalMs = 1_500) {
    this.minIntervalMs = minIntervalMs;
  }

  /**
   * Search fares for a specific origin→destination on a date.
   * Single HTTP request to the InternalSelect endpoint.
   */
  async searchFares(params: FrontierSearchParams): Promise<FrontierFare[]> {
    const { origin, destination, departureDate } = params;
    if (!destination) {
      return this.searchAllFromOrigin(origin, departureDate);
    }

    const html = await this.fetchFlightPage(origin, destination, departureDate);
    return this.parser.parseFlightSearchHtml(html, origin, destination);
  }

  /**
   * Search all destinations from an origin on a date.
   *
   * There is no single "explore all" endpoint on the booking engine.
   * We iterate over known Frontier destinations, querying each route.
   * This mirrors the approach of GWsearch, 1491 Club, and SearchGWP.
   *
   * Typically 70-80 destinations × 1.5s delay ≈ 2 minutes for a full sweep.
   * The pipeline caches results for 30 min, so this runs infrequently.
   */
  async searchAllFromOrigin(origin: string, date: string): Promise<FrontierFare[]> {
    const destinations = Object.keys(AIRPORTS).filter((code) => code !== origin);
    const allFares: FrontierFare[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const dest of destinations) {
      try {
        const html = await this.fetchFlightPage(origin, dest, date);
        const fares = this.parser.parseFlightSearchHtml(html, origin, dest);

        if (fares.length > 0) {
          allFares.push(...fares);
          successCount++;
        }
      } catch (err) {
        errorCount++;
        // Log but don't abort — partial results are better than none
        if (errorCount <= 5) {
          console.warn(`[FrontierClient] ${origin}→${dest}: ${err instanceof Error ? err.message : err}`);
        }
        // If we're getting heavily rate-limited, back off
        if (errorCount > 10) {
          console.warn(`[FrontierClient] Too many errors (${errorCount}), stopping early. Got ${allFares.length} fares from ${successCount} routes.`);
          break;
        }
      }
    }

    console.log(
      `[FrontierClient] searchAllFromOrigin(${origin}, ${date}): ${allFares.length} fares from ${successCount} routes, ${errorCount} errors`,
    );

    return allFares;
  }

  /**
   * Get month availability by checking the schedule endpoint for each destination.
   * Uses RetrieveSchedule which returns available dates as JSON.
   */
  async getMonthAvailability(
    origin: string,
    year: number,
    month: number,
  ): Promise<{ date: string; fareCount: number; lowestFareCents: number; goWildCount: number }[]> {
    // Build a map of date → aggregated stats
    const dayMap = new Map<string, { fareCount: number; lowestFareCents: number; goWildCount: number }>();

    // Sample a subset of popular destinations to estimate monthly availability
    // (checking all 80+ would be too slow for a calendar view)
    const SAMPLE_DESTINATIONS = [
      'ATL', 'AUS', 'DEN', 'DFW', 'FLL', 'LAS', 'LAX', 'MCO',
      'MIA', 'ORD', 'PHX', 'SEA', 'SFO', 'TPA',
    ].filter((d) => d !== origin);

    for (const dest of SAMPLE_DESTINATIONS) {
      try {
        const scheduleData = await this.fetchSchedule(origin, dest);
        const availableDates = this.parser.parseScheduleResponse(scheduleData, year, month);

        for (const dateStr of availableDates) {
          const existing = dayMap.get(dateStr) ?? { fareCount: 0, lowestFareCents: 0, goWildCount: 0 };
          existing.fareCount += 1; // At least one route available
          dayMap.set(dateStr, existing);
        }
      } catch {
        // Skip destinations that fail — partial calendar is fine
      }
    }

    return Array.from(dayMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Health check — verify we can reach the booking engine.
   */
  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      // Light probe: fetch the schedule page for a known route
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      try {
        const response = await fetch(`${BOOKING_BASE}/Flight/InternalSelect?o1=DEN&d1=ATL&dd1=${getTomorrow()}&ADT=1&mon=true&promo=`, {
          method: 'GET',
          headers: browserHeaders(),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        // A 200 means the booking engine is up. Even a 302 or other redirect
        // indicates the server is alive.
        const healthy = response.status < 500;
        return { healthy, latencyMs: Date.now() - start };
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }

  get stats() {
    return {
      totalRequests: this.requestCount,
      lastRequestTime: this.lastRequestTime,
    };
  }

  // ─── Internal ────────────────────────────────────────────────────────

  /**
   * Fetch the flight search results page for a single route + date.
   * Returns raw HTML string.
   */
  private async fetchFlightPage(origin: string, destination: string, date: string): Promise<string> {
    // Format date as expected by the booking engine
    const dateStr = formatDateForBooking(date);

    const url = `${BOOKING_BASE}/Flight/InternalSelect?o1=${encodeURIComponent(origin)}&d1=${encodeURIComponent(destination)}&dd1=${encodeURIComponent(dateStr)}&ADT=1&mon=true&promo=`;

    return this.fetchWithRetry(url);
  }

  /**
   * Fetch the schedule/calendar data for a route.
   * Returns raw response text (usually JSON).
   */
  private async fetchSchedule(origin: string, destination: string): Promise<string> {
    const url = `${BOOKING_BASE}/Flight/RetrieveSchedule?calendarSelectableDays.Origin=${encodeURIComponent(origin)}&calendarSelectableDays.Destination=${encodeURIComponent(destination)}`;

    return this.fetchWithRetry(url);
  }

  /**
   * Fetch a URL with retry + exponential backoff.
   */
  private async fetchWithRetry(url: string, maxRetries = MAX_RETRIES): Promise<string> {
    await this.throttle();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.doFetch(url);
        this.requestCount++;
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < maxRetries) {
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
          const jitter = Math.random() * 500;
          console.warn(
            `[FrontierClient] Attempt ${attempt + 1}/${maxRetries + 1} failed: ${lastError.message}. Retrying in ${Math.round(delay + jitter)}ms`,
          );
          await sleep(delay + jitter);
        }
      }
    }

    throw lastError ?? new Error('Frontier booking request failed');
  }

  /**
   * Execute a single GET request with browser-like headers.
   */
  private async doFetch(url: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: browserHeaders(),
        signal: controller.signal,
        redirect: 'follow',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText} for ${url}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Rate-limit: ensure minimum interval between requests.
   * Adds a small random jitter to appear more human-like.
   */
  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime;
    const jitter = Math.random() * 500; // 0–500ms extra
    const needed = this.minIntervalMs + jitter;

    if (elapsed < needed) {
      await sleep(needed - elapsed);
    }
    this.lastRequestTime = Date.now();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format a date string for the booking engine.
 * Input: "2026-03-15" or ISO string
 * Output: "2026-03-15" (YYYY-MM-DD as used in the dd1 parameter)
 */
function formatDateForBooking(date: string): string {
  // If already YYYY-MM-DD, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  // If ISO datetime, extract date part
  return date.slice(0, 10);
}

/**
 * Get tomorrow's date as YYYY-MM-DD (for health check probe).
 */
function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
