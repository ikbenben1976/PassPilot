/**
 * Database Seed Script
 *
 * Populates flight_cache and monitored_airports with realistic
 * Frontier GoWild flight data for development and testing.
 *
 * Usage: npm run db:seed (or: tsx src/lib/seed.ts)
 */

import 'dotenv/config';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import db, { generateId, initSchema } from './db.js';
import { AIRPORTS } from './airports.js';

// Ensure data directory exists
const dbPath = process.env.DATABASE_PATH || './data/passpilot.db';
mkdirSync(dirname(dbPath), { recursive: true });

// Initialize schema
initSchema();
console.log('Schema initialized.');

// ─── Route Definitions ──────────────────────────────────────────────────────
// origin → [{ destination, durationMin }]

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

// ─── Departure Time Templates ───────────────────────────────────────────────
// Realistic departure hours (local time approximation)
const DEPARTURE_HOURS = [6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20];

// ─── Seeded Random ─────────────────────────────────────────────────────────
// Simple seeded PRNG for reproducible results
let seed = 42;
function seededRandom(): number {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function randomInt(min: number, max: number): number {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)]!;
}

// ─── Seed Monitored Airports ────────────────────────────────────────────────

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
console.log(`Seeded ${MONITORED.length} monitored airports.`);

// ─── Seed Flight Cache ──────────────────────────────────────────────────────

const today = new Date();
today.setHours(0, 0, 0, 0);
const DAYS_AHEAD = 14;

// expires_at: 1 year from now so seed data persists
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
      // Verify both airports exist
      if (!AIRPORTS[origin] || !AIRPORTS[route.dest]) continue;

      for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset++) {
        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);
        const dateStr = date.toISOString().split('T')[0];

        // 2-4 flights per route per day
        const flightsPerDay = randomInt(2, 4);
        const usedHours = new Set<number>();

        for (let f = 0; f < flightsPerDay; f++) {
          // Pick a departure hour that hasn't been used today for this route
          let hour: number;
          let attempts = 0;
          do {
            hour = pick(DEPARTURE_HOURS);
            attempts++;
          } while (usedHours.has(hour) && attempts < 20);
          usedHours.add(hour);

          const minute = randomInt(0, 3) * 15; // 0, 15, 30, or 45
          const depTime = `${dateStr}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

          // Arrival time
          const depMs = new Date(depTime).getTime();
          const arrMs = depMs + route.duration * 60_000;
          const arrTime = new Date(arrMs).toISOString().replace('.000Z', '').replace('Z', '');

          // Flight number: F9 + 4 digits (deterministic per route+hour)
          const flightNum = `F9 ${1000 + (origin.charCodeAt(0) * 100 + route.dest.charCodeAt(0) * 10 + hour) % 9000}`;

          // Price in cents: GoWild prices $12-$49
          const price = randomInt(1200, 4900);

          // GoWild available: ~70%
          const isGoWild = seededRandom() < 0.7 ? 1 : 0;

          // Seats remaining and status
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

          // Stops: ~85% nonstop, ~15% 1 stop
          const stops = seededRandom() < 0.85 ? 0 : 1;
          const actualDuration = stops === 1 ? route.duration + randomInt(40, 90) : route.duration;

          // Deterministic ID
          const id = `${origin}-${route.dest}-${flightNum.replace(' ', '')}-${depTime}`;

          upsertFlight.run(
            id,
            origin,
            route.dest,
            depTime,
            arrTime,
            flightNum,
            price,
            isGoWild,
            seatsRemaining,
            actualDuration,
            stops,
            status,
            expiresAt,
          );

          flightCount++;
        }
      }
    }
  }
});

seedFlights();
console.log(`Seeded ${flightCount} flights across ${Object.keys(ROUTES).length} origins over ${DAYS_AHEAD} days.`);

// ─── Summary ────────────────────────────────────────────────────────────────

const totalFlights = db.prepare('SELECT COUNT(*) as count FROM flight_cache').get() as { count: number };
const totalAirports = db.prepare('SELECT COUNT(*) as count FROM monitored_airports').get() as { count: number };
const origins = db.prepare('SELECT DISTINCT origin FROM flight_cache').all() as { origin: string }[];
const destinations = db.prepare('SELECT COUNT(DISTINCT destination) as count FROM flight_cache').get() as { count: number };

console.log('\n--- Seed Summary ---');
console.log(`Total flights in cache: ${totalFlights.count}`);
console.log(`Monitored airports: ${totalAirports.count}`);
console.log(`Origins: ${origins.map(o => o.origin).join(', ')}`);
console.log(`Unique destinations: ${destinations.count}`);
console.log(`Expires at: ${expiresAt}`);
console.log('Seed complete!');
