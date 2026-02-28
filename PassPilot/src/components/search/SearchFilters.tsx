import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { FlightSearchParams } from '@/types';

interface SearchFiltersProps {
  params: FlightSearchParams;
  onChange: (updates: Partial<FlightSearchParams>) => void;
  totalResults: number;
}

export function SearchFilters({
  params,
  onChange,
  totalResults,
}: SearchFiltersProps) {
  const sortOptions: { value: FlightSearchParams['sortBy']; label: string }[] = [
    { value: 'price', label: 'Price' },
    { value: 'departure', label: 'Departure' },
    { value: 'duration', label: 'Duration' },
    { value: 'destination', label: 'Destination' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-surface-200">
      {/* Left: Filter toggles */}
      <div className="flex items-center gap-3">
        <SlidersHorizontal className="w-4 h-4 text-surface-500" />

        <FilterToggle
          label="Pass Flights Only"
          active={params.goWildOnly}
          onToggle={() => onChange({ goWildOnly: !params.goWildOnly })}
        />
        <FilterToggle
          label="Nonstop"
          active={params.nonstopOnly}
          onToggle={() => onChange({ nonstopOnly: !params.nonstopOnly })}
        />

        {totalResults > 0 && (
          <span className="text-sm text-surface-500 ml-2">
            {totalResults} result{totalResults !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Right: Sort */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-surface-400" />
        <div className="flex bg-surface-100 rounded-lg p-0.5">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ sortBy: opt.value })}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                params.sortBy === opt.value
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterToggle({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
        active
          ? 'bg-brand-50 border-brand-200 text-brand-700'
          : 'bg-white border-surface-200 text-surface-600 hover:border-surface-300',
      )}
    >
      {label}
    </button>
  );
}
