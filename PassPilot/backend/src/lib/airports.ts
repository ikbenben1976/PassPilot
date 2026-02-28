import type { Airport } from '../types/index.js';

/**
 * Static Frontier Airlines airport data.
 * Covers the ~100+ destinations served by Frontier.
 * Coordinates used for map display and distance calculations.
 */
export const AIRPORTS: Record<string, Airport> = {
  ABQ: { code: 'ABQ', name: 'Albuquerque International Sunport', city: 'Albuquerque', state: 'NM', lat: 35.04, lng: -106.61 },
  ANC: { code: 'ANC', name: 'Ted Stevens Anchorage International', city: 'Anchorage', state: 'AK', lat: 61.17, lng: -150.00 },
  ATL: { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', state: 'GA', lat: 33.64, lng: -84.43 },
  AUS: { code: 'AUS', name: 'Austin-Bergstrom International', city: 'Austin', state: 'TX', lat: 30.19, lng: -97.67 },
  BDL: { code: 'BDL', name: 'Bradley International', city: 'Hartford', state: 'CT', lat: 41.94, lng: -72.68 },
  BNA: { code: 'BNA', name: 'Nashville International', city: 'Nashville', state: 'TN', lat: 36.12, lng: -86.68 },
  BOI: { code: 'BOI', name: 'Boise Airport', city: 'Boise', state: 'ID', lat: 43.56, lng: -116.22 },
  BOS: { code: 'BOS', name: 'Boston Logan International', city: 'Boston', state: 'MA', lat: 42.36, lng: -71.01 },
  BUF: { code: 'BUF', name: 'Buffalo Niagara International', city: 'Buffalo', state: 'NY', lat: 42.94, lng: -78.73 },
  BUR: { code: 'BUR', name: 'Hollywood Burbank', city: 'Burbank', state: 'CA', lat: 34.20, lng: -118.36 },
  BWI: { code: 'BWI', name: 'Baltimore/Washington International', city: 'Baltimore', state: 'MD', lat: 39.18, lng: -76.67 },
  CHS: { code: 'CHS', name: 'Charleston International', city: 'Charleston', state: 'SC', lat: 32.90, lng: -80.04 },
  CLE: { code: 'CLE', name: 'Cleveland Hopkins International', city: 'Cleveland', state: 'OH', lat: 41.41, lng: -81.85 },
  CLT: { code: 'CLT', name: 'Charlotte Douglas International', city: 'Charlotte', state: 'NC', lat: 35.21, lng: -80.94 },
  CMH: { code: 'CMH', name: 'John Glenn Columbus International', city: 'Columbus', state: 'OH', lat: 39.99, lng: -82.89 },
  COS: { code: 'COS', name: 'Colorado Springs Airport', city: 'Colorado Springs', state: 'CO', lat: 38.81, lng: -104.70 },
  CVG: { code: 'CVG', name: 'Cincinnati/Northern Kentucky International', city: 'Cincinnati', state: 'OH', lat: 39.05, lng: -84.66 },
  DCA: { code: 'DCA', name: 'Ronald Reagan Washington National', city: 'Washington', state: 'DC', lat: 38.85, lng: -77.04 },
  DEN: { code: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO', lat: 39.86, lng: -104.67 },
  DFW: { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', state: 'TX', lat: 32.90, lng: -97.04 },
  DSM: { code: 'DSM', name: 'Des Moines International', city: 'Des Moines', state: 'IA', lat: 41.53, lng: -93.66 },
  DTW: { code: 'DTW', name: 'Detroit Metropolitan', city: 'Detroit', state: 'MI', lat: 42.21, lng: -83.35 },
  ELP: { code: 'ELP', name: 'El Paso International', city: 'El Paso', state: 'TX', lat: 31.81, lng: -106.38 },
  EWR: { code: 'EWR', name: 'Newark Liberty International', city: 'Newark', state: 'NJ', lat: 40.69, lng: -74.17 },
  FLL: { code: 'FLL', name: 'Fort Lauderdale-Hollywood International', city: 'Fort Lauderdale', state: 'FL', lat: 26.07, lng: -80.15 },
  GRR: { code: 'GRR', name: 'Gerald R. Ford International', city: 'Grand Rapids', state: 'MI', lat: 42.88, lng: -85.52 },
  HOU: { code: 'HOU', name: 'William P. Hobby', city: 'Houston', state: 'TX', lat: 29.65, lng: -95.28 },
  IAH: { code: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', state: 'TX', lat: 29.99, lng: -95.34 },
  IND: { code: 'IND', name: 'Indianapolis International', city: 'Indianapolis', state: 'IN', lat: 39.72, lng: -86.29 },
  ISP: { code: 'ISP', name: 'Long Island MacArthur', city: 'Islip', state: 'NY', lat: 40.79, lng: -73.10 },
  JAX: { code: 'JAX', name: 'Jacksonville International', city: 'Jacksonville', state: 'FL', lat: 30.49, lng: -81.69 },
  LAS: { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', state: 'NV', lat: 36.08, lng: -115.15 },
  LAX: { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', state: 'CA', lat: 33.94, lng: -118.41 },
  MCI: { code: 'MCI', name: 'Kansas City International', city: 'Kansas City', state: 'MO', lat: 39.30, lng: -94.71 },
  MCO: { code: 'MCO', name: 'Orlando International', city: 'Orlando', state: 'FL', lat: 28.43, lng: -81.31 },
  MDW: { code: 'MDW', name: 'Chicago Midway International', city: 'Chicago', state: 'IL', lat: 41.79, lng: -87.75 },
  MEM: { code: 'MEM', name: 'Memphis International', city: 'Memphis', state: 'TN', lat: 35.04, lng: -89.98 },
  MIA: { code: 'MIA', name: 'Miami International', city: 'Miami', state: 'FL', lat: 25.79, lng: -80.29 },
  MKE: { code: 'MKE', name: 'Milwaukee Mitchell International', city: 'Milwaukee', state: 'WI', lat: 42.95, lng: -87.90 },
  MSP: { code: 'MSP', name: 'Minneapolis-Saint Paul International', city: 'Minneapolis', state: 'MN', lat: 44.88, lng: -93.22 },
  MSY: { code: 'MSY', name: 'Louis Armstrong New Orleans International', city: 'New Orleans', state: 'LA', lat: 29.99, lng: -90.26 },
  OAK: { code: 'OAK', name: 'Oakland International', city: 'Oakland', state: 'CA', lat: 37.72, lng: -122.22 },
  OMA: { code: 'OMA', name: 'Eppley Airfield', city: 'Omaha', state: 'NE', lat: 41.30, lng: -95.89 },
  ONT: { code: 'ONT', name: 'Ontario International', city: 'Ontario', state: 'CA', lat: 34.06, lng: -117.60 },
  ORD: { code: 'ORD', name: "O'Hare International", city: 'Chicago', state: 'IL', lat: 41.98, lng: -87.90 },
  PBI: { code: 'PBI', name: 'Palm Beach International', city: 'West Palm Beach', state: 'FL', lat: 26.68, lng: -80.10 },
  PDX: { code: 'PDX', name: 'Portland International', city: 'Portland', state: 'OR', lat: 45.59, lng: -122.60 },
  PHL: { code: 'PHL', name: 'Philadelphia International', city: 'Philadelphia', state: 'PA', lat: 39.87, lng: -75.24 },
  PHX: { code: 'PHX', name: 'Phoenix Sky Harbor International', city: 'Phoenix', state: 'AZ', lat: 33.44, lng: -112.01 },
  PIT: { code: 'PIT', name: 'Pittsburgh International', city: 'Pittsburgh', state: 'PA', lat: 40.49, lng: -80.23 },
  PVD: { code: 'PVD', name: 'Rhode Island T.F. Green International', city: 'Providence', state: 'RI', lat: 41.72, lng: -71.43 },
  RDU: { code: 'RDU', name: 'Raleigh-Durham International', city: 'Raleigh', state: 'NC', lat: 35.88, lng: -78.79 },
  RNO: { code: 'RNO', name: 'Reno-Tahoe International', city: 'Reno', state: 'NV', lat: 39.50, lng: -119.77 },
  RSW: { code: 'RSW', name: 'Southwest Florida International', city: 'Fort Myers', state: 'FL', lat: 26.54, lng: -81.76 },
  SAN: { code: 'SAN', name: 'San Diego International', city: 'San Diego', state: 'CA', lat: 32.73, lng: -117.19 },
  SAT: { code: 'SAT', name: 'San Antonio International', city: 'San Antonio', state: 'TX', lat: 29.53, lng: -98.47 },
  SDF: { code: 'SDF', name: 'Louisville Muhammad Ali International', city: 'Louisville', state: 'KY', lat: 38.17, lng: -85.74 },
  SEA: { code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', state: 'WA', lat: 47.45, lng: -122.31 },
  SFO: { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', state: 'CA', lat: 37.62, lng: -122.38 },
  SJC: { code: 'SJC', name: 'San Jose International', city: 'San Jose', state: 'CA', lat: 37.36, lng: -121.93 },
  SLC: { code: 'SLC', name: 'Salt Lake City International', city: 'Salt Lake City', state: 'UT', lat: 40.79, lng: -111.98 },
  SMF: { code: 'SMF', name: 'Sacramento International', city: 'Sacramento', state: 'CA', lat: 38.70, lng: -121.59 },
  SNA: { code: 'SNA', name: 'John Wayne/Orange County', city: 'Santa Ana', state: 'CA', lat: 33.68, lng: -117.87 },
  STL: { code: 'STL', name: 'St. Louis Lambert International', city: 'St. Louis', state: 'MO', lat: 38.75, lng: -90.37 },
  TPA: { code: 'TPA', name: 'Tampa International', city: 'Tampa', state: 'FL', lat: 27.98, lng: -82.53 },
  TUL: { code: 'TUL', name: 'Tulsa International', city: 'Tulsa', state: 'OK', lat: 36.20, lng: -95.89 },
  TUS: { code: 'TUS', name: 'Tucson International', city: 'Tucson', state: 'AZ', lat: 32.12, lng: -110.94 },
  // International
  CUN: { code: 'CUN', name: 'Cancun International', city: 'Cancun', state: 'MX', lat: 21.04, lng: -86.87 },
  GDL: { code: 'GDL', name: 'Guadalajara International', city: 'Guadalajara', state: 'MX', lat: 20.52, lng: -103.31 },
  SJD: { code: 'SJD', name: 'Los Cabos International', city: 'San Jose del Cabo', state: 'MX', lat: 23.15, lng: -109.72 },
  PVR: { code: 'PVR', name: 'Licenciado Gustavo Díaz Ordaz International', city: 'Puerto Vallarta', state: 'MX', lat: 20.68, lng: -105.25 },
  MBJ: { code: 'MBJ', name: 'Sangster International', city: 'Montego Bay', state: 'JM', lat: 18.50, lng: -77.91 },
  PUJ: { code: 'PUJ', name: 'Punta Cana International', city: 'Punta Cana', state: 'DO', lat: 18.57, lng: -68.36 },
};

/**
 * Get airport by IATA code. Returns undefined if not found.
 */
export function getAirport(code: string): Airport | undefined {
  return AIRPORTS[code.toUpperCase()];
}

/**
 * Get all airports as an array, optionally sorted by city name.
 */
export function getAllAirports(sorted = true): Airport[] {
  const airports = Object.values(AIRPORTS);
  if (sorted) {
    airports.sort((a, b) => a.city.localeCompare(b.city));
  }
  return airports;
}

/**
 * Search airports by code, city, or name.
 */
export function searchAirports(query: string, limit = 10): Airport[] {
  const q = query.toLowerCase();
  return Object.values(AIRPORTS)
    .filter(
      (a) =>
        a.code.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

/**
 * Haversine distance between two airports in miles.
 */
export function distanceBetween(a: Airport, b: Airport): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
