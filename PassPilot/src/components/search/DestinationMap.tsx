import { cn } from '@/lib/cn';
import { formatPriceCompact } from '@/lib/format';
import type { Destination } from '@/types';

interface DestinationMapProps {
  destinations: Destination[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
}

/**
 * Simplified US map visualization showing destinations as positioned bubbles.
 * In production, this would use Mapbox GL or Leaflet for a real interactive map.
 * This version uses approximate lat/lng-to-pixel mapping for a clean preview.
 */
export function DestinationMap({
  destinations,
  selectedCode,
  onSelect,
}: DestinationMapProps) {
  return (
    <div className="relative bg-surface-50 rounded-2xl border border-surface-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-100 bg-white">
        <h3 className="font-semibold text-surface-900">Destination Map</h3>
        <p className="text-sm text-surface-500">
          Click a destination to see available flights
        </p>
      </div>

      {/* Map area */}
      <div className="relative w-full aspect-[16/9] min-h-[400px] p-8">
        {/* US outline silhouette (simplified SVG background) */}
        <svg
          viewBox="0 0 960 600"
          className="absolute inset-0 w-full h-full opacity-[0.06]"
          fill="currentColor"
        >
          <path d="M234,115 L240,95 L260,90 L280,85 L305,88 L330,92 L350,85 L380,78 L410,75 L440,78 L460,72 L480,68 L510,72 L530,78 L555,80 L575,85 L600,82 L625,78 L650,82 L670,88 L690,92 L710,90 L730,95 L750,92 L770,88 L785,95 L795,110 L790,125 L785,140 L790,160 L800,175 L810,195 L820,210 L825,230 L830,250 L825,270 L815,285 L800,295 L785,310 L770,320 L760,340 L745,355 L730,370 L720,385 L710,400 L695,415 L680,425 L665,435 L650,440 L630,445 L610,450 L590,455 L570,458 L550,455 L530,450 L510,445 L490,440 L470,445 L450,450 L430,448 L410,445 L390,440 L370,435 L350,430 L330,425 L310,420 L290,415 L270,410 L250,405 L235,395 L225,380 L218,365 L212,350 L208,330 L205,310 L200,290 L195,270 L192,250 L188,230 L185,210 L190,190 L198,170 L210,150 L220,135 L234,115 Z" />
        </svg>

        {/* Destination bubbles */}
        {destinations.map((dest) => {
          // Simple lat/lng to relative position mapping for continental US
          const x = ((dest.airport.lng + 125) / 60) * 100; // ~-125 to -65 lng
          const y = ((50 - dest.airport.lat) / 25) * 100; // ~25 to 50 lat

          const isSelected = selectedCode === dest.airport.code;

          return (
            <button
              key={dest.airport.code}
              onClick={() => onSelect(dest.airport.code)}
              className={cn(
                'absolute transform -translate-x-1/2 -translate-y-1/2 z-10',
                'group transition-all duration-200',
              )}
              style={{
                left: `${Math.min(Math.max(x, 5), 95)}%`,
                top: `${Math.min(Math.max(y, 5), 95)}%`,
              }}
            >
              {/* Bubble */}
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm',
                  isSelected
                    ? 'bg-brand-600 text-white shadow-glow scale-110'
                    : 'bg-white text-surface-900 hover:bg-brand-50 hover:scale-105 border border-surface-200',
                )}
              >
                <span>{dest.airport.code}</span>
                <span
                  className={cn(
                    'font-bold',
                    isSelected ? 'text-accent-300' : 'text-emerald-600',
                  )}
                >
                  {formatPriceCompact(dest.lowestPrice)}
                </span>
              </div>

              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-surface-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  <p className="font-medium">{dest.airport.city}, {dest.airport.state}</p>
                  <p className="text-surface-400">
                    {dest.flightsPerWeek} flights/week
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-6 py-3 border-t border-surface-100 bg-white flex items-center justify-between">
        <p className="text-xs text-surface-500">
          {destinations.length} destinations shown
        </p>
        <p className="text-xs text-surface-500">
          Prices are taxes + fees for pass flights
        </p>
      </div>
    </div>
  );
}
