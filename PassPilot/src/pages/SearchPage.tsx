import { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Map as MapIcon,
  List,
  Plane,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { AirportPicker } from '@/components/search/AirportPicker';
import { FlightCard } from '@/components/search/FlightCard';
import { CalendarHeatMap } from '@/components/search/CalendarHeatMap';
import { SearchFilters } from '@/components/search/SearchFilters';
import { DestinationMap } from '@/components/search/DestinationMap';
import { useSearchStore } from '@/stores/searchStore';
import { formatPriceCompact } from '@/lib/format';
import { MOCK_FLIGHTS, MOCK_CALENDAR, MOCK_DESTINATIONS } from '@/lib/mockData';
import type { Flight, FlightSearchParams } from '@/types';

const VIEW_TABS = [
  { id: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
  { id: 'map', label: 'Map', icon: <MapIcon className="w-4 h-4" /> },
];

function filterFlights(allFlights: Flight[], params: FlightSearchParams): Flight[] {
  return allFlights.filter((flight) => {
    // Filter by origin
    if (params.origin && flight.origin.code !== params.origin) return false;
    // Filter by destination (if specified)
    if (params.destination && flight.destination.code !== params.destination) return false;
    // Filter by departure date
    if (params.departureDate && !flight.departureTime.startsWith(params.departureDate)) return false;
    // Filter by GoWild/Pass availability
    if (params.goWildOnly && !flight.goWildAvailable) return false;
    // Filter by nonstop
    if (params.nonstopOnly && flight.stops > 0) return false;
    // Filter by max price
    if (params.maxPrice && flight.price > params.maxPrice) return false;
    return true;
  });
}

function sortFlights(flights: Flight[], sortBy: string, sortOrder: string): Flight[] {
  const sorted = [...flights];
  sorted.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'price':
        cmp = a.price - b.price;
        break;
      case 'departure':
        cmp = new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
        break;
      case 'duration':
        cmp = a.duration - b.duration;
        break;
      case 'destination':
        cmp = a.destination.city.localeCompare(b.destination.city);
        break;
      default:
        cmp = 0;
    }
    return sortOrder === 'desc' ? -cmp : cmp;
  });
  return sorted;
}

export function SearchPage() {
  const { params, setParams } = useSearchStore();
  const [view, setView] = useState('list');
  const [calMonth, setCalMonth] = useState({ year: 2026, month: 1 }); // Feb 2026
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMapDest, setSelectedMapDest] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // In production these would come from API; using mock data for architecture
  const calendarDays = MOCK_CALENDAR;
  const destinations = MOCK_DESTINATIONS;

  // Filter and sort flights based on search params
  const flights = useMemo(() => {
    const filtered = filterFlights(MOCK_FLIGHTS, params);
    return sortFlights(filtered, params.sortBy, params.sortOrder);
  }, [params]);

  // Flights filtered for a specific calendar date
  const calendarFlights = useMemo(() => {
    if (!selectedDate) return [];
    return MOCK_FLIGHTS.filter((f) => {
      if (params.origin && f.origin.code !== params.origin) return false;
      if (params.goWildOnly && !f.goWildAvailable) return false;
      if (params.nonstopOnly && f.stops > 0) return false;
      return f.departureTime.startsWith(selectedDate);
    });
  }, [selectedDate, params.origin, params.goWildOnly, params.nonstopOnly]);

  // Flights to the selected map destination
  const mapDestFlights = useMemo(() => {
    if (!selectedMapDest) return [];
    return MOCK_FLIGHTS.filter((f) => {
      if (params.origin && f.origin.code !== params.origin) return false;
      if (params.goWildOnly && !f.goWildAvailable) return false;
      return f.destination.code === selectedMapDest;
    });
  }, [selectedMapDest, params.origin, params.goWildOnly]);

  const selectedDestination = destinations.find(
    (d) => d.airport.code === selectedMapDest,
  );

  const handleSearch = () => {
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Search bar */}
      <div className="bg-white border-b border-surface-200 sticky top-16 z-30">
        <div className="container-wide py-4">
          <div className="flex flex-col lg:flex-row items-end gap-4">
            <AirportPicker
              value={params.origin}
              onChange={(code) => setParams({ origin: code })}
              label="From"
              placeholder="Select departure airport"
              className="flex-1 w-full lg:w-auto"
            />

            <AirportPicker
              value={params.destination || ''}
              onChange={(code) =>
                setParams({ destination: code || undefined })
              }
              label="To"
              placeholder="Anywhere"
              allowAnywhere
              className="flex-1 w-full lg:w-auto"
            />

            <div className="w-full lg:w-auto">
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={params.departureDate}
                onChange={(e) =>
                  setParams({ departureDate: e.target.value })
                }
                className="w-full lg:w-44 rounded-xl border border-surface-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button
              size="lg"
              variant="primary"
              icon={<Search className="w-5 h-5" />}
              onClick={handleSearch}
              className="w-full lg:w-auto"
            >
              Search Flights
            </Button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="container-wide py-6">
        {!hasSearched ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-brand-50 flex items-center justify-center mb-6">
              <Plane className="w-10 h-10 text-brand-400" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900 mb-2">
              Where are you flying from?
            </h2>
            <p className="text-surface-500 max-w-md">
              Select your departure airport and hit search to see all available
              pass flights. We'll show you every destination, price, and time
              in one view.
            </p>
          </div>
        ) : (
          <>
            {/* View tabs & filters */}
            <div className="flex items-center justify-between mb-6">
              <Tabs
                tabs={VIEW_TABS}
                activeTab={view}
                onChange={setView}
                variant="pills"
              />
              <div className="hidden sm:flex items-center gap-2">
                <Badge variant="success" dot>
                  Live data
                </Badge>
                <span className="text-xs text-surface-500">
                  Updated 2 min ago
                </span>
              </div>
            </div>

            {/* Filters */}
            <SearchFilters
              params={params}
              onChange={setParams}
              totalResults={flights.length}
            />

            {/* Results */}
            <div className="mt-6">
              {view === 'list' && (
                <div className="space-y-3">
                  {flights.length > 0 ? (
                    flights.map((flight) => (
                      <FlightCard key={flight.id} flight={flight} />
                    ))
                  ) : (
                    <Card padding="lg" className="text-center">
                      <Plane className="w-8 h-8 text-surface-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-surface-700 mb-1">
                        No flights found
                      </p>
                      <p className="text-sm text-surface-500">
                        Try adjusting your filters or search for a different date.
                      </p>
                    </Card>
                  )}
                </div>
              )}

              {view === 'calendar' && (
                <div className="grid lg:grid-cols-[1fr_380px] gap-6">
                  <CalendarHeatMap
                    year={calMonth.year}
                    month={calMonth.month}
                    days={calendarDays}
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    onPrevMonth={() =>
                      setCalMonth((prev) => {
                        const m = prev.month - 1;
                        return m < 0
                          ? { year: prev.year - 1, month: 11 }
                          : { year: prev.year, month: m };
                      })
                    }
                    onNextMonth={() =>
                      setCalMonth((prev) => {
                        const m = prev.month + 1;
                        return m > 11
                          ? { year: prev.year + 1, month: 0 }
                          : { year: prev.year, month: m };
                      })
                    }
                  />

                  {/* Sidebar: flights for selected date */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-surface-900">
                      {selectedDate
                        ? `Flights on ${selectedDate}`
                        : 'Select a date'}
                    </h3>
                    {selectedDate ? (
                      calendarFlights.length > 0 ? (
                        calendarFlights.map((f) => (
                          <FlightCard key={f.id} flight={f} compact />
                        ))
                      ) : (
                        <Card padding="lg" className="text-center">
                          <Plane className="w-8 h-8 text-surface-300 mx-auto mb-2" />
                          <p className="text-sm text-surface-500">
                            No flights found on this date
                          </p>
                        </Card>
                      )
                    ) : (
                      <Card padding="lg" className="text-center">
                        <Calendar className="w-8 h-8 text-surface-300 mx-auto mb-2" />
                        <p className="text-sm text-surface-500">
                          Click a date on the calendar to see available flights
                        </p>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {view === 'map' && (
                <div className="grid lg:grid-cols-[1fr_380px] gap-6">
                  <DestinationMap
                    destinations={destinations}
                    selectedCode={selectedMapDest}
                    onSelect={setSelectedMapDest}
                  />

                  {/* Sidebar: flights to selected destination */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-surface-900">
                      {selectedDestination
                        ? `Flights to ${selectedDestination.airport.city}, ${selectedDestination.airport.state}`
                        : 'Select a destination'}
                    </h3>
                    {selectedDestination ? (
                      <>
                        <Card padding="sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-surface-500">Lowest price</p>
                              <p className="text-lg font-bold text-emerald-600">
                                {formatPriceCompact(selectedDestination.lowestPrice)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-surface-500">Flights/week</p>
                              <p className="text-lg font-bold text-surface-900">
                                {selectedDestination.flightsPerWeek}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-surface-500">Next available</p>
                              <p className="text-sm font-medium text-surface-700">
                                {selectedDestination.nextAvailable}
                              </p>
                            </div>
                          </div>
                          {selectedDestination.tags.length > 0 && (
                            <div className="flex gap-1.5 mt-3">
                              {selectedDestination.tags.map((tag) => (
                                <Badge key={tag} variant="brand" size="sm">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </Card>
                        {mapDestFlights.length > 0 ? (
                          mapDestFlights.map((f) => (
                            <FlightCard key={f.id} flight={f} compact />
                          ))
                        ) : (
                          <Card padding="lg" className="text-center">
                            <p className="text-sm text-surface-500">
                              No matching flights for this destination on the selected date
                            </p>
                          </Card>
                        )}
                      </>
                    ) : (
                      <Card padding="lg" className="text-center">
                        <MapIcon className="w-8 h-8 text-surface-300 mx-auto mb-2" />
                        <p className="text-sm text-surface-500">
                          Click a destination on the map to see available flights
                        </p>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
