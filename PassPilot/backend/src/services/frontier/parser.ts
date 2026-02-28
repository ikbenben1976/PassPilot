import type { FrontierFare } from '../../types/index.js';

/**
 * Parses responses from Frontier's booking engine (booking.flyfrontier.com).
 *
 * The booking engine (Navitaire platform) returns HTML pages with flight data
 * embedded as JSON in script tags and data attributes. This parser extracts
 * and normalizes that data into FrontierFare objects.
 *
 * The parser is defensive — it tries multiple extraction strategies and
 * never throws, returning empty arrays on failure. This ensures partial
 * or unexpected data shapes don't crash the pipeline.
 *
 * Response format reference (reverse-engineered from community tools):
 *   - /Flight/InternalSelect returns HTML with flight data in:
 *     1. JSON blobs inside <script> tags (Navitaire's page model)
 *     2. Data attributes on flight row elements
 *     3. Structured fare tables in the HTML body
 *   - /Flight/RetrieveSchedule returns JSON with available dates
 */
export class FrontierResponseParser {
  /**
   * Parse flight search HTML from /Flight/InternalSelect.
   * Tries multiple extraction strategies in order of reliability.
   */
  parseFlightSearchHtml(
    html: string,
    fallbackOrigin: string,
    fallbackDestination: string,
  ): FrontierFare[] {
    if (!html || typeof html !== 'string') return [];

    try {
      // Strategy 1: Extract JSON model from Navitaire script tags
      const fromScripts = this.extractFromScriptJson(html, fallbackOrigin, fallbackDestination);
      if (fromScripts.length > 0) return fromScripts;

      // Strategy 2: Extract from structured HTML fare data
      const fromHtml = this.extractFromHtmlStructure(html, fallbackOrigin, fallbackDestination);
      if (fromHtml.length > 0) return fromHtml;

      // Strategy 3: Try to find any JSON-like flight data in the response
      const fromLoose = this.extractFromLooseJson(html, fallbackOrigin, fallbackDestination);
      if (fromLoose.length > 0) return fromLoose;

      return [];
    } catch (err) {
      console.warn('[Parser] Failed to parse flight search HTML:', err);
      return [];
    }
  }

  /**
   * Parse schedule/calendar response from /Flight/RetrieveSchedule.
   * Returns available dates for the given month.
   */
  parseScheduleResponse(raw: string, year: number, month: number): string[] {
    try {
      // The schedule endpoint returns JSON with disabled dates and boundaries
      const data = JSON.parse(raw);

      // Look for arrays of disabled/unavailable dates to invert
      const disabledDates = new Set<string>();

      // Navitaire uses various shapes — try common ones
      if (data.DisabledDates && Array.isArray(data.DisabledDates)) {
        for (const d of data.DisabledDates) {
          disabledDates.add(normalizeDate(String(d)));
        }
      }
      if (data.disabledDates && Array.isArray(data.disabledDates)) {
        for (const d of data.disabledDates) {
          disabledDates.add(normalizeDate(String(d)));
        }
      }

      // Generate all dates in the target month, exclude disabled ones
      const daysInMonth = new Date(year, month, 0).getDate();
      const availableDates: string[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (!disabledDates.has(dateStr)) {
          availableDates.push(dateStr);
        }
      }

      return availableDates;
    } catch {
      // If it's not JSON, try extracting dates from HTML/text
      try {
        return this.extractDatesFromText(raw, year, month);
      } catch {
        console.warn('[Parser] Failed to parse schedule response');
        return [];
      }
    }
  }

  // ─── Strategy 1: JSON in script tags ─────────────────────────────────

  /**
   * Navitaire embeds page state as JSON inside script tags.
   * Common patterns:
   *   - window.__INITIAL_STATE__ = { ... };
   *   - var model = { ... };
   *   - <script type="application/json">{ ... }</script>
   *   - data embedded in AvailabilitySearchInputSearchView or similar
   */
  private extractFromScriptJson(
    html: string,
    origin: string,
    destination: string,
  ): FrontierFare[] {
    const fares: FrontierFare[] = [];

    // Pattern 1: Look for large JSON objects in script tags
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;

    while ((match = scriptRegex.exec(html)) !== null) {
      const content = match[1].trim();
      if (content.length < 50) continue; // Too short to contain flight data

      // Try to find JSON assignments
      const jsonMatches = content.match(/(?:var\s+\w+|window\.\w+|let\s+\w+|const\s+\w+)\s*=\s*(\{[\s\S]+\});?\s*$/m);
      if (jsonMatches) {
        try {
          const obj = JSON.parse(jsonMatches[1]);
          const extracted = this.extractFaresFromObject(obj, origin, destination);
          fares.push(...extracted);
        } catch {
          // Not valid JSON — continue
        }
      }

      // Try to find raw JSON objects
      const rawJsonMatches = content.match(/^\s*(\{[\s\S]+\})\s*$/m);
      if (rawJsonMatches && fares.length === 0) {
        try {
          const obj = JSON.parse(rawJsonMatches[1]);
          const extracted = this.extractFaresFromObject(obj, origin, destination);
          fares.push(...extracted);
        } catch {
          // Not valid JSON
        }
      }
    }

    // Pattern 2: Look for application/json script tags
    const jsonScriptRegex = /<script\s+type\s*=\s*["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
    while ((match = jsonScriptRegex.exec(html)) !== null) {
      try {
        const obj = JSON.parse(match[1].trim());
        const extracted = this.extractFaresFromObject(obj, origin, destination);
        fares.push(...extracted);
      } catch {
        // Skip invalid JSON
      }
    }

    return fares;
  }

  /**
   * Recursively search a parsed JSON object for flight/fare data.
   * Navitaire nests data in various structures — we search broadly.
   */
  private extractFaresFromObject(
    obj: unknown,
    origin: string,
    destination: string,
    depth = 0,
  ): FrontierFare[] {
    if (depth > 8 || obj == null || typeof obj !== 'object') return [];

    const fares: FrontierFare[] = [];
    const o = obj as Record<string, unknown>;

    // Check if this object itself looks like a fare/journey/segment
    if (this.looksLikeFare(o)) {
      const fare = this.parseObjectAsFare(o, origin, destination);
      if (fare) fares.push(fare);
      return fares;
    }

    // Known Navitaire wrapper keys to search into
    const JOURNEY_KEYS = [
      'Journeys', 'journeys', 'Trips', 'trips',
      'Flights', 'flights', 'FlightSegments', 'flightSegments',
      'Fares', 'fares', 'FareList', 'fareList',
      'AvailableFlights', 'availableFlights',
      'Schedules', 'schedules', 'Segments', 'segments',
      'outbound', 'Outbound', 'inbound', 'Inbound',
      'data', 'Data', 'results', 'Results',
      'journeyDateMarket', 'JourneyDateMarket',
    ];

    for (const key of JOURNEY_KEYS) {
      if (key in o) {
        const val = o[key];
        if (Array.isArray(val)) {
          for (const item of val) {
            fares.push(...this.extractFaresFromObject(item, origin, destination, depth + 1));
          }
        } else if (typeof val === 'object' && val !== null) {
          fares.push(...this.extractFaresFromObject(val, origin, destination, depth + 1));
        }
      }
    }

    // If no known keys matched, search all array/object values (limited depth)
    if (fares.length === 0 && depth < 4) {
      for (const val of Object.values(o)) {
        if (Array.isArray(val) && val.length > 0 && val.length < 100) {
          for (const item of val) {
            fares.push(...this.extractFaresFromObject(item, origin, destination, depth + 1));
          }
        } else if (typeof val === 'object' && val !== null) {
          fares.push(...this.extractFaresFromObject(val, origin, destination, depth + 1));
        }
      }
    }

    return fares;
  }

  /**
   * Heuristic: does this object look like it represents a flight/fare?
   */
  private looksLikeFare(obj: Record<string, unknown>): boolean {
    const keys = Object.keys(obj).map((k) => k.toLowerCase());
    const hasTimeLike = keys.some((k) => k.includes('depart') || k.includes('departure') || k.includes('std'));
    const hasFareLike = keys.some((k) => k.includes('fare') || k.includes('price') || k.includes('amount') || k.includes('total'));
    const hasFlightLike = keys.some((k) => k.includes('flight') || k.includes('carrier') || k.includes('designator'));
    return (hasTimeLike && hasFareLike) || (hasTimeLike && hasFlightLike) || (hasFlightLike && hasFareLike);
  }

  /**
   * Parse a JSON object that looks like a fare into a FrontierFare.
   */
  private parseObjectAsFare(
    obj: Record<string, unknown>,
    fallbackOrigin: string,
    fallbackDestination: string,
  ): FrontierFare | null {
    try {
      const origin = findField(obj, ['origin', 'departureAirport', 'departureStation', 'departureStationCode', 'dep', 'from'])
        || fallbackOrigin;
      const destination = findField(obj, ['destination', 'arrivalAirport', 'arrivalStation', 'arrivalStationCode', 'arr', 'to'])
        || fallbackDestination;

      if (!origin || !destination) return null;

      const departureDateTime = findField(obj, [
        'departureDateTime', 'departureTime', 'departure', 'std',
        'STD', 'scheduledDeparture', 'departDate',
      ]) || '';

      const arrivalDateTime = findField(obj, [
        'arrivalDateTime', 'arrivalTime', 'arrival', 'sta',
        'STA', 'scheduledArrival', 'arriveDate',
      ]) || '';

      const flightNumber = findField(obj, [
        'flightNumber', 'flight', 'flightNum', 'flightDesignator',
        'carrierCode', 'identifier',
      ]) || '';

      // Price extraction — check multiple paths
      const rawPrice = findNumericField(obj, [
        'fare', 'price', 'amount', 'totalFare', 'totalAmount',
        'fareAmount', 'lowestFare', 'passFare', 'discountFare',
      ]);
      const fareAmountCents = dollarsToCents(rawPrice);

      // GoWild detection — look for pass-related fields
      const isGoWild = Boolean(
        findField(obj, ['isGoWild', 'goWild', 'passEligible', 'goWildAvailable', 'isPass', 'goWildFare']) ||
        // Check if the price is suspiciously low (GoWild fares are typically $9.99-$39.99)
        (fareAmountCents > 0 && fareAmountCents <= 4999),
      );

      const seatsRaw = findNumericField(obj, ['seatsAvailable', 'seats', 'availableCount', 'seatCount']);
      const seatsAvailable = seatsRaw > 0 ? seatsRaw : null;

      const durationMinutes = findNumericField(obj, ['duration', 'durationMinutes', 'totalDuration', 'elapsedTime']);
      const stops = findNumericField(obj, ['stops', 'connections', 'numStops', 'stopCount']);

      // Validate: we need at least a flight number or departure time
      if (!departureDateTime && !flightNumber) return null;

      return {
        origin: String(origin),
        destination: String(destination),
        departureDateTime: normalizeDateTime(String(departureDateTime)),
        arrivalDateTime: normalizeDateTime(String(arrivalDateTime)),
        flightNumber: normalizeFlightNumber(String(flightNumber)),
        fareAmountCents,
        isGoWild,
        seatsAvailable,
        durationMinutes: Math.round(durationMinutes),
        stops: Math.round(stops),
      };
    } catch {
      return null;
    }
  }

  // ─── Strategy 2: HTML structure parsing ──────────────────────────────

  /**
   * Extract flight data from the HTML DOM structure.
   * Navitaire booking pages use specific CSS classes and data attributes.
   */
  private extractFromHtmlStructure(
    html: string,
    origin: string,
    destination: string,
  ): FrontierFare[] {
    const fares: FrontierFare[] = [];

    // Look for flight rows with data attributes (Navitaire pattern)
    // Common patterns: data-flight, data-journey, data-segment, data-fare
    const dataAttrRegex = /data-(?:flight|journey|segment)\s*=\s*["']([^"']+)["']/gi;
    let match: RegExpExecArray | null;

    while ((match = dataAttrRegex.exec(html)) !== null) {
      try {
        // Data attributes may be HTML-encoded JSON
        const decoded = decodeHtmlEntities(match[1]);
        const obj = JSON.parse(decoded);
        const fare = this.parseObjectAsFare(obj as Record<string, unknown>, origin, destination);
        if (fare) fares.push(fare);
      } catch {
        // Not JSON — skip
      }
    }

    // Look for fare amounts in the HTML (backup extraction)
    if (fares.length === 0) {
      const fareRowRegex = /flight[^>]*?(?:F9|Frontier)\s*(\d{3,4})[^>]*?(\d{1,2}:\d{2}\s*(?:AM|PM))[^>]*?(\d{1,2}:\d{2}\s*(?:AM|PM))[^>]*?\$(\d+(?:\.\d{2})?)/gi;

      while ((match = fareRowRegex.exec(html)) !== null) {
        const flightNum = `F9${match[1]}`;
        const depTime = match[2];
        const arrTime = match[3];
        const price = parseFloat(match[4]);

        fares.push({
          origin,
          destination,
          departureDateTime: depTime,
          arrivalDateTime: arrTime,
          flightNumber: flightNum,
          fareAmountCents: dollarsToCents(price),
          isGoWild: price < 50,
          seatsAvailable: null,
          durationMinutes: 0,
          stops: 0,
        });
      }
    }

    return fares;
  }

  // ─── Strategy 3: Loose JSON extraction ───────────────────────────────

  /**
   * Last resort: scan the entire HTML for anything that looks like
   * JSON flight data. Useful when Frontier changes their page structure
   * but the underlying data format stays similar.
   */
  private extractFromLooseJson(
    html: string,
    origin: string,
    destination: string,
  ): FrontierFare[] {
    const fares: FrontierFare[] = [];

    // Look for JSON arrays that contain flight-like objects
    const jsonArrayRegex = /\[(\s*\{[^[\]]{50,2000}\}\s*(?:,\s*\{[^[\]]{50,2000}\}\s*)*)\]/g;
    let match: RegExpExecArray | null;

    while ((match = jsonArrayRegex.exec(html)) !== null) {
      try {
        const arr = JSON.parse(`[${match[1]}]`);
        if (!Array.isArray(arr)) continue;

        for (const item of arr) {
          if (typeof item === 'object' && item !== null && this.looksLikeFare(item)) {
            const fare = this.parseObjectAsFare(item, origin, destination);
            if (fare) fares.push(fare);
          }
        }
      } catch {
        // Not valid JSON array
      }
    }

    return fares;
  }

  // ─── Date extraction from text ───────────────────────────────────────

  private extractDatesFromText(text: string, year: number, month: number): string[] {
    const dates: string[] = [];
    const monthStr = String(month).padStart(2, '0');
    const pattern = new RegExp(`${year}-${monthStr}-(\\d{2})`, 'g');
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      dates.push(`${year}-${monthStr}-${match[1]}`);
    }

    return [...new Set(dates)].sort();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Case-insensitive field lookup. Tries exact keys first, then case-insensitive.
 */
function findField(obj: Record<string, unknown>, candidates: string[]): unknown {
  // Exact match first
  for (const key of candidates) {
    if (key in obj && obj[key] != null) return obj[key];
  }
  // Case-insensitive fallback
  const objKeys = Object.keys(obj);
  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    const match = objKeys.find((k) => k.toLowerCase() === lower);
    if (match && obj[match] != null) return obj[match];
  }
  return undefined;
}

/**
 * Find a numeric field from candidates.
 */
function findNumericField(obj: Record<string, unknown>, candidates: string[]): number {
  const val = findField(obj, candidates);
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert a dollar amount to cents.
 * If the value looks like it's already in cents (>= 100 and integer), return as-is.
 */
function dollarsToCents(value: unknown): number {
  const num = Number(value);
  if (isNaN(num)) return 0;
  if (Number.isInteger(num) && num >= 100) return num;
  return Math.round(num * 100);
}

/**
 * Normalize a date string to YYYY-MM-DD format.
 */
function normalizeDate(dateStr: string): string {
  // Handle common formats: "3/15/2026", "2026-03-15", "2026-03-15T00:00:00"
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toISOString().slice(0, 10);
  } catch {
    return dateStr;
  }
}

/**
 * Normalize a datetime to ISO format.
 */
function normalizeDateTime(value: string): string {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {
    // Fall through
  }
  return value;
}

/**
 * Normalize a flight number to "F9XXXX" format.
 */
function normalizeFlightNumber(value: string): string {
  if (!value) return '';
  // Already has F9 prefix
  if (/^F9\d+$/.test(value)) return value;
  // Just a number — add F9 prefix
  if (/^\d{3,4}$/.test(value)) return `F9${value}`;
  // Has a different carrier code
  if (/^[A-Z0-9]{2}\d{3,4}$/.test(value)) return value;
  return value;
}

/**
 * Decode common HTML entities.
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}
