import type { FrontierFare } from '../../types/index.js';

/**
 * Parses raw Frontier API responses into normalized FrontierFare objects.
 *
 * Frontier's API response format may change over time. By isolating all
 * parsing logic here, we only need to update one file when their schema changes.
 *
 * The parser is defensive — it logs warnings for unexpected data shapes
 * but never throws, returning empty arrays instead. This ensures partial
 * data from Frontier doesn't crash the entire pipeline.
 */
export class FrontierResponseParser {
  /**
   * Parse a standard fare search response (origin → destination).
   */
  parseFareSearchResponse(raw: unknown): FrontierFare[] {
    try {
      const data = raw as Record<string, unknown>;
      const trips = extractArray(data, ['data', 'trips', 'outbound']);

      return trips
        .map((trip) => this.parseSingleFare(trip as Record<string, unknown>))
        .filter((f): f is FrontierFare => f !== null);
    } catch (err) {
      console.warn('Failed to parse fare search response:', err);
      return [];
    }
  }

  /**
   * Parse an "explore" response (origin → all destinations).
   */
  parseExploreResponse(raw: unknown, origin: string): FrontierFare[] {
    try {
      const data = raw as Record<string, unknown>;
      const destinations = extractArray(data, ['data', 'destinations']);

      const fares: FrontierFare[] = [];
      for (const dest of destinations) {
        const d = dest as Record<string, unknown>;
        const flights = extractArray(d, ['flights']);

        for (const flight of flights) {
          const fare = this.parseSingleFare(flight as Record<string, unknown>, origin);
          if (fare) fares.push(fare);
        }
      }

      return fares;
    } catch (err) {
      console.warn('Failed to parse explore response:', err);
      return [];
    }
  }

  /**
   * Parse a calendar/month availability response.
   */
  parseCalendarResponse(
    raw: unknown,
  ): { date: string; fareCount: number; lowestFareCents: number; goWildCount: number }[] {
    try {
      const data = raw as Record<string, unknown>;
      const days = extractArray(data, ['data', 'days']);

      return days.map((day) => {
        const d = day as Record<string, unknown>;
        return {
          date: String(d['date'] ?? ''),
          fareCount: Number(d['fareCount'] ?? d['totalFares'] ?? 0),
          lowestFareCents: dollarsToCents(d['lowestFare'] ?? d['lowestPrice'] ?? 0),
          goWildCount: Number(d['goWildCount'] ?? d['passCount'] ?? 0),
        };
      });
    } catch (err) {
      console.warn('Failed to parse calendar response:', err);
      return [];
    }
  }

  /**
   * Parse a single fare/flight object from Frontier's response.
   */
  private parseSingleFare(
    obj: Record<string, unknown>,
    fallbackOrigin?: string,
  ): FrontierFare | null {
    try {
      const origin = String(obj['origin'] ?? obj['departureAirport'] ?? fallbackOrigin ?? '');
      const destination = String(obj['destination'] ?? obj['arrivalAirport'] ?? '');

      if (!origin || !destination) return null;

      const departureDateTime = String(
        obj['departureDateTime'] ?? obj['departureTime'] ?? obj['departure'] ?? '',
      );
      const arrivalDateTime = String(
        obj['arrivalDateTime'] ?? obj['arrivalTime'] ?? obj['arrival'] ?? '',
      );
      const flightNumber = String(
        obj['flightNumber'] ?? obj['flight'] ?? obj['flightNum'] ?? '',
      );

      // Price: Frontier may return dollars or cents
      const rawPrice = obj['fare'] ?? obj['price'] ?? obj['amount'] ?? obj['totalFare'] ?? 0;
      const fareAmountCents = dollarsToCents(rawPrice);

      // GoWild: check multiple possible field names
      const isGoWild = Boolean(
        obj['isGoWild'] ??
        obj['goWild'] ??
        obj['passEligible'] ??
        obj['goWildAvailable'] ??
        false,
      );

      const seatsAvailable = obj['seatsAvailable'] != null
        ? Number(obj['seatsAvailable'])
        : obj['seats'] != null
          ? Number(obj['seats'])
          : null;

      const durationMinutes = Number(obj['duration'] ?? obj['durationMinutes'] ?? 0);
      const stops = Number(obj['stops'] ?? obj['connections'] ?? 0);

      return {
        origin,
        destination,
        departureDateTime,
        arrivalDateTime,
        flightNumber,
        fareAmountCents,
        isGoWild,
        seatsAvailable,
        durationMinutes,
        stops,
      };
    } catch {
      return null;
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Navigate nested object to extract an array.
 */
function extractArray(obj: Record<string, unknown>, path: string[]): unknown[] {
  let current: unknown = obj;
  for (const key of path) {
    if (current == null || typeof current !== 'object') return [];
    current = (current as Record<string, unknown>)[key];
  }
  return Array.isArray(current) ? current : [];
}

/**
 * Convert a dollar amount (number or string) to cents.
 * If the value looks like it's already in cents (>= 100 and integer), return as-is.
 */
function dollarsToCents(value: unknown): number {
  const num = Number(value);
  if (isNaN(num)) return 0;

  // Heuristic: if it's a whole number >= 100, assume it's already in cents
  if (Number.isInteger(num) && num >= 100) return num;

  // Otherwise treat as dollars
  return Math.round(num * 100);
}
