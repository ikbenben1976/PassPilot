import type { FrontierFare, FrontierSearchParams } from '../../types/index.js';
import type { FrontierDataAdapter } from './adapter.js';
import { FrontierResponseParser } from './parser.js';

/**
 * Live Frontier API Client
 *
 * Consumes Frontier's publicly available fare search API — the same
 * endpoints their website calls when a user searches for flights.
 *
 * Since Frontier now includes GoWild pricing in their standard search
 * results, we no longer need any special scraping or workarounds.
 * We simply query their public API and parse the results.
 *
 * Architecture:
 *   [Scheduler] → [FrontierClient] → Frontier API → [Parser] → normalized fares → [DB cache]
 *
 * Rate limiting: We throttle requests to be respectful of their servers.
 * Typically 1 request per second per origin, with exponential backoff on errors.
 */

const FRONTIER_API_BASE = process.env.FRONTIER_API_URL || 'https://www.flyfrontier.com/api';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;

export class FrontierClient implements FrontierDataAdapter {
  private parser = new FrontierResponseParser();
  private requestCount = 0;
  private lastRequestTime = 0;
  private minIntervalMs: number;

  constructor(minIntervalMs = 1_000) {
    this.minIntervalMs = minIntervalMs;
  }

  async searchFares(params: FrontierSearchParams): Promise<FrontierFare[]> {
    const { origin, destination, departureDate } = params;
    if (!destination) {
      return this.searchAllFromOrigin(origin, departureDate);
    }

    const rawResponse = await this.fetchWithRetry(
      '/fares/search',
      {
        origin,
        destination,
        departureDate,
        returnDate: params.returnDate,
        passengers: 1,
        promoCode: '',
      },
    );

    return this.parser.parseFareSearchResponse(rawResponse);
  }

  async searchAllFromOrigin(origin: string, date: string): Promise<FrontierFare[]> {
    // Frontier's "explore" endpoint returns all destinations from an origin
    const rawResponse = await this.fetchWithRetry(
      '/fares/explore',
      {
        origin,
        departureDate: date,
        passengers: 1,
      },
    );

    return this.parser.parseExploreResponse(rawResponse, origin);
  }

  async getMonthAvailability(
    origin: string,
    year: number,
    month: number,
  ): Promise<{ date: string; fareCount: number; lowestFareCents: number; goWildCount: number }[]> {
    const rawResponse = await this.fetchWithRetry(
      '/fares/calendar',
      {
        origin,
        year,
        month,
      },
    );

    return this.parser.parseCalendarResponse(rawResponse);
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.fetchWithRetry('/health', {}, 1);
      return { healthy: true, latencyMs: Date.now() - start };
    } catch {
      return { healthy: false, latencyMs: Date.now() - start };
    }
  }

  // ─── Internal ────────────────────────────────────────────────────────

  private async fetchWithRetry(
    endpoint: string,
    params: Record<string, unknown>,
    maxRetries = MAX_RETRIES,
  ): Promise<unknown> {
    // Throttle: ensure minimum interval between requests
    await this.throttle();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.doFetch(endpoint, params);
        this.requestCount++;
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(
          `Frontier API attempt ${attempt + 1}/${maxRetries + 1} failed:`,
          lastError.message,
        );

        if (attempt < maxRetries) {
          const delay = BASE_DELAY_MS * Math.pow(2, attempt);
          await sleep(delay);
        }
      }
    }

    throw lastError ?? new Error('Frontier API request failed');
  }

  private async doFetch(
    endpoint: string,
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const url = new URL(`${FRONTIER_API_BASE}${endpoint}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'PassPilot/1.0',
        },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Frontier API ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await sleep(this.minIntervalMs - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  get stats() {
    return {
      totalRequests: this.requestCount,
      lastRequestTime: this.lastRequestTime,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
