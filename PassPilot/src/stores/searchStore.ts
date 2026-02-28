import { create } from 'zustand';
import type { FlightSearchParams, Flight, DayAvailability } from '@/types';

interface SearchState {
  params: FlightSearchParams;
  results: Flight[];
  calendar: DayAvailability[];
  isSearching: boolean;
  totalResults: number;
  lastSearched: string | null;

  setParams: (updates: Partial<FlightSearchParams>) => void;
  setResults: (flights: Flight[], total: number) => void;
  setCalendar: (days: DayAvailability[]) => void;
  setSearching: (searching: boolean) => void;
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

export const useSearchStore = create<SearchState>((set) => ({
  params: defaultParams,
  results: [],
  calendar: [],
  isSearching: false,
  totalResults: 0,
  lastSearched: null,

  setParams: (updates) =>
    set((state) => ({
      params: { ...state.params, ...updates },
    })),

  setResults: (flights, total) =>
    set({
      results: flights,
      totalResults: total,
      lastSearched: new Date().toISOString(),
      isSearching: false,
    }),

  setCalendar: (days) => set({ calendar: days }),

  setSearching: (isSearching) => set({ isSearching }),

  resetSearch: () =>
    set({
      params: defaultParams,
      results: [],
      calendar: [],
      totalResults: 0,
      lastSearched: null,
    }),
}));
