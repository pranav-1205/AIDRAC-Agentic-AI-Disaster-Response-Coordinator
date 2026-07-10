import { useMemo } from 'react';
import { MapPin, Navigation, Clock, Footprints } from 'lucide-react';
import type { RouteInfo, NearestItem, NearbyPlace, EmergencyDestinationType } from '../types';
import { DESTINATION_LABELS } from '../types';
import Card from './ui/Card';

interface RoutePanelProps {
  route: RouteInfo | null;
  routeError?: string | null;
  destination: NearestItem<NearbyPlace> | null;
  destinationType: EmergencyDestinationType | null;
  routeLoading: boolean;
  onClose: () => void;
}

export default function RoutePanel({
  route,
  routeError,
  destination,
  destinationType,
  routeLoading,
  onClose,
}: RoutePanelProps) {
  const providerLabel = useMemo(() => {
    switch (route?.provider) {
      case 'openrouteservice': return 'OpenRouteService';
      case 'osrm': return 'OSRM';
      default: return '';
    }
  }, [route]);

  if (routeLoading) {
    return (
      <Card variant="glass" padding="sm">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Navigation className="h-4 w-4 animate-spin" />
          Calculating safest route...
        </div>
      </Card>
    );
  }

  if (routeError && !route) {
    return (
      <Card variant="glass" padding="sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Navigation className="h-3.5 w-3.5 text-primary-400" />
            Route
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-sm cursor-pointer">&times;</button>
        </div>
        <p className="text-xs text-slate-400">{routeError}</p>
      </Card>
    );
  }

  if (!route && !destination) {
    const label = destinationType ? DESTINATION_LABELS[destinationType].toLowerCase() : 'destination';
    return (
      <Card variant="glass" padding="sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Navigation className="h-3.5 w-3.5 text-primary-400" />
            Route
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-sm cursor-pointer">&times;</button>
        </div>
        <p className="text-xs text-slate-500">No nearby {label} found.</p>
      </Card>
    );
  }

  return (
    <Card variant="glass" padding="sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Navigation className="h-3.5 w-3.5 text-primary-400" />
          Route
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-sm cursor-pointer">&times;</button>
      </div>

      {destination && (
        <div className="flex items-center gap-2 text-xs bg-slate-800/60 rounded-lg p-2 mb-2">
          <MapPin className="h-3.5 w-3.5 text-primary-400 shrink-0" />
          <span className="text-slate-300">
            <strong>{destination.item.name}</strong>
            <span className="text-slate-500 ml-1">({destination.distanceKm.toFixed(1)} km)</span>
          </span>
        </div>
      )}

      {route && (
        <>
          <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {route.durationMin} min
            </span>
            <span className="flex items-center gap-1">
              <Footprints className="h-3 w-3" />
              {route.distanceKm.toFixed(1)} km
            </span>
            <span className="text-slate-600 ml-auto">{providerLabel}</span>
          </div>

          {route.steps.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Directions</p>
              <ol className="space-y-0.5">
                {route.steps.map((step, i) => (
                  <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                    <span className="text-slate-600 font-medium shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
