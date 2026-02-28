import { Plane, Clock, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPriceCompact, formatDuration, formatTime } from '@/lib/format';
import { priceCategory } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Flight } from '@/types';

interface FlightCardProps {
  flight: Flight;
  compact?: boolean;
}

export function FlightCard({ flight, compact }: FlightCardProps) {
  const category = priceCategory(flight.price);

  return (
    <Card
      variant="interactive"
      padding={compact ? 'sm' : 'md'}
      className="group"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Flight info */}
        <div className="flex-1 min-w-0">
          {/* Route & badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Badge
              variant={flight.goWildAvailable ? 'success' : 'default'}
              dot
              size="sm"
            >
              {flight.goWildAvailable ? 'Pass' : 'Regular'}
            </Badge>
            {flight.stops === 0 && (
              <Badge variant="info" size="sm">
                Nonstop
              </Badge>
            )}
            {flight.status === 'limited' && (
              <Badge variant="warning" size="sm">
                Few seats left
              </Badge>
            )}
          </div>

          {/* Airport codes & times */}
          <div className="flex items-center gap-4">
            {/* Origin */}
            <div className="text-center">
              <p className="text-xl font-bold text-surface-900">
                {flight.origin.code}
              </p>
              <p className="text-sm text-surface-500">
                {formatTime(flight.departureTime)}
              </p>
            </div>

            {/* Flight line */}
            <div className="flex-1 flex items-center gap-2 px-2">
              <div className="h-px flex-1 bg-surface-200" />
              <div className="flex items-center gap-1 text-surface-400">
                <Plane className="w-4 h-4" />
              </div>
              <div className="h-px flex-1 bg-surface-200" />
            </div>

            {/* Destination */}
            <div className="text-center">
              <p className="text-xl font-bold text-surface-900">
                {flight.destination.code}
              </p>
              <p className="text-sm text-surface-500">
                {formatTime(flight.arrivalTime)}
              </p>
            </div>
          </div>

          {/* Details row */}
          <div className="flex items-center gap-4 mt-3 text-xs text-surface-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(flight.duration)}
            </span>
            <span>{flight.flightNumber}</span>
            <span>
              {flight.destination.city}, {flight.destination.state}
            </span>
          </div>
        </div>

        {/* Price & action */}
        <div className="text-right flex flex-col items-end gap-2">
          <div
            className={cn(
              'text-2xl font-bold',
              category === 'low' && 'text-emerald-600',
              category === 'mid' && 'text-amber-600',
              category === 'high' && 'text-surface-900',
            )}
          >
            {formatPriceCompact(flight.price)}
          </div>
          <p className="text-2xs text-surface-400">taxes + fees</p>
          <Button
            size="sm"
            variant="primary"
            iconRight={<ExternalLink className="w-3.5 h-3.5" />}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Book
          </Button>
        </div>
      </div>
    </Card>
  );
}
