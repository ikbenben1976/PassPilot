import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { getPipeline } from '../services/frontier/index.js';

/**
 * POST /api/flights/search
 *
 * Search for flights from an origin airport.
 * Supports filtering by destination, GoWild-only, nonstop-only, price, and sorting.
 */
export const searchFlights = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      origin,
      destination,
      departureDate,
      goWildOnly,
      nonstopOnly,
      maxPrice,
      sortBy,
      sortOrder,
    } = req.body;

    if (!origin || !departureDate) {
      res.status(400).json({ error: 'Origin and departure date are required' });
      return;
    }

    const pipeline = getPipeline();
    const result = await pipeline.searchFlights(origin, departureDate, {
      destination,
      goWildOnly,
      nonstopOnly,
      maxPrice,
      sortBy,
      sortOrder,
    });

    res.json({
      flights: result.flights,
      total: result.total,
      cached: result.cached,
      searchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({ error: 'Flight search failed' });
  }
};

/**
 * GET /api/flights/calendar?origin=DEN&month=2026-03
 *
 * Get calendar availability for a month from an origin.
 */
export const getCalendar = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { origin, month } = req.query;

    if (!origin || !month) {
      res.status(400).json({ error: 'Origin and month are required' });
      return;
    }

    const [year, mon] = String(month).split('-').map(Number);
    if (!year || !mon || mon < 1 || mon > 12) {
      res.status(400).json({ error: 'Month must be in YYYY-MM format' });
      return;
    }

    const pipeline = getPipeline();
    const days = await pipeline.getCalendar(String(origin), year, mon);

    res.json({ days });
  } catch (error) {
    console.error('Calendar error:', error);
    res.status(500).json({ error: 'Failed to load calendar' });
  }
};

/**
 * GET /api/flights/destinations?origin=DEN
 *
 * Get destination summaries from an origin.
 */
export const getDestinations = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { origin } = req.query;

    if (!origin) {
      res.status(400).json({ error: 'Origin is required' });
      return;
    }

    const pipeline = getPipeline();
    const destinations = await pipeline.getDestinations(String(origin));

    res.json({ destinations });
  } catch (error) {
    console.error('Destinations error:', error);
    res.status(500).json({ error: 'Failed to load destinations' });
  }
};
