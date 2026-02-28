import { useState } from 'react';
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
import { MOCK_FLIGHTS, MOCK_CALENDAR, MOCK_DESTINATIONS } from '@/lib/mockData';

const VIEW_TABS = [
  { id: 'list', label: 'List', icon: <List className="w-4 h-4" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
  { id: 'map', label: 'Map', icon: <MapIcon className="w-4 h-4" /> },
];

export function SearchPage() {
  const { params, setParams } = useSearchStore();
  const [view, setView] = useState('list');
  const [calMonth, setCalMonth] = useState({ year: 2026, month: 1 }); // Feb 2026
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMapDest, setSelectedMapDest] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // In production these would come from API; using mock data for architecture
  const flights = MOCK_FLIGHTS;
  const calendarDays = MOCK_CALENDAR;
  const destinations = MOCK_DESTINATIONS;

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
                  {flights.map((flight) => (
                    <FlightCard key={flight.id} flight={flight} />
                  ))}
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
                      flights.slice(0, 5).map((f) => (
                        <FlightCard key={f.id} flight={f} compact />
                      ))
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
                <DestinationMap
                  destinations={destinations}
                  selectedCode={selectedMapDest}
                  onSelect={setSelectedMapDest}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
