import type { Flight, DayAvailability, Destination, BlogPost, SavedSearch, Notification } from '@/types';

// ─── Mock Flights ────────────────────────────────────────────────────────────

export const MOCK_FLIGHTS: Flight[] = [
  {
    id: '1',
    origin: { code: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO', lat: 39.86, lng: -104.67 },
    destination: { code: 'AUS', name: 'Austin-Bergstrom', city: 'Austin', state: 'TX', lat: 30.19, lng: -97.67 },
    departureTime: '2026-03-01T06:05:00',
    arrivalTime: '2026-03-01T09:10:00',
    flightNumber: 'F9 1234',
    price: 1500,
    goWildAvailable: true,
    seatsRemaining: 3,
    duration: 185,
    stops: 0,
    status: 'limited',
  },
  {
    id: '2',
    origin: { code: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO', lat: 39.86, lng: -104.67 },
    destination: { code: 'MIA', name: 'Miami International', city: 'Miami', state: 'FL', lat: 25.79, lng: -80.29 },
    departureTime: '2026-03-01T07:30:00',
    arrivalTime: '2026-03-01T13:45:00',
    flightNumber: 'F9 2456',
    price: 2900,
    goWildAvailable: true,
    seatsRemaining: 8,
    duration: 255,
    stops: 0,
    status: 'available',
  },
  {
    id: '3',
    origin: { code: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO', lat: 39.86, lng: -104.67 },
    destination: { code: 'PHX', name: 'Phoenix Sky Harbor', city: 'Phoenix', state: 'AZ', lat: 33.44, lng: -112.01 },
    departureTime: '2026-03-01T09:15:00',
    arrivalTime: '2026-03-01T10:20:00',
    flightNumber: 'F9 3789',
    price: 1200,
    goWildAvailable: true,
    seatsRemaining: 12,
    duration: 125,
    stops: 0,
    status: 'available',
  },
  {
    id: '4',
    origin: { code: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO', lat: 39.86, lng: -104.67 },
    destination: { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', state: 'NV', lat: 36.08, lng: -115.15 },
    departureTime: '2026-03-01T11:00:00',
    arrivalTime: '2026-03-01T12:00:00',
    flightNumber: 'F9 4012',
    price: 1800,
    goWildAvailable: true,
    seatsRemaining: 5,
    duration: 120,
    stops: 0,
    status: 'available',
  },
  {
    id: '5',
    origin: { code: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO', lat: 39.86, lng: -104.67 },
    destination: { code: 'ATL', name: 'Hartsfield-Jackson Atlanta', city: 'Atlanta', state: 'GA', lat: 33.64, lng: -84.43 },
    departureTime: '2026-03-01T14:30:00',
    arrivalTime: '2026-03-01T19:45:00',
    flightNumber: 'F9 5678',
    price: 3200,
    goWildAvailable: true,
    seatsRemaining: null,
    duration: 195,
    stops: 0,
    status: 'available',
  },
  {
    id: '6',
    origin: { code: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO', lat: 39.86, lng: -104.67 },
    destination: { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', state: 'CA', lat: 37.62, lng: -122.38 },
    departureTime: '2026-03-01T16:00:00',
    arrivalTime: '2026-03-01T17:30:00',
    flightNumber: 'F9 6789',
    price: 2200,
    goWildAvailable: true,
    seatsRemaining: 2,
    duration: 150,
    stops: 0,
    status: 'limited',
  },
  {
    id: '7',
    origin: { code: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO', lat: 39.86, lng: -104.67 },
    destination: { code: 'MCO', name: 'Orlando International', city: 'Orlando', state: 'FL', lat: 28.43, lng: -81.31 },
    departureTime: '2026-03-01T08:45:00',
    arrivalTime: '2026-03-01T14:30:00',
    flightNumber: 'F9 7890',
    price: 2700,
    goWildAvailable: true,
    seatsRemaining: 6,
    duration: 225,
    stops: 1,
    status: 'available',
  },
  {
    id: '8',
    origin: { code: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO', lat: 39.86, lng: -104.67 },
    destination: { code: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', state: 'WA', lat: 47.45, lng: -122.31 },
    departureTime: '2026-03-01T13:15:00',
    arrivalTime: '2026-03-01T14:45:00',
    flightNumber: 'F9 8901',
    price: 1900,
    goWildAvailable: true,
    seatsRemaining: 9,
    duration: 150,
    stops: 0,
    status: 'available',
  },
];

// ─── Mock Calendar ───────────────────────────────────────────────────────────

export const MOCK_CALENDAR: DayAvailability[] = Array.from({ length: 28 }, (_, i) => {
  const day = i + 1;
  const flights = Math.floor(Math.random() * 25);
  const gw = Math.floor(flights * 0.7);
  return {
    date: `2026-02-${String(day).padStart(2, '0')}`,
    totalFlights: flights,
    goWildFlights: gw,
    lowestPrice: 1000 + Math.floor(Math.random() * 4000),
    destinations: ['AUS', 'MIA', 'PHX', 'LAS'].slice(0, 1 + Math.floor(Math.random() * 3)),
    heatLevel: (flights < 3 ? 0 : flights < 8 ? 1 : flights < 14 ? 2 : flights < 20 ? 3 : 4) as 0 | 1 | 2 | 3 | 4,
  };
});

// ─── Mock Destinations ───────────────────────────────────────────────────────

export const MOCK_DESTINATIONS: Destination[] = [
  { airport: { code: 'AUS', name: 'Austin-Bergstrom', city: 'Austin', state: 'TX', lat: 30.19, lng: -97.67 }, flightsPerWeek: 14, avgPrice: 2200, lowestPrice: 1200, nextAvailable: '2026-03-01', popular: true, tags: ['city', 'music'] },
  { airport: { code: 'MIA', name: 'Miami International', city: 'Miami', state: 'FL', lat: 25.79, lng: -80.29 }, flightsPerWeek: 21, avgPrice: 3100, lowestPrice: 2400, nextAvailable: '2026-03-01', popular: true, tags: ['beach', 'nightlife'] },
  { airport: { code: 'PHX', name: 'Phoenix Sky Harbor', city: 'Phoenix', state: 'AZ', lat: 33.44, lng: -112.01 }, flightsPerWeek: 28, avgPrice: 1800, lowestPrice: 1000, nextAvailable: '2026-03-01', popular: true, tags: ['desert', 'golf'] },
  { airport: { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', state: 'NV', lat: 36.17, lng: -115.14 }, flightsPerWeek: 35, avgPrice: 2000, lowestPrice: 1500, nextAvailable: '2026-03-01', popular: true, tags: ['entertainment'] },
  { airport: { code: 'ATL', name: 'Hartsfield-Jackson', city: 'Atlanta', state: 'GA', lat: 33.64, lng: -84.43 }, flightsPerWeek: 14, avgPrice: 3400, lowestPrice: 2800, nextAvailable: '2026-03-02', popular: false, tags: ['city', 'food'] },
  { airport: { code: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', state: 'CA', lat: 37.62, lng: -122.38 }, flightsPerWeek: 7, avgPrice: 2800, lowestPrice: 2000, nextAvailable: '2026-03-01', popular: false, tags: ['city', 'tech'] },
  { airport: { code: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', state: 'WA', lat: 47.45, lng: -122.31 }, flightsPerWeek: 7, avgPrice: 2400, lowestPrice: 1800, nextAvailable: '2026-03-03', popular: false, tags: ['nature', 'coffee'] },
  { airport: { code: 'MCO', name: 'Orlando Intl', city: 'Orlando', state: 'FL', lat: 28.43, lng: -81.31 }, flightsPerWeek: 21, avgPrice: 2900, lowestPrice: 2200, nextAvailable: '2026-03-01', popular: true, tags: ['theme parks', 'family'] },
  { airport: { code: 'MSP', name: 'Minneapolis-St Paul', city: 'Minneapolis', state: 'MN', lat: 44.88, lng: -93.22 }, flightsPerWeek: 7, avgPrice: 2600, lowestPrice: 1900, nextAvailable: '2026-03-02', popular: false, tags: ['city', 'lakes'] },
  { airport: { code: 'BNA', name: 'Nashville Intl', city: 'Nashville', state: 'TN', lat: 36.12, lng: -86.68 }, flightsPerWeek: 7, avgPrice: 2500, lowestPrice: 1800, nextAvailable: '2026-03-01', popular: true, tags: ['music', 'food'] },
  { airport: { code: 'DFW', name: 'Dallas/Fort Worth', city: 'Dallas', state: 'TX', lat: 32.90, lng: -97.04 }, flightsPerWeek: 14, avgPrice: 2300, lowestPrice: 1500, nextAvailable: '2026-03-01', popular: false, tags: ['city', 'bbq'] },
  { airport: { code: 'SAN', name: 'San Diego Intl', city: 'San Diego', state: 'CA', lat: 32.73, lng: -117.19 }, flightsPerWeek: 7, avgPrice: 2700, lowestPrice: 2000, nextAvailable: '2026-03-04', popular: false, tags: ['beach', 'zoo'] },
];

// ─── Mock Blog Posts ─────────────────────────────────────────────────────────

export const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'pass-guide',
    title: 'The Ultimate All-You-Can-Fly Pass Guide for 2026',
    excerpt: 'Everything you need to know about the all-you-can-fly pass, from booking rules to maximizing value.',
    content: '',
    coverImage: '',
    author: { name: 'The PassPilot Team', avatar: '', bio: 'Your co-pilots for all-you-can-fly travel' },
    category: 'tips',
    tags: ['pass', 'guide', 'beginner'],
    publishedAt: '2026-02-15T10:00:00',
    readTime: 8,
  },
  {
    id: '2',
    slug: 'hidden-gem-destinations',
    title: '10 Hidden Gem Destinations You Can Reach With Your Pass',
    excerpt: 'Skip the obvious picks. These underrated cities are affordable, beautiful, and easy to reach with your pass.',
    content: '',
    coverImage: '',
    author: { name: 'Sarah Mitchell', avatar: '', bio: 'Travel writer and pass enthusiast' },
    category: 'destinations',
    tags: ['destinations', 'tips', 'hidden gems'],
    publishedAt: '2026-02-10T10:00:00',
    readTime: 6,
  },
  {
    id: '3',
    slug: 'booking-tips',
    title: 'Pro Tips: How to Book Pass Flights Like a Power User',
    excerpt: 'Timing, strategy, and insider knowledge to help you lock in the best flights before they disappear.',
    content: '',
    coverImage: '',
    author: { name: 'The PassPilot Team', avatar: '', bio: 'Your co-pilots for all-you-can-fly travel' },
    category: 'travel-hacks',
    tags: ['tips', 'booking', 'strategy'],
    publishedAt: '2026-02-05T10:00:00',
    readTime: 5,
  },
  {
    id: '4',
    slug: 'pass-2026-changes',
    title: 'What\'s New With the All-You-Can-Fly Pass for 2026',
    excerpt: 'The new pass year has been announced. Here\'s what changed and what it means for members.',
    content: '',
    coverImage: '',
    author: { name: 'The PassPilot Team', avatar: '', bio: 'Your co-pilots for all-you-can-fly travel' },
    category: 'pass-news',
    tags: ['news', 'pass', '2026'],
    publishedAt: '2026-01-28T10:00:00',
    readTime: 4,
  },
];

// ─── Mock Saved Searches ─────────────────────────────────────────────────────

export const MOCK_SAVED_SEARCHES: SavedSearch[] = [
  {
    id: '1',
    name: 'Denver to Anywhere',
    params: { origin: 'DEN', departureDate: '2026-03-01', goWildOnly: true, nonstopOnly: false, sortBy: 'price', sortOrder: 'asc' },
    alertEnabled: true,
    lastChecked: '2026-02-28T14:30:00',
    newResults: 3,
    createdAt: '2026-02-01T10:00:00',
  },
  {
    id: '2',
    name: 'Weekend in Miami',
    params: { origin: 'DEN', destination: 'MIA', departureDate: '2026-03-07', goWildOnly: true, nonstopOnly: true, sortBy: 'price', sortOrder: 'asc' },
    alertEnabled: true,
    lastChecked: '2026-02-28T14:30:00',
    newResults: 0,
    createdAt: '2026-02-15T10:00:00',
  },
  {
    id: '3',
    name: 'Spring Break Flights',
    params: { origin: 'DEN', departureDate: '2026-03-15', goWildOnly: true, nonstopOnly: false, sortBy: 'price', sortOrder: 'asc' },
    alertEnabled: false,
    lastChecked: '2026-02-27T10:00:00',
    newResults: 7,
    createdAt: '2026-02-20T10:00:00',
  },
];

// ─── Mock Notifications ──────────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'price_drop',
    title: 'Price Drop: DEN → AUS',
    message: 'Price dropped from $29 to $15 for March 1 departure.',
    read: false,
    createdAt: '2026-02-28T13:45:00',
    actionUrl: '/search?origin=DEN&dest=AUS',
  },
  {
    id: '2',
    type: 'new_route',
    title: 'New Route Available',
    message: 'Frontier added DEN → BNA (Nashville) starting March 5.',
    read: false,
    createdAt: '2026-02-28T10:00:00',
  },
  {
    id: '3',
    type: 'deal_alert',
    title: 'Deal Alert: Under $20 Flights',
    message: '5 flights under $20 found from your home airport tomorrow.',
    read: true,
    createdAt: '2026-02-27T18:00:00',
    actionUrl: '/search',
  },
];
