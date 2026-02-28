import type { FrontierFare, FrontierSearchParams } from '../../types/index.js';

/**
 * Frontier Data Adapter Interface
 *
 * Abstraction over how we obtain Frontier flight/fare data.
 * Since Frontier now exposes GoWild pricing in their standard web search,
 * we consume their publicly available fare data through their web API.
 *
 * This adapter interface allows us to:
 * - Swap implementations (live API vs. mock vs. partner feed)
 * - Test without hitting the live API
 * - Add future data sources without changing consumers
 */
export interface FrontierDataAdapter {
  /**
   * Fetch fares from a specific origin to a specific destination on a date.
   */
  searchFares(params: FrontierSearchParams): Promise<FrontierFare[]>;

  /**
   * Fetch all available fares from an origin on a given date.
   * This is the "search everywhere" feature — the core value proposition.
   */
  searchAllFromOrigin(origin: string, date: string): Promise<FrontierFare[]>;

  /**
   * Fetch fare availability summary for a calendar month.
   * Returns one entry per day with flight counts and lowest price.
   */
  getMonthAvailability(
    origin: string,
    year: number,
    month: number,
  ): Promise<{ date: string; fareCount: number; lowestFareCents: number; goWildCount: number }[]>;

  /**
   * Check if the data source is healthy and responsive.
   */
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;
}
