/**
 * Database Seed Script
 *
 * Populates flight_cache and monitored_airports with realistic
 * Frontier GoWild flight data for development and testing.
 *
 * Can be run standalone:  npm run db:seed
 * Or auto-runs at server startup when flight_cache is empty.
 */

import db from './db.js';
import { AIRPORTS } from './airports.js';

// ─── Route Definitions ──────────────────────────────────────────────────────

interface Route {
  dest: string;
  duration: number; // minutes
}

const ROUTES: Record<string, Route[]> = {
  DEN: [
    { dest: 'PHX', duration: 125 },
    { dest: 'LAS', duration: 120 },
    { dest: 'AUS', duration: 155 },
    { dest: 'ATL', duration: 195 },
    { dest: 'MCO', duration: 225 },
    { dest: 'MIA', duration: 245 },
    { dest: 'SFO', duration: 150 },
    { dest: 'SEA', duration: 160 },
    { dest: 'LAX', duration: 145 },
    { dest: 'ORD', duration: 155 },
    { dest: 'DFW', duration: 140 },
    { dest: 'BNA', duration: 165 },
  ],
  LAS: [
    { dest: 'DEN', duration: 120 },
    { dest: 'PHX', duration: 70 },
    { dest: 'LAX', duration: 65 },
    { dest: 'SFO', duration: 90 },
    { dest: 'SEA', duration: 165 },
    { dest: 'AUS', duration: 180 },
    { dest: 'ORD', duration: 215 },
    { dest: 'ATL', duration: 235 },
    { dest: 'MCO', duration: 270 },
    { dest: 'DFW', duration: 175 },
  ],
  PHX: [
    { dest: 'DEN', duration: 125 },
    { dest: 'LAS', duration: 70 },
    { dest: 'LAX', duration: 65 },
    { dest: 'SFO', duration: 105 },
    { dest: 'AUS', duration: 155 },
    { dest: 'DFW', duration: 155 },
    { dest: 'ATL', duration: 210 },
    { dest: 'MCO', duration: 240 },
    { dest: 'ORD', duration: 200 },
  ],
  MCO: [
    { dest: 'ATL', duration: 85 },
    { dest: 'DEN', duration: 250 },
    { dest: 'DFW', duration: 170 },
    { dest: 'PHX', duration: 240 },
    { dest: 'LAS', duration: 270 },
    { dest: 'ORD', duration: 175 },
    { dest: 'BNA', duration: 110 },
    { dest: 'MIA', duration: 50 },
    { dest: 'CLT', duration: 90 },
    { dest: 'EWR', duration: 155 },
  ],
  ATL: [
    { dest: 'MCO', duration: 85 },
    { dest: 'DEN', duration: 210 },
    { dest: 'DFW', duration: 140 },
    { dest: 'PHX', duration: 225 },
    { dest: 'LAS', duration: 250 },
    { dest: 'AUS', duration: 155 },
    { dest: 'MIA', duration: 105 },
    { dest: 'BNA', duration: 65 },
    { dest: 'ORD', duration: 110 },
    { dest: 'EWR', duration: 130 },
  ],
};

// Realistic departure hours (local time approximation)
const DEPARTURE_HOURS = [6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20];

// ─── Seeded PRNG (reproducible results) ─────────────────────────────────────

let prngSeed = 42;
function seededRandom(): number {
  prngSeed = (prngSeed * 16807 + 0) % 2147483647;
  return (prngSeed - 1) / 2147483646;
}

function randomInt(min: number, max: number): number {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)]!;
}

// ─── Monitored Airports ─────────────────────────────────────────────────────

const MONITORED = [
  { code: 'DEN', priority: 10, interval: 15 },
  { code: 'LAS', priority: 9, interval: 15 },
  { code: 'PHX', priority: 8, interval: 15 },
  { code: 'MCO', priority: 8, interval: 15 },
  { code: 'ATL', priority: 7, interval: 15 },
  { code: 'DFW', priority: 6, interval: 20 },
  { code: 'ORD', priority: 6, interval: 20 },
  { code: 'MIA', priority: 5, interval: 20 },
  { code: 'LAX', priority: 5, interval: 20 },
  { code: 'SEA', priority: 4, interval: 25 },
  { code: 'SFO', priority: 4, interval: 25 },
  { code: 'AUS', priority: 3, interval: 30 },
  { code: 'BNA', priority: 3, interval: 30 },
  { code: 'MSP', priority: 2, interval: 30 },
  { code: 'SAN', priority: 2, interval: 30 },
];

// ─── Main Seed Function ─────────────────────────────────────────────────────

export function seedDatabase(): void {
  // Reset PRNG for reproducibility
  prngSeed = 42;

  // Seed monitored airports
  const upsertAirport = db.prepare(`
    INSERT INTO monitored_airports (code, priority, refresh_interval_minutes, active)
    VALUES (?, ?, ?, 1)
    ON CONFLICT(code) DO UPDATE SET
      priority = excluded.priority,
      refresh_interval_minutes = excluded.refresh_interval_minutes,
      active = 1
  `);

  const seedAirports = db.transaction(() => {
    for (const { code, priority, interval } of MONITORED) {
      upsertAirport.run(code, priority, interval);
    }
  });
  seedAirports();
  console.log(`[Seed] Seeded ${MONITORED.length} monitored airports.`);

  // Seed flights
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const DAYS_AHEAD = 14;
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60_000).toISOString();

  const upsertFlight = db.prepare(`
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

  let flightCount = 0;

  const seedFlights = db.transaction(() => {
    for (const [origin, routes] of Object.entries(ROUTES)) {
      for (const route of routes) {
        if (!AIRPORTS[origin] || !AIRPORTS[route.dest]) continue;

        for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset++) {
          const date = new Date(today);
          date.setDate(date.getDate() + dayOffset);
          const dateStr = date.toISOString().split('T')[0];

          const flightsPerDay = randomInt(2, 4);
          const usedHours = new Set<number>();

          for (let f = 0; f < flightsPerDay; f++) {
            let hour: number;
            let attempts = 0;
            do {
              hour = pick(DEPARTURE_HOURS);
              attempts++;
            } while (usedHours.has(hour) && attempts < 20);
            usedHours.add(hour);

            const minute = randomInt(0, 3) * 15;
            const depTime = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

            const depMs = new Date(depTime).getTime();
            const arrMs = depMs + route.duration * 60_000;
            const arrTime = new Date(arrMs).toISOString().replace('.000Z', '').replace('Z', '');

            const flightNum = `F9 ${1000 + (origin.charCodeAt(0) * 100 + route.dest.charCodeAt(0) * 10 + hour) % 9000}`;
            const price = randomInt(1200, 4900);
            const isGoWild = seededRandom() < 0.7 ? 1 : 0;

            const roll = seededRandom();
            let seatsRemaining: number | null;
            let status: string;
            if (roll < 0.15) {
              seatsRemaining = 0;
              status = 'sold_out';
            } else if (roll < 0.40) {
              seatsRemaining = randomInt(1, 3);
              status = 'limited';
            } else {
              seatsRemaining = randomInt(4, 15);
              status = 'available';
            }

            const stops = seededRandom() < 0.85 ? 0 : 1;
            const actualDuration = stops === 1 ? route.duration + randomInt(40, 90) : route.duration;
            const id = `${origin}-${route.dest}-${flightNum.replace(' ', '')}-${depTime}`;

            upsertFlight.run(
              id, origin, route.dest, depTime, arrTime, flightNum,
              price, isGoWild, seatsRemaining, actualDuration, stops, status, expiresAt,
            );

            flightCount++;
          }
        }
      }
    }
  });

  seedFlights();

  const totalFlights = db.prepare('SELECT COUNT(*) as count FROM flight_cache').get() as { count: number };
  console.log(`[Seed] Seeded ${flightCount} flights across ${Object.keys(ROUTES).length} origins over ${DAYS_AHEAD} days.`);
  console.log(`[Seed] Total flights in cache: ${totalFlights.count}`);
}

/**
 * Check if the database needs seeding (flight_cache is empty).
 * Called at server startup.
 */
export function seedIfEmpty(): void {
  const row = db.prepare('SELECT COUNT(*) as count FROM flight_cache').get() as { count: number };
  if (row.count === 0) {
    console.log('[Seed] No flights found in cache — auto-seeding...');
    seedDatabase();
  } else {
    console.log(`[Seed] Flight cache has ${row.count} entries, skipping seed.`);
  }
}

// ─── Standalone Execution ───────────────────────────────────────────────────
// When run directly via: npm run db:seed

const isMain = process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js');
if (isMain) {
  // When running standalone, load dotenv and ensure schema + data dir
  const { mkdirSync } = await import('fs');
  const { dirname } = await import('path');
  const { initSchema } = await import('./db.js');

  const dbPath = process.env.DATABASE_PATH || './data/passpilot.db';
  mkdirSync(dirname(dbPath), { recursive: true });
  initSchema();

  seedDatabase();

  const origins = db.prepare('SELECT DISTINCT origin FROM flight_cache').all() as { origin: string }[];
  const destinations = db.prepare('SELECT COUNT(DISTINCT destination) as count FROM flight_cache').get() as { count: number };
  const airports = db.prepare('SELECT COUNT(*) as count FROM monitored_airports').get() as { count: number };
  console.log(`\nOrigins: ${origins.map(o => o.origin).join(', ')}`);
  console.log(`Unique destinations: ${destinations.count}`);
  console.log(`Monitored airports: ${airports.count}`);
  console.log('Seed complete!');
}
