import type { FrontierFare, FrontierSearchParams } from '../../types/index.js';
import type { FrontierDataAdapter } from './adapter.js';
import { AIRPORTS } from '../../lib/airports.js';

/**
 * Mock Frontier Data Adapter
 *
 * Returns realistic-looking flight data without hitting the live Frontier API.
 * Used when the real API is unavailable or during development.
 *
 * Generates deterministic fares based on origin, destination, and date so
 * results are consistent across repeated calls for the same query.
 */

// Subset of popular Frontier destinations to generate routes from
const POPULAR_CODES = [
  'ATL', 'AUS', 'BNA', 'BOS', 'CLT', 'DEN', 'DFW', 'DTW',
  'FLL', 'IAH', 'LAS', 'LAX', 'MCI', 'MCO', 'MDW', 'MIA',
  'MSP', 'MSY', 'ORD', 'PHL', 'PHX', 'RDU', 'SAN', 'SEA',
  'SFO', 'SLC', 'STL', 'TPA',
];

/** Simple seeded pseudo-random number generator for deterministic output. */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Turn a string into a numeric hash for seeding. */
function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

function buildFare(
  origin: string,
  dest: string,
  date: string,
  rand: () => number,
): FrontierFare {
  const hour = 5 + Math.floor(rand() * 16);          // 05:00–20:00
  const minute = Math.floor(rand() * 4) * 15;         // :00, :15, :30, :45
  const durationMin = 90 + Math.floor(rand() * 240);  // 1.5h – 5.5h
  const stops = rand() < 0.7 ? 0 : 1;
  const isGoWild = rand() < 0.6;
  const price = isGoWild
    ? 999 + Math.floor(rand() * 3000)     // $9.99–$39.99
    : 3500 + Math.floor(rand() * 15000);  // $35–$185

  const dep = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
  const arr = new Date(dep.getTime() + durationMin * 60_000);

  const flightNum = `F9${1000 + Math.floor(rand() * 9000)}`;

  return {
    origin,
    destination: dest,
    departureDateTime: dep.toISOString(),
    arrivalDateTime: arr.toISOString(),
    flightNumber: flightNum,
    fareAmountCents: price,
    isGoWild: isGoWild,
    seatsAvailable: isGoWild ? 1 + Math.floor(rand() * 6) : null,
    durationMinutes: durationMin,
    stops,
  };
}

export class MockAdapter implements FrontierDataAdapter {
  async searchFares(params: FrontierSearchParams): Promise<FrontierFare[]> {
    const { origin, destination, departureDate } = params;
    if (!destination) {
      return this.searchAllFromOrigin(origin, departureDate);
    }

    const seed = hashStr(`${origin}${destination}${departureDate}`);
    const rand = seededRandom(seed);
    const count = 1 + Math.floor(rand() * 3); // 1–3 flights per route/day
    return Array.from({ length: count }, () =>
      buildFare(origin, destination, departureDate, rand),
    );
  }

  async searchAllFromOrigin(origin: string, date: string): Promise<FrontierFare[]> {
    // Pick 10–20 destinations that aren't the origin
    const destinations = POPULAR_CODES.filter(
      (c) => c !== origin && c in AIRPORTS,
    );
    const seed = hashStr(`${origin}${date}`);
    const rand = seededRandom(seed);

    // Shuffle and take a subset
    const shuffled = destinations
      .map((d) => ({ d, r: rand() }))
      .sort((a, b) => a.r - b.r)
      .map((x) => x.d);
    const selected = shuffled.slice(0, 10 + Math.floor(rand() * 11));

    const fares: FrontierFare[] = [];
    for (const dest of selected) {
      const count = 1 + Math.floor(rand() * 3);
      for (let i = 0; i < count; i++) {
        fares.push(buildFare(origin, dest, date, rand));
      }
    }
    return fares;
  }

  async getMonthAvailability(
    origin: string,
    year: number,
    month: number,
  ): Promise<{ date: string; fareCount: number; lowestFareCents: number; goWildCount: number }[]> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const seed = hashStr(`${origin}${year}${month}`);
    const rand = seededRandom(seed);

    const results = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const fareCount = 8 + Math.floor(rand() * 25);
      const goWildCount = Math.floor(fareCount * (0.4 + rand() * 0.3));
      const lowestFareCents = 999 + Math.floor(rand() * 3000);
      results.push({ date: dateStr, fareCount, lowestFareCents, goWildCount });
    }
    return results;
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number }> {
    return { healthy: true, latencyMs: 1 };
  }
}
