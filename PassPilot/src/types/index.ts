// ─── Flight & Search Types ───────────────────────────────────────────────────

export interface Airport {
  code: string; // e.g. "DEN"
  name: string; // e.g. "Denver International Airport"
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export interface Flight {
  id: string;
  origin: Airport;
  destination: Airport;
  departureTime: string; // ISO datetime
  arrivalTime: string;
  flightNumber: string;
  price: number; // taxes+fees in cents
  goWildAvailable: boolean;
  seatsRemaining: number | null;
  duration: number; // minutes
  stops: number;
  status: 'available' | 'limited' | 'sold_out';
}

export interface FlightSearchParams {
  origin: string; // airport code
  destination?: string; // airport code, optional = "anywhere"
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;
  goWildOnly: boolean;
  nonstopOnly: boolean;
  maxPrice?: number;
  sortBy: 'price' | 'departure' | 'duration' | 'destination';
  sortOrder: 'asc' | 'desc';
}

export interface FlightSearchResult {
  flights: Flight[];
  totalResults: number;
  searchedAt: string;
  cached: boolean;
}

// ─── Calendar & Availability ──────────────────────────────────────────────────

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  totalFlights: number;
  goWildFlights: number;
  lowestPrice: number; // cents
  destinations: string[]; // airport codes
  heatLevel: 0 | 1 | 2 | 3 | 4; // for calendar heat map
}

export interface CalendarMonth {
  year: number;
  month: number; // 1-12
  days: DayAvailability[];
}

// ─── Destination & Map ───────────────────────────────────────────────────────

export interface Destination {
  airport: Airport;
  flightsPerWeek: number;
  avgPrice: number;
  lowestPrice: number;
  nextAvailable: string | null; // ISO date
  popular: boolean;
  tags: string[]; // "beach", "mountains", "city", etc.
  imageUrl?: string;
}

export interface Route {
  origin: Airport;
  destination: Airport;
  frequency: 'daily' | 'several_weekly' | 'few_weekly' | 'seasonal';
  avgDuration: number; // minutes
}

// ─── User & Auth ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  homeAirport: Airport | null;
  subscription: Subscription | null;
  createdAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  homeAirportCode: string | null;
  favoriteDestinations: string[]; // airport codes
  priceAlerts: boolean;
  emailDigest: 'daily' | 'weekly' | 'none';
  darkMode: boolean;
}

export interface Subscription {
  id: string;
  plan: 'monthly' | 'annual';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// ─── Alerts & Saved Searches ─────────────────────────────────────────────────

export interface SavedSearch {
  id: string;
  name: string;
  params: FlightSearchParams;
  alertEnabled: boolean;
  lastChecked: string;
  newResults: number;
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  route: { origin: string; destination: string };
  targetPrice: number; // cents
  currentPrice: number;
  triggered: boolean;
  createdAt: string;
}

// ─── Blog & Content ──────────────────────────────────────────────────────────

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: BlogAuthor;
  category: BlogCategory;
  tags: string[];
  publishedAt: string;
  readTime: number; // minutes
}

export interface BlogAuthor {
  name: string;
  avatar: string;
  bio: string;
}

export type BlogCategory =
  | 'tips'
  | 'destinations'
  | 'pass-news'
  | 'travel-hacks'
  | 'deals';

// ─── Pricing ─────────────────────────────────────────────────────────────────

export interface PricingPlan {
  id: string;
  name: string;
  price: number; // cents per period
  period: 'month' | 'year';
  features: string[];
  popular: boolean;
  cta: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: 'price_drop' | 'new_route' | 'deal_alert' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// ─── Statistics ──────────────────────────────────────────────────────────────

export interface UserStats {
  totalSearches: number;
  flightsBooked: number;
  moneySaved: number; // cents - compared to regular fares
  destinationsExplored: number;
  memberSince: string;
}

export interface PlatformStats {
  totalMembers: number;
  flightsSearched: number;
  destinationsAvailable: number;
  averageSavings: number;
}
