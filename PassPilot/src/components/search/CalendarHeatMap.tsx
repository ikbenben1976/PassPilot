import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPriceCompact } from '@/lib/format';
import type { DayAvailability } from '@/types';

interface CalendarHeatMapProps {
  year: number;
  month: number; // 0-indexed
  days: DayAvailability[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const heatColors = [
  'bg-surface-100 text-surface-400', // 0 - no flights
  'bg-brand-50 text-brand-700',       // 1 - few
  'bg-brand-100 text-brand-800',      // 2 - some
  'bg-brand-300 text-white',          // 3 - many
  'bg-brand-600 text-white',          // 4 - lots
];

export function CalendarHeatMap({
  year,
  month,
  days,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: CalendarHeatMapProps) {
  const dayMap = useMemo(() => {
    const m = new Map<string, DayAvailability>();
    days.forEach((d) => m.set(d.date, d));
    return m;
  }, [days]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];

    // Leading blanks
    for (let i = 0; i < firstDay; i++) cells.push(null);
    // Days
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    // Trailing blanks to complete grid
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [year, month]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
      {/* Month header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
        <button
          onClick={onPrevMonth}
          className="p-2 rounded-lg hover:bg-surface-100 text-surface-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-surface-900">
          {MONTH_NAMES[month]} {year}
        </h3>
        <button
          onClick={onNextMonth}
          className="p-2 rounded-lg hover:bg-surface-100 text-surface-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-surface-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, i) => {
            if (day === null) {
              return <div key={`blank-${i}`} className="h-16" />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const avail = dayMap.get(dateStr);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const isPast = dateStr < (today || '');

            return (
              <button
                key={dateStr}
                onClick={() => !isPast && onSelectDate(dateStr)}
                disabled={isPast}
                className={cn(
                  'relative h-16 rounded-lg p-1.5 text-left transition-all duration-150',
                  avail ? heatColors[avail.heatLevel] : heatColors[0],
                  isPast && 'opacity-40 cursor-not-allowed',
                  isSelected && 'ring-2 ring-brand-500 ring-offset-2',
                  isToday && !isSelected && 'ring-2 ring-accent-400 ring-offset-1',
                  !isPast && 'hover:ring-2 hover:ring-brand-300 hover:ring-offset-1 cursor-pointer',
                )}
              >
                <span className="text-xs font-medium">{day}</span>
                {avail && avail.goWildFlights > 0 && (
                  <div className="absolute bottom-1.5 left-1.5 right-1.5">
                    <p className="text-2xs font-bold truncate">
                      {formatPriceCompact(avail.lowestPrice)}
                    </p>
                    <p className="text-2xs opacity-70">
                      {avail.goWildFlights} flights
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-surface-100 flex items-center justify-center gap-4">
        <span className="text-xs text-surface-500">Fewer flights</span>
        <div className="flex gap-1">
          {heatColors.map((color, i) => (
            <div
              key={i}
              className={cn('w-5 h-5 rounded', color.split(' ')[0])}
            />
          ))}
        </div>
        <span className="text-xs text-surface-500">More flights</span>
      </div>
    </div>
  );
}
