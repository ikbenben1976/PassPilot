import { useState, useRef, useEffect } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

// Sample airport data — in production this would come from an API
const AIRPORTS = [
  { code: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO' },
  { code: 'MCO', name: 'Orlando International', city: 'Orlando', state: 'FL' },
  { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', state: 'NV' },
  { code: 'PHX', name: 'Phoenix Sky Harbor', city: 'Phoenix', state: 'AZ' },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta', city: 'Atlanta', state: 'GA' },
  { code: 'MIA', name: 'Miami International', city: 'Miami', state: 'FL' },
  { code: 'AUS', name: 'Austin-Bergstrom', city: 'Austin', state: 'TX' },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', state: 'CA' },
  { code: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', state: 'WA' },
  { code: 'MSP', name: 'Minneapolis-St Paul', city: 'Minneapolis', state: 'MN' },
  { code: 'DTW', name: 'Detroit Metropolitan', city: 'Detroit', state: 'MI' },
  { code: 'PHL', name: 'Philadelphia International', city: 'Philadelphia', state: 'PA' },
  { code: 'CLE', name: 'Cleveland Hopkins', city: 'Cleveland', state: 'OH' },
  { code: 'RDU', name: 'Raleigh-Durham', city: 'Raleigh', state: 'NC' },
  { code: 'SAN', name: 'San Diego International', city: 'San Diego', state: 'CA' },
  { code: 'BNA', name: 'Nashville International', city: 'Nashville', state: 'TN' },
  { code: 'DFW', name: 'Dallas/Fort Worth', city: 'Dallas', state: 'TX' },
  { code: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', state: 'TX' },
  { code: 'TPA', name: 'Tampa International', city: 'Tampa', state: 'FL' },
  { code: 'BWI', name: 'Baltimore/Washington', city: 'Baltimore', state: 'MD' },
];

interface AirportPickerProps {
  value: string;
  onChange: (code: string) => void;
  label?: string;
  placeholder?: string;
  allowAnywhere?: boolean;
  className?: string;
}

export function AirportPicker({
  value,
  onChange,
  label,
  placeholder = 'Search airports...',
  allowAnywhere,
  className,
}: AirportPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedAirport = AIRPORTS.find((a) => a.code === value);

  const filtered = AIRPORTS.filter((a) => {
    const q = query.toLowerCase();
    return (
      a.code.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.state.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label className="block text-sm font-medium text-surface-700 mb-1.5">
          {label}
        </label>
      )}

      {/* Display / Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
          open
            ? 'border-brand-500 ring-2 ring-brand-500/20'
            : 'border-surface-200 hover:border-surface-300',
          'bg-white',
        )}
      >
        <MapPin className="w-5 h-5 text-surface-400 flex-shrink-0" />
        {selectedAirport ? (
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-surface-900">
              {selectedAirport.code}
            </span>
            <span className="text-surface-500 text-sm ml-2">
              {selectedAirport.city}, {selectedAirport.state}
            </span>
          </div>
        ) : (
          <span className="flex-1 text-surface-400">{placeholder}</span>
        )}
        {value && (
          <X
            className="w-4 h-4 text-surface-400 hover:text-surface-600"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-xl border border-surface-200 shadow-float overflow-hidden animate-fade-in">
          {/* Search input */}
          <div className="p-3 border-b border-surface-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by city, code, or name..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-surface-50 border-0 focus:ring-0 focus:outline-none placeholder:text-surface-400"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto py-1">
            {allowAnywhere && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                  setQuery('');
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-accent-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-surface-900">
                    Anywhere
                  </p>
                  <p className="text-xs text-surface-500">
                    Show all destinations
                  </p>
                </div>
              </button>
            )}

            {filtered.map((airport) => (
              <button
                key={airport.code}
                type="button"
                onClick={() => {
                  onChange(airport.code);
                  setOpen(false);
                  setQuery('');
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-50 transition-colors',
                  value === airport.code && 'bg-brand-50',
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center text-xs font-bold text-surface-700">
                  {airport.code}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 truncate">
                    {airport.name}
                  </p>
                  <p className="text-xs text-surface-500">
                    {airport.city}, {airport.state}
                  </p>
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-surface-500">
                No airports found for &ldquo;{query}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
