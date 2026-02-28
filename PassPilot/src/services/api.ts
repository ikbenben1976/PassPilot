/**
 * API Service Layer
 *
 * Centralized API client for PassPilot.
 * Connects to the backend API with Vite proxy forwarding /api to the Express server.
 * Falls back gracefully when the backend is unavailable.
 */

import type { Flight, DayAvailability, Destination } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, token } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new ApiError(response.status, error.message || 'Request failed');
    }

    return response.json();
  }

  // ─── Auth ────────────────────────────────────────────────────────────

  auth = {
    login: (email: string, password: string) =>
      this.request<{ user: unknown; token: string }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      }),

    signup: (name: string, email: string, password: string) =>
      this.request<{ user: unknown; token: string }>('/auth/signup', {
        method: 'POST',
        body: { name, email, password },
      }),

    me: (token: string) =>
      this.request<{ user: unknown }>('/auth/me', { token }),
  };

  // ─── Flights ─────────────────────────────────────────────────────────

  flights = {
    search: (params: Record<string, unknown>, token?: string) =>
      this.request<{ flights: Flight[]; total: number; cached: boolean; searchedAt: string }>('/flights/search', {
        method: 'POST',
        body: params,
        token,
      }),

    calendar: (origin: string, month: string, token?: string) =>
      this.request<{ days: DayAvailability[] }>(`/flights/calendar?origin=${origin}&month=${month}`, {
        token,
      }),

    destinations: (origin: string, token?: string) =>
      this.request<{ destinations: Destination[] }>(`/flights/destinations?origin=${origin}`, {
        token,
      }),
  };

  // ─── Saved Searches ──────────────────────────────────────────────────

  savedSearches = {
    list: (token: string) =>
      this.request<{ searches: unknown[] }>('/saved-searches', { token }),

    create: (data: Record<string, unknown>, token: string) =>
      this.request<{ search: unknown }>('/saved-searches', {
        method: 'POST',
        body: data,
        token,
      }),

    delete: (id: string, token: string) =>
      this.request<void>(`/saved-searches/${id}`, {
        method: 'DELETE',
        token,
      }),
  };

  // ─── Alerts ──────────────────────────────────────────────────────────

  alerts = {
    list: (token: string) =>
      this.request<{ alerts: unknown[] }>('/alerts', { token }),

    create: (data: Record<string, unknown>, token: string) =>
      this.request<{ alert: unknown }>('/alerts', {
        method: 'POST',
        body: data,
        token,
      }),

    delete: (id: string, token: string) =>
      this.request<void>(`/alerts/${id}`, {
        method: 'DELETE',
        token,
      }),
  };

  // ─── Subscription ────────────────────────────────────────────────────

  subscription = {
    status: (token: string) =>
      this.request<{ subscription: unknown }>('/subscription', { token }),

    create: (plan: 'monthly' | 'annual', token: string) =>
      this.request<{ clientSecret: string }>('/subscription', {
        method: 'POST',
        body: { plan },
        token,
      }),

    cancel: (token: string) =>
      this.request<void>('/subscription', {
        method: 'DELETE',
        token,
      }),
  };

  // ─── Blog ────────────────────────────────────────────────────────────

  blog = {
    list: (category?: string) =>
      this.request<{ posts: unknown[] }>(
        `/blog${category ? `?category=${category}` : ''}`,
      ),

    get: (slug: string) =>
      this.request<{ post: unknown }>(`/blog/${slug}`),
  };

  // ─── Notifications ───────────────────────────────────────────────────

  notifications = {
    list: (token: string) =>
      this.request<{ notifications: unknown[] }>('/notifications', { token }),

    markRead: (id: string, token: string) =>
      this.request<void>(`/notifications/${id}/read`, {
        method: 'PATCH',
        token,
      }),
  };
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = new ApiClient(API_BASE);
