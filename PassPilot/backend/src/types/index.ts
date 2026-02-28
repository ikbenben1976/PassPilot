import type { Request } from 'express';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  id: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

// ─── Database Row Types ──────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  home_airport_code: string | null;
  favorite_destinations: string; // JSON array
  price_alerts_enabled: number; // SQLite boolean
  email_digest: 'daily' | 'weekly' | 'none';
  dark_mode: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  plan: 'monthly' | 'annual';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end: string;
  cancel_at_period_end: number;
  created_at: string;
  updated_at: string;
}

export interface FlightCacheRow {
  id: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  flight_number: string;
  price: number; // cents
  gowild_available: number;
  seats_remaining: number | null;
  duration: number; // minutes
  stops: number;
  status: 'available' | 'limited' | 'sold_out';
  fetched_at: string;
  expires_at: string;
}

export interface SavedSearchRow {
  id: string;
  user_id: string;
  name: string;
  params: string; // JSON FlightSearchParams
  alert_enabled: number;
  last_checked: string;
  new_results: number;
  created_at: string;
}

export interface PriceAlertRow {
  id: string;
  user_id: string;
  origin: string;
  destination: string;
  target_price: number;
  current_price: number;
  triggered: number;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: 'price_drop' | 'new_route' | 'deal_alert' | 'system';
  title: string;
  message: string;
  read: number;
  action_url: string | null;
  created_at: string;
}

export interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author_name: string;
  author_avatar: string;
  author_bio: string;
  category: string;
  tags: string; // JSON array
  published_at: string;
  read_time: number;
}

export interface PromoRedemptionRow {
  id: string;
  email: string;
  ip_address: string;
  redeemed_at: string;
  expires_at: string;
}

// ─── Frontier API Types ──────────────────────────────────────────────────────

export interface FrontierFare {
  origin: string;
  destination: string;
  departureDateTime: string;
  arrivalDateTime: string;
  flightNumber: string;
  fareAmountCents: number;
  isGoWild: boolean;
  seatsAvailable: number | null;
  durationMinutes: number;
  stops: number;
}

export interface FrontierSearchParams {
  origin: string;
  destination?: string;
  departureDate: string;
  returnDate?: string;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface Airport {
  code: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export interface FlightResponse {
  id: string;
  origin: Airport;
  destination: Airport;
  departureTime: string;
  arrivalTime: string;
  flightNumber: string;
  price: number;
  goWildAvailable: boolean;
  seatsRemaining: number | null;
  duration: number;
  stops: number;
  status: 'available' | 'limited' | 'sold_out';
}

export interface DayAvailabilityResponse {
  date: string;
  totalFlights: number;
  goWildFlights: number;
  lowestPrice: number;
  destinations: string[];
  heatLevel: 0 | 1 | 2 | 3 | 4;
}
