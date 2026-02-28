import { create } from 'zustand';
import { api } from '@/services/api';
import { MOCK_FLIGHTS, MOCK_CALENDAR, MOCK_DESTINATIONS } from '@/lib/mockData';
import type { FlightSearchParams, Flight, DayAvailability, Destination } from '@/types';

interface SearchState {
  params: FlightSearchParams;
  results: Flight[];
  calendar: DayAvailability[];
  destinations: Destination[];
  isSearching: boolean;
  isLoadingCalendar: boolean;
  isLoadingDestinations: boolean;
  totalResults: number;
  lastSearched: string | null;
  error: string | null;
  usingMockData: boolean;

  setParams: (updates: Partial<FlightSearchParams>) => void;
  searchFlights: () => Promise<void>;
  fetchCalendar: (origin: string, year: number, month: number) => Promise<void>;
  fetchDestinations: (origin: string) => Promise<void>;
  resetSearch: () => void;
}

const defaultParams: FlightSearchParams = {
  origin: '',
  destination: undefined,
  departureDate: new Date().toISOString().split('T')[0]!,
  goWildOnly: true,
  nonstopOnly: false,
  sortBy: 'price',
  sortOrder: 'asc',
};

export const useSearchStore = create<SearchState>((set, get) => ({
  params: defaultParams,
  results: [],
  calendar: [],
  destinations: [],
  isSearching: false,
  isLoadingCalendar: false,
  isLoadingDestinations: false,
  totalResults: 0,
  lastSearched: null,
  error: null,
  usingMockData: false,

  setParams: (updates) =>
    set((state) => ({
      params: { ...state.params, ...updates },
    })),

  searchFlights: async () => {
    const { params } = get();
    set({ isSearching: true, error: null });

    try {
      const response = await api.flights.search({
        origin: params.origin,
        destination: params.destination,
        departureDate: params.departureDate,
        goWildOnly: params.goWildOnly,
        nonstopOnly: params.nonstopOnly,
        maxPrice: params.maxPrice,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      });

      set({
        results: response.flights,
        totalResults: response.total,
        lastSearched: response.searchedAt,
        isSearching: false,
        usingMockData: false,
      });
    } catch {
      // Fallback to filtered mock data when backend is unavailable
      const filtered = MOCK_FLIGHTS.filter((f) => {
        if (params.origin && f.origin.code !== params.origin) return false;
        if (params.destination && f.destination.code !== params.destination) return false;
        if (params.departureDate && !f.departureTime.startsWith(params.departureDate)) return false;
        if (params.goWildOnly && !f.goWildAvailable) return false;
        if (params.nonstopOnly && f.stops > 0) return false;
        return true;
      });

      set({
        results: filtered,
        totalResults: filtered.length,
        lastSearched: new Date().toISOString(),
        isSearching: false,
        usingMockData: true,
      });
    }
  },

  fetchCalendar: async (origin, year, month) => {
    set({ isLoadingCalendar: true });

    try {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      const response = await api.flights.calendar(origin, monthStr);
      set({ calendar: response.days, isLoadingCalendar: false });
    } catch {
      // Fallback to mock calendar data
      set({ calendar: MOCK_CALENDAR, isLoadingCalendar: false });
    }
  },

  fetchDestinations: async (origin) => {
    set({ isLoadingDestinations: true });

    try {
      const response = await api.flights.destinations(origin);
      set({ destinations: response.destinations, isLoadingDestinations: false });
    } catch {
      // Fallback to mock destinations
      set({ destinations: MOCK_DESTINATIONS, isLoadingDestinations: false });
    }
  },

  resetSearch: () =>
    set({
      params: defaultParams,
      results: [],
      calendar: [],
      destinations: [],
      totalResults: 0,
      lastSearched: null,
      error: null,
      usingMockData: false,
    }),
}));
