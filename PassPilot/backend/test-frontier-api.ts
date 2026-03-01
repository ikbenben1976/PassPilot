#!/usr/bin/env npx tsx
/**
 * Proof-of-concept: Fetch all Frontier flights from Denver (DEN) for 2026-03-01
 *
 * WHAT THIS DOES:
 * 1. Hits Frontier's real internal API (mtier.flyfrontier.com)
 * 2. Tries a few DEN destinations to prove the API works
 * 3. Logs raw responses so we can see the actual data shape
 *
 * RUN:  npx tsx test-frontier-api.ts
 *
 * NOTE: The API requires both origin AND destination — there's no
 * "search everywhere" endpoint. To get all DEN flights we iterate
 * over known destinations (starting with a small sample).
 */

const ORIGIN = 'DEN';
const DATE = '2026-03-01';

// Start with just 5 destinations to prove the API works.
// Once confirmed, we can expand to the full ~60 DEN routes.
const SAMPLE_DESTINATIONS = ['LAX', 'PHX', 'ATL', 'LAS', 'ORD'];

// Full list of known Frontier destinations from DEN (for later use)
const ALL_DEN_DESTINATIONS = [
  'ATL', 'AUS', 'BNA', 'BOI', 'CLE', 'CMH', 'CUN', 'DCA', 'DFW', 'DSM',
  'DTW', 'ELP', 'FAR', 'FLL', 'GEG', 'HOU', 'IAH', 'IND', 'JFK', 'LAS',
  'LAX', 'MCI', 'MCO', 'MIA', 'MSP', 'OAK', 'ONT', 'ORD', 'PHL', 'PHX',
  'PVR', 'RDU', 'RIC', 'RSW', 'SAN', 'SAT', 'SEA', 'SFO', 'SJD', 'SLC',
  'SNA', 'STL', 'TPA', 'TUL', 'TUS',
];

// ─── API Client ──────────────────────────────────────────────────────────────

const AVAILABILITY_URL = 'https://mtier.flyfrontier.com/flightavailabilityssv/FlightAvailabilitySimpleSearch';
const SCHEDULE_URL = 'https://mtier.flyfrontier.com/flightavailabilityssv/GetTripSchedule';

interface FlightResult {
  origin: string;
  destination: string;
  flightNumber: string;
  departure: string;
  arrival: string;
  fareUSD: number;
  stops: number;
  duration: string;
  seatsAvailable: number | null;
  isGoWild: boolean;
  rawFare: Record<string, unknown>;
}

/**
 * Hit Frontier's FlightAvailabilitySimpleSearch endpoint
 */
async function searchFlights(origin: string, destination: string, date: string): Promise<unknown> {
  const body = {
    flightAvailabilityRequestModel: {
      passengers: {
        types: [{ type: 'ADT', count: 1 }],
        residentCountry: 'US',
      },
      filters: {
        maxConnections: 20,
        fareInclusionType: 'Default',
        type: 'All',
        includeAllotments: true,
        bundleControlFilter: '2',
      },
      codes: {
        currencyCode: 'USD',
      },
      origin,
      destination,
      beginDate: date,
      endDate: date,
    },
  };

  const response = await fetch(AVAILABILITY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Hit Frontier's GetTripSchedule endpoint (simpler, schedule-only data)
 */
async function getSchedule(origin: string, destination: string, date: string): Promise<unknown> {
  const params = new URLSearchParams({
    Origin: origin,
    Destination: destination,
    BeginDate: date,
    EndDate: date,
    Type: '5',
  });

  const response = await fetch(`${SCHEDULE_URL}?${params}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  PassPilot - Frontier API Proof of Concept          ║');
  console.log('║  DEN → All Destinations | 2026-03-01                ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // ── Step 1: Try GetTripSchedule first (simpler, likely to work) ──
  console.log('=== STEP 1: GetTripSchedule (DEN → LAX) ===');
  console.log(`URL: ${SCHEDULE_URL}?Origin=DEN&Destination=LAX&BeginDate=${DATE}&EndDate=${DATE}&Type=5\n`);

  try {
    const scheduleData = await getSchedule('DEN', 'LAX', DATE);
    console.log('✓ GetTripSchedule responded!');
    console.log('Raw response:');
    console.log(JSON.stringify(scheduleData, null, 2));
  } catch (err) {
    console.log(`✗ GetTripSchedule failed: ${err instanceof Error ? err.message : err}`);
  }

  console.log('\n');

  // ── Step 2: Try FlightAvailabilitySimpleSearch (has fares) ──
  console.log('=== STEP 2: FlightAvailabilitySimpleSearch (DEN → LAX) ===');
  console.log(`URL: ${AVAILABILITY_URL}\n`);

  let sampleResponse: unknown = null;
  try {
    sampleResponse = await searchFlights('DEN', 'LAX', DATE);
    console.log('✓ FlightAvailabilitySimpleSearch responded!');
    console.log('Raw response (first 3000 chars):');
    const raw = JSON.stringify(sampleResponse, null, 2);
    console.log(raw.slice(0, 3000));
    if (raw.length > 3000) console.log(`\n... (${raw.length} total chars, truncated)`);
  } catch (err) {
    console.log(`✗ FlightAvailabilitySimpleSearch failed: ${err instanceof Error ? err.message : err}`);
  }

  console.log('\n');

  // ── Step 3: If Step 2 worked, iterate over sample destinations ──
  if (sampleResponse) {
    console.log(`=== STEP 3: Fetching ${SAMPLE_DESTINATIONS.length} sample DEN routes ===\n`);

    const allFlights: FlightResult[] = [];
    const errors: { dest: string; error: string }[] = [];

    for (const dest of SAMPLE_DESTINATIONS) {
      process.stdout.write(`  DEN → ${dest}... `);

      try {
        // Be polite: 1 second between requests
        await sleep(1000);

        const data = await searchFlights(ORIGIN, dest, DATE);
        const flights = extractFlights(data, ORIGIN, dest);

        if (flights.length > 0) {
          allFlights.push(...flights);
          console.log(`✓ ${flights.length} flight(s) found`);
        } else {
          console.log('✓ responded, but 0 flights on this date');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push({ dest, error: msg });
        console.log(`✗ ${msg}`);
      }
    }

    // ── Summary ──
    console.log('\n=== RESULTS SUMMARY ===\n');
    console.log(`Routes queried: ${SAMPLE_DESTINATIONS.length}`);
    console.log(`Flights found:  ${allFlights.length}`);
    console.log(`Errors:         ${errors.length}`);

    if (allFlights.length > 0) {
      console.log('\n--- Flights ---\n');
      console.log(
        'Route      | Flight  | Depart          | Arrive          | Fare    | Stops | GoWild',
      );
      console.log(
        '-----------|---------|-----------------|-----------------|---------|-------|-------',
      );

      for (const f of allFlights) {
        const route = `${f.origin}→${f.destination}`.padEnd(10);
        const flight = f.flightNumber.padEnd(7);
        const dep = f.departure.padEnd(15);
        const arr = f.arrival.padEnd(15);
        const fare = `$${f.fareUSD.toFixed(2)}`.padStart(7);
        const stops = String(f.stops).padStart(5);
        const gw = f.isGoWild ? 'YES' : 'no';
        console.log(`${route} | ${flight} | ${dep} | ${arr} | ${fare} | ${stops} | ${gw}`);
      }
    }

    if (errors.length > 0) {
      console.log('\n--- Errors ---\n');
      for (const e of errors) {
        console.log(`  DEN → ${e.dest}: ${e.error}`);
      }
    }
  } else {
    console.log('=== Skipping Step 3 (Step 2 failed) ===');
    console.log('\nThe FlightAvailabilitySimpleSearch endpoint did not respond.');
    console.log('Possible reasons:');
    console.log('  - API requires specific headers (User-Agent, Referer, etc.)');
    console.log('  - API requires a session/cookie from booking.flyfrontier.com');
    console.log('  - Date is too far in the future');
    console.log('  - Endpoint has changed');
    console.log('\nNext steps:');
    console.log('  1. Open booking.flyfrontier.com in a browser');
    console.log('  2. Open DevTools → Network tab');
    console.log('  3. Search for DEN → LAX on 03/01/2026');
    console.log('  4. Look at the actual XHR/Fetch requests');
    console.log('  5. Copy the exact URL, headers, and request body');
  }

  console.log('\n=== Done ===\n');
}

/**
 * Try to extract flight data from the API response.
 * Since we don't know the exact shape yet, this tries multiple paths.
 */
function extractFlights(data: unknown, origin: string, dest: string): FlightResult[] {
  if (!data || typeof data !== 'object') return [];

  const obj = data as Record<string, unknown>;
  const results: FlightResult[] = [];

  // Try common response patterns
  const possibleArrayPaths = [
    ['data', 'trips'],
    ['data', 'flights'],
    ['data', 'outbound'],
    ['data', 'journeys'],
    ['trips'],
    ['flights'],
    ['outbound'],
    ['journeys'],
    ['data'],
    // Navitaire/Radixx patterns (used by Frontier's booking system)
    ['Schedules'],
    ['schedules'],
    ['data', 'Schedules'],
    ['Trips'],
    ['data', 'Trips'],
  ];

  for (const path of possibleArrayPaths) {
    const arr = getNestedArray(obj, path);
    if (arr.length > 0) {
      console.log(`    (found data at path: ${path.join('.')})`);
      for (const item of arr) {
        const flight = parseFlightItem(item as Record<string, unknown>, origin, dest);
        if (flight) results.push(flight);
      }
      if (results.length > 0) return results;
    }
  }

  // If we couldn't find flights in known paths, log the top-level keys
  // so we can figure out the structure
  const keys = Object.keys(obj);
  console.log(`    (unknown response shape — top-level keys: ${keys.join(', ')})`);

  return results;
}

function parseFlightItem(
  item: Record<string, unknown>,
  fallbackOrigin: string,
  fallbackDest: string,
): FlightResult | null {
  try {
    // Try to extract relevant fields from various naming conventions
    const flightNumber = String(
      item['flightNumber'] ?? item['FlightNumber'] ?? item['flight'] ??
      item['designator']?.toString() ?? '',
    );

    const departure = String(
      item['departureTime'] ?? item['DepartureTime'] ?? item['departure'] ??
      item['std'] ?? item['STD'] ?? item['departureDateTime'] ?? '',
    );

    const arrival = String(
      item['arrivalTime'] ?? item['ArrivalTime'] ?? item['arrival'] ??
      item['sta'] ?? item['STA'] ?? item['arrivalDateTime'] ?? '',
    );

    // Fare might be nested
    let fareUSD = 0;
    const fareField = item['fare'] ?? item['Fare'] ?? item['price'] ?? item['Price'] ??
      item['totalFare'] ?? item['TotalFare'] ?? item['amount'] ?? item['lowestFare'];

    if (typeof fareField === 'number') {
      fareUSD = fareField;
    } else if (typeof fareField === 'object' && fareField !== null) {
      const fareObj = fareField as Record<string, unknown>;
      fareUSD = Number(fareObj['amount'] ?? fareObj['total'] ?? fareObj['value'] ?? 0);
    }

    const stops = Number(item['stops'] ?? item['Stops'] ?? item['connections'] ?? 0);

    const duration = String(item['duration'] ?? item['Duration'] ?? item['travelTime'] ?? '');

    const seatsAvailable = item['seatsAvailable'] != null
      ? Number(item['seatsAvailable'])
      : item['availableCount'] != null
        ? Number(item['availableCount'])
        : null;

    const isGoWild = Boolean(
      item['isGoWild'] ?? item['goWild'] ?? item['passEligible'] ?? item['goWildAvailable'] ?? false,
    );

    return {
      origin: String(item['origin'] ?? item['Origin'] ?? item['departureStation'] ?? fallbackOrigin),
      destination: String(item['destination'] ?? item['Destination'] ?? item['arrivalStation'] ?? fallbackDest),
      flightNumber,
      departure,
      arrival,
      fareUSD,
      stops,
      duration,
      seatsAvailable,
      isGoWild,
      rawFare: item,
    };
  } catch {
    return null;
  }
}

function getNestedArray(obj: Record<string, unknown>, path: string[]): unknown[] {
  let current: unknown = obj;
  for (const key of path) {
    if (current == null || typeof current !== 'object') return [];
    current = (current as Record<string, unknown>)[key];
  }
  return Array.isArray(current) ? current : [];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
