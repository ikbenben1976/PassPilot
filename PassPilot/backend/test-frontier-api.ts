#!/usr/bin/env npx tsx
/**
 * Proof-of-concept: Fetch Frontier flights from Denver (DEN) for 2026-03-01
 *
 * RESEARCH FINDINGS:
 * Every GoWild search tool (1491Club, SearchGWP, GWsearch, GoWilder, FlightFinder)
 * uses the SAME technique — they all scrape booking.flyfrontier.com.
 *
 * There are TWO useful endpoints:
 *
 * 1) GET booking.flyfrontier.com/Flight/RetrieveSchedule
 *    → Returns JSON with which dates have flights (used to check availability)
 *
 * 2) GET booking.flyfrontier.com/Flight/InternalSelect
 *    → Returns HTML with embedded JSON containing full flight data
 *    → Parse <script> tags, extract JSON between { and ;
 *    → Flight data lives at response.journeys[0].flights (or similar)
 *
 * There's also a mobile/app API:
 * 3) POST mtier.flyfrontier.com/flightavailabilityssv/FlightAvailabilitySimpleSearch
 *    → Returns JSON directly (cleaner, but may require different headers)
 *
 * This script tries ALL THREE approaches to see which ones work.
 *
 * RUN:  npx tsx test-frontier-api.ts
 */

const ORIGIN = 'DEN';
const DATE = '2026-03-01';
const DEST = 'LAX'; // Single route to prove it works

// Randomized User-Agents (what the open-source scrapers all do)
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// ─── Approach 1: RetrieveSchedule (JSON, checks date availability) ───────────

async function tryRetrieveSchedule() {
  console.log('=== APPROACH 1: RetrieveSchedule (JSON) ===');
  const url =
    `https://booking.flyfrontier.com/Flight/RetrieveSchedule` +
    `?calendarSelectableDays.Origin=${ORIGIN}` +
    `&calendarSelectableDays.Destination=${DEST}`;

  console.log(`GET ${url}\n`);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': randomUA(), 'Accept': 'application/json' },
    });

    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Content-Type: ${res.headers.get('content-type')}`);

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      console.log('Response (JSON):');
      console.log(JSON.stringify(json, null, 2).slice(0, 2000));
    } catch {
      console.log(`Response (${text.length} bytes, not JSON):`);
      console.log(text.slice(0, 500));
    }
  } catch (err) {
    console.log(`ERROR: ${err instanceof Error ? err.message : err}`);
  }
  console.log('');
}

// ─── Approach 2: InternalSelect (HTML with embedded JSON) ────────────────────

async function tryInternalSelect() {
  console.log('=== APPROACH 2: InternalSelect (HTML → embedded JSON) ===');

  // Date format: "Mar 01, 2026" URL-encoded
  const dateStr = formatDateForFrontier(DATE);
  const url =
    `https://booking.flyfrontier.com/Flight/InternalSelect` +
    `?o1=${ORIGIN}&d1=${DEST}&dd1=${encodeURIComponent(dateStr)}&ADT=1&mon=true&promo=`;

  console.log(`GET ${url}\n`);

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': randomUA(), 'Accept': 'text/html' },
    });

    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Content-Type: ${res.headers.get('content-type')}`);

    const html = await res.text();
    console.log(`HTML size: ${html.length} bytes`);

    // Extract embedded JSON from <script> tags (this is how all the scrapers do it)
    const flights = extractFlightsFromHTML(html);

    if (flights) {
      console.log(`\nExtracted flight data:`);
      console.log(JSON.stringify(flights, null, 2).slice(0, 3000));
    } else {
      console.log('\nCould not find embedded flight JSON in the HTML.');
      console.log('Page title:', html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] ?? 'unknown');

      // Log script tags to debug
      const scriptContents = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptContents) {
        console.log(`\nFound ${scriptContents.length} <script> tags.`);
        for (let i = 0; i < Math.min(scriptContents.length, 5); i++) {
          const content = scriptContents[i].slice(0, 200);
          console.log(`  Script ${i}: ${content}...`);
        }
      }
    }
  } catch (err) {
    console.log(`ERROR: ${err instanceof Error ? err.message : err}`);
  }
  console.log('');
}

// ─── Approach 3: Mobile API (direct JSON) ────────────────────────────────────

async function tryMobileAPI() {
  console.log('=== APPROACH 3: Mobile API - FlightAvailabilitySimpleSearch (JSON) ===');
  const url = 'https://mtier.flyfrontier.com/flightavailabilityssv/FlightAvailabilitySimpleSearch';
  console.log(`POST ${url}\n`);

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
      codes: { currencyCode: 'USD' },
      origin: ORIGIN,
      destination: DEST,
      beginDate: DATE,
      endDate: DATE,
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': randomUA(),
      },
      body: JSON.stringify(body),
    });

    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Content-Type: ${res.headers.get('content-type')}`);

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      console.log('Response (JSON):');
      console.log(JSON.stringify(json, null, 2).slice(0, 3000));
    } catch {
      console.log(`Response (${text.length} bytes, not JSON):`);
      console.log(text.slice(0, 500));
    }
  } catch (err) {
    console.log(`ERROR: ${err instanceof Error ? err.message : err}`);
  }
  console.log('');
}

// ─── Approach 3b: Mobile Schedule API ────────────────────────────────────────

async function tryMobileSchedule() {
  console.log('=== APPROACH 3b: Mobile API - GetTripSchedule (JSON) ===');
  const params = new URLSearchParams({
    Origin: ORIGIN,
    Destination: DEST,
    BeginDate: DATE,
    EndDate: DATE,
    Type: '5',
  });
  const url = `https://mtier.flyfrontier.com/flightavailabilityssv/GetTripSchedule?${params}`;
  console.log(`GET ${url}\n`);

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': randomUA() },
    });

    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Content-Type: ${res.headers.get('content-type')}`);

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      console.log('Response (JSON):');
      console.log(JSON.stringify(json, null, 2).slice(0, 2000));
    } catch {
      console.log(`Response (${text.length} bytes, not JSON):`);
      console.log(text.slice(0, 500));
    }
  } catch (err) {
    console.log(`ERROR: ${err instanceof Error ? err.message : err}`);
  }
  console.log('');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Format date as "Mar 01, 2026" (what Frontier's booking URL expects)
 */
function formatDateForFrontier(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Extract flight data from Frontier's HTML response.
 * The open-source scrapers all do this the same way:
 * 1. Find <script> tags containing flight JSON
 * 2. Extract the JSON between { and ;
 * 3. Parse it to get journeys/flights
 */
function extractFlightsFromHTML(html: string): unknown | null {
  // Method A: Look for JSON in script tags (how GWsearch/Frontier-GoWild-Search do it)
  const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) ?? [];

  for (const script of scriptMatches) {
    const content = script.replace(/<\/?script[^>]*>/gi, '').trim();

    // Look for patterns that indicate flight data
    if (content.includes('journeys') || content.includes('flights') || content.includes('fareAvailability')) {
      // Try to extract JSON object
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        try {
          const jsonStr = content.slice(jsonStart, jsonEnd + 1);
          const data = JSON.parse(jsonStr);
          return data;
        } catch {
          // Try decoding HTML entities first
          const decoded = content
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'");
          const start = decoded.indexOf('{');
          const end = decoded.lastIndexOf('}');
          if (start >= 0 && end > start) {
            try {
              return JSON.parse(decoded.slice(start, end + 1));
            } catch { /* continue */ }
          }
        }
      }
    }
  }

  // Method B: Look for JSON in any data attributes
  const dataAttrMatch = html.match(/data-(?:flights|journeys|availability)=['"]([\s\S]*?)['"]/i);
  if (dataAttrMatch) {
    try {
      const decoded = dataAttrMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      return JSON.parse(decoded);
    } catch { /* continue */ }
  }

  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  PassPilot – Frontier API Proof of Concept              ║');
  console.log('║  Testing all known data access methods                  ║');
  console.log('║  Route: DEN → LAX | Date: 2026-03-01                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Based on research of 1491Club, SearchGWP, GWsearch,');
  console.log('GoWilder, and FlightFinder — every tool in this space');
  console.log('scrapes booking.flyfrontier.com the same way.\n');

  // Try all approaches
  await tryRetrieveSchedule();
  await sleep(2000); // Be polite

  await tryInternalSelect();
  await sleep(2000);

  await tryMobileAPI();
  await sleep(2000);

  await tryMobileSchedule();

  // Summary
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  SUMMARY & NEXT STEPS                                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Whichever approach(es) returned data above — that is what');
  console.log('we build the client around. Priorities:');
  console.log('');
  console.log('1. Approach 3/3b (mobile API) → cleanest if it works (pure JSON)');
  console.log('2. Approach 1 (RetrieveSchedule) → good for "which dates have flights"');
  console.log('3. Approach 2 (InternalSelect) → proven by all open-source tools');
  console.log('');
  console.log('Once we know which works, we iterate over all DEN destinations:');
  console.log('  ~45 Frontier routes from DEN, 1-2 sec delay between each,');
  console.log('  total scan time ~60-90 seconds for all DEN flights on one day.');
  console.log('');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
