import db, { generateId } from '../../lib/db.js';
import { getAirport } from '../../lib/airports.js';
import { flightCache, calendarCache, destCache } from '../../lib/cache.js';
import type { FrontierFare, FlightCacheRow, Airport, FlightResponse, DayAvailabilityResponse } from '../../types/index.js';
import type { FrontierDataAdapter } from './adapter.js';

/**
 * Flight Data Pipeline
 *
 * Orchestrates the flow of flight data:
 *   Frontier API → Parser → SQLite cache → Memory cache → API response
 *
 * The pipeline is the single source of truth for all flight data queries.
 * Controllers never call the Frontier adapter directly — they call the pipeline,
 * which decides whether to serve from cache or fetch fresh data.
 *
 * Data freshness strategy:
 *   - Memory cache: 2-5 min TTL (instant responses for hot queries)
 *   - SQLite cache: 30 min TTL (survives server restarts)
 *   - Background jobs: refresh top airports every 15-30 min
 *   - On-demand: if a user queries a stale origin, fetch inline
 */

const SQLITE_CACHE_TTL_MINUTES = 30;

export class FlightPipeline {
  private adapter: FrontierDataAdapter;

  constructor(adapter: FrontierDataAdapter) {
    this.adapter = adapter;
  }

  // ─── Search Flights ──────────────────────────────────────────────────

  /**
   * Search flights from an origin, optionally to a specific destination.
   * Checks memory cache → SQLite cache → Frontier API.
   */
  async searchFlights(
    origin: string,
    date: string,
    options: {
      destination?: string;
      goWildOnly?: boolean;
      nonstopOnly?: boolean;
      sortBy?: 'price' | 'departure' | 'duration' | 'destination';
      sortOrder?: 'asc' | 'desc';
      maxPrice?: number;
    } = {},
  ): Promise<{ flights: FlightResponse[]; total: number; cached: boolean }> {
    const cacheKey = `search:${origin}:${options.destination ?? 'all'}:${date}`;

    // 1. Check memory cache
    const memCached = flightCache.get<FlightResponse[]>(cacheKey);
    if (memCached) {
      const filtered = this.applyFilters(memCached, options);
      return { flights: filtered, total: filtered.length, cached: true };
    }

    // 2. Check SQLite cache
    const dbFlights = this.getFromDb(origin, date, options.destination);
    if (dbFlights.length > 0) {
      const responses = dbFlights.map(rowToFlightResponse);
      flightCache.set(cacheKey, responses);
      const filtered = this.applyFilters(responses, options);
      return { flights: filtered, total: filtered.length, cached: true };
    }

    // 3. Fetch from Frontier
    try {
      const fares = options.destination
        ? await this.adapter.searchFares({ origin, destination: options.destination, departureDate: date })
        : await this.adapter.searchAllFromOrigin(origin, date);

      const rows = this.persistFares(fares, origin);
      const responses = rows.map(rowToFlightResponse);
      flightCache.set(cacheKey, responses);
      const filtered = this.applyFilters(responses, options);

      // Log the refresh
      this.logRefresh(origin, options.destination ?? null, fares.length, rows.length);

      return { flights: filtered, total: filtered.length, cached: false };
    } catch (err) {
      console.error(`Pipeline: fetch failed for ${origin} on ${date}:`, err);
      // Return stale data if available (ignore expiry)
      const stale = this.getFromDb(origin, date, options.destination, true);
      const responses = stale.map(rowToFlightResponse);
      const filtered = this.applyFilters(responses, options);
      return { flights: filtered, total: filtered.length, cached: true };
    }
  }

  // ─── Calendar ────────────────────────────────────────────────────────

  /**
   * Get calendar availability for a month from an origin.
   */
  async getCalendar(
    origin: string,
    year: number,
    month: number,
  ): Promise<DayAvailabilityResponse[]> {
    const cacheKey = `calendar:${origin}:${year}-${month}`;

    const memCached = calendarCache.get<DayAvailabilityResponse[]>(cacheKey);
    if (memCached) return memCached;

    // Build from SQLite cache first
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? year + 1 : year;
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

    const rows = db
      .prepare(
        `SELECT
           date(departure_time) as day,
           COUNT(*) as total_flights,
           SUM(CASE WHEN gowild_available = 1 THEN 1 ELSE 0 END) as gw_flights,
           MIN(price) as lowest_price,
           GROUP_CONCAT(DISTINCT destination) as destinations
         FROM flight_cache
         WHERE origin = ? AND departure_time >= ? AND departure_time < ?
           AND expires_at > datetime('now')
         GROUP BY date(departure_time)
         ORDER BY day`,
      )
      .all(origin, startDate, endDate) as {
        day: string;
        total_flights: number;
        gw_flights: number;
        lowest_price: number;
        destinations: string;
      }[];

    if (rows.length > 0) {
      const result = rows.map(rowToDayAvailability);
      calendarCache.set(cacheKey, result);
      return result;
    }

    // Fetch from Frontier
    try {
      const monthData = await this.adapter.getMonthAvailability(origin, year, month);

      const result: DayAvailabilityResponse[] = monthData.map((d) => ({
        date: d.date,
        totalFlights: d.fareCount,
        goWildFlights: d.goWildCount,
        lowestPrice: d.lowestFareCents,
        destinations: [],
        heatLevel: fareCountToHeatLevel(d.fareCount),
      }));

      calendarCache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.error(`Pipeline: calendar fetch failed for ${origin} ${year}-${month}:`, err);
      return [];
    }
  }

  // ─── Destinations ────────────────────────────────────────────────────

  /**
   * Get destination summaries from an origin.
   */
  async getDestinations(origin: string): Promise<{
    airport: Airport;
    flightsPerWeek: number;
    avgPrice: number;
    lowestPrice: number;
    nextAvailable: string | null;
  }[]> {
    const cacheKey = `destinations:${origin}`;

    type DestResult = { airport: Airport; flightsPerWeek: number; avgPrice: number; lowestPrice: number; nextAvailable: string | null }[];
    const memCached = destCache.get<DestResult>(cacheKey);
    if (memCached) return memCached;

    const rows = db
      .prepare(
        `SELECT
           destination,
           COUNT(*) as flight_count,
           AVG(price) as avg_price,
           MIN(price) as lowest_price,
           MIN(departure_time) as next_available
         FROM flight_cache
         WHERE origin = ? AND expires_at > datetime('now')
         GROUP BY destination
         ORDER BY flight_count DESC`,
      )
      .all(origin) as {
        destination: string;
        flight_count: number;
        avg_price: number;
        lowest_price: number;
        next_available: string;
      }[];

    const result = rows
      .map((r) => {
        const airport = getAirport(r.destination);
        if (!airport) return null;
        return {
          airport,
          flightsPerWeek: Math.round(r.flight_count * (7 / SQLITE_CACHE_TTL_MINUTES * 60 * 24) * 0.1), // rough estimate
          avgPrice: Math.round(r.avg_price),
          lowestPrice: r.lowest_price,
          nextAvailable: r.next_available,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);

    destCache.set(cacheKey, result);
    return result;
  }

  // ─── Refresh ─────────────────────────────────────────────────────────

  /**
   * Refresh flight data for an origin. Called by background jobs.
   */
  async refreshOrigin(origin: string, date: string): Promise<{ fetched: number; persisted: number }> {
    const fares = await this.adapter.searchAllFromOrigin(origin, date);
    const rows = this.persistFares(fares, origin);

    // Invalidate memory caches for this origin
    flightCache.invalidatePattern(`search:${origin}:`);
    calendarCache.invalidatePattern(`calendar:${origin}:`);
    destCache.invalidatePattern(`destinations:${origin}`);

    this.logRefresh(origin, null, fares.length, rows.length);

    return { fetched: fares.length, persisted: rows.length };
  }

  /**
   * Purge expired data from SQLite cache.
   */
  purgeExpired(): number {
    const result = db
      .prepare(`DELETE FROM flight_cache WHERE expires_at < datetime('now')`)
      .run();
    return result.changes;
  }

  // ─── Private ─────────────────────────────────────────────────────────

  private getFromDb(
    origin: string,
    date: string,
    destination?: string,
    ignoreExpiry = false,
  ): FlightCacheRow[] {
    const dateStart = `${date}T00:00:00`;
    const dateEnd = `${date}T23:59:59`;

    let sql = `
      SELECT * FROM flight_cache
      WHERE origin = ? AND departure_time >= ? AND departure_time <= ?
    `;
    const params: unknown[] = [origin, dateStart, dateEnd];

    if (destination) {
      sql += ' AND destination = ?';
      params.push(destination);
    }

    if (!ignoreExpiry) {
      sql += ` AND expires_at > datetime('now')`;
    }

    sql += ' ORDER BY departure_time ASC';

    return db.prepare(sql).all(...params) as FlightCacheRow[];
  }

  private persistFares(fares: FrontierFare[], origin: string): FlightCacheRow[] {
    const expiresAt = new Date(Date.now() + SQLITE_CACHE_TTL_MINUTES * 60_000).toISOString();

    const upsert = db.prepare(`
      INSERT INTO flight_cache
        (id, origin, destination, departure_time, arrival_time, flight_number,
         price, gowild_available, seats_remaining, duration, stops, status,
         fetched_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
      ON CONFLICT(id) DO UPDATE SET
        price = excluded.price,
        gowild_available = excluded.gowild_available,
        seats_remaining = excluded.seats_remaining,
        status = excluded.status,
        fetched_at = datetime('now'),
        expires_at = excluded.expires_at
    `);

    const rows: FlightCacheRow[] = [];

    const insertMany = db.transaction(() => {
      for (const fare of fares) {
        // Deterministic ID based on flight identity
        const id = `${fare.origin}-${fare.destination}-${fare.flightNumber}-${fare.departureDateTime}`;
        const status = fare.seatsAvailable === 0
          ? 'sold_out'
          : fare.seatsAvailable != null && fare.seatsAvailable <= 3
            ? 'limited'
            : 'available';

        upsert.run(
          id,
          fare.origin || origin,
          fare.destination,
          fare.departureDateTime,
          fare.arrivalDateTime,
          fare.flightNumber,
          fare.fareAmountCents,
          fare.isGoWild ? 1 : 0,
          fare.seatsAvailable,
          fare.durationMinutes,
          fare.stops,
          status,
          expiresAt,
        );

        rows.push({
          id,
          origin: fare.origin || origin,
          destination: fare.destination,
          departure_time: fare.departureDateTime,
          arrival_time: fare.arrivalDateTime,
          flight_number: fare.flightNumber,
          price: fare.fareAmountCents,
          gowild_available: fare.isGoWild ? 1 : 0,
          seats_remaining: fare.seatsAvailable,
          duration: fare.durationMinutes,
          stops: fare.stops,
          status,
          fetched_at: new Date().toISOString(),
          expires_at: expiresAt,
        });
      }
    });

    insertMany();
    return rows;
  }

  private logRefresh(origin: string, destination: string | null, fetched: number, persisted: number): void {
    db.prepare(
      `INSERT INTO data_refresh_log (id, origin, destination, flights_fetched, flights_updated, completed_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    ).run(generateId(), origin, destination, fetched, persisted);
  }

  private applyFilters(
    flights: FlightResponse[],
    options: {
      goWildOnly?: boolean;
      nonstopOnly?: boolean;
      maxPrice?: number;
      sortBy?: string;
      sortOrder?: string;
    },
  ): FlightResponse[] {
    let result = [...flights];

    if (options.goWildOnly) {
      result = result.filter((f) => f.goWildAvailable);
    }
    if (options.nonstopOnly) {
      result = result.filter((f) => f.stops === 0);
    }
    if (options.maxPrice != null) {
      result = result.filter((f) => f.price <= options.maxPrice!);
    }

    const order = options.sortOrder === 'desc' ? -1 : 1;
    switch (options.sortBy) {
      case 'price':
        result.sort((a, b) => (a.price - b.price) * order);
        break;
      case 'departure':
        result.sort((a, b) => a.departureTime.localeCompare(b.departureTime) * order);
        break;
      case 'duration':
        result.sort((a, b) => (a.duration - b.duration) * order);
        break;
      case 'destination':
        result.sort((a, b) => a.destination.city.localeCompare(b.destination.city) * order);
        break;
      default:
        result.sort((a, b) => (a.price - b.price) * order);
    }

    return result;
  }
}

// ─── Row Transformers ────────────────────────────────────────────────────────

function rowToFlightResponse(row: FlightCacheRow): FlightResponse {
  const originAirport = getAirport(row.origin);
  const destAirport = getAirport(row.destination);

  return {
    id: row.id,
    origin: originAirport ?? { code: row.origin, name: row.origin, city: row.origin, state: '', lat: 0, lng: 0 },
    destination: destAirport ?? { code: row.destination, name: row.destination, city: row.destination, state: '', lat: 0, lng: 0 },
    departureTime: row.departure_time,
    arrivalTime: row.arrival_time,
    flightNumber: row.flight_number,
    price: row.price,
    goWildAvailable: Boolean(row.gowild_available),
    seatsRemaining: row.seats_remaining,
    duration: row.duration,
    stops: row.stops,
    status: row.status as 'available' | 'limited' | 'sold_out',
  };
}

function rowToDayAvailability(row: {
  day: string;
  total_flights: number;
  gw_flights: number;
  lowest_price: number;
  destinations: string;
}): DayAvailabilityResponse {
  return {
    date: row.day,
    totalFlights: row.total_flights,
    goWildFlights: row.gw_flights,
    lowestPrice: row.lowest_price,
    destinations: row.destinations ? row.destinations.split(',') : [],
    heatLevel: fareCountToHeatLevel(row.total_flights),
  };
}

function fareCountToHeatLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count < 3) return 0;
  if (count < 8) return 1;
  if (count < 14) return 2;
  if (count < 20) return 3;
  return 4;
}
