import { useMemo } from 'react';
import { MapPin, Navigation, Clock, Footprints } from 'lucide-react';
import type { RouteInfo, NearestItem, NearbyPlace, EmergencyDestinationType } from '../types';
import { DESTINATION_LABELS } from '../types';

interface RoutePanelProps {
  route: RouteInfo | null;
  destination: NearestItem<NearbyPlace> | null;
  destinationType: EmergencyDestinationType | null;
  routeLoading: boolean;
  onClose: () => void;
}

export default function RoutePanel({
  route,
  destination,
  destinationType,
  routeLoading,
  onClose,
}: RoutePanelProps) {
  const providerLabel = useMemo(() => {
    switch (route?.provider) {
      case 'openrouteservice': return 'OpenRouteService';
      case 'osrm': return 'OSRM';
      case 'straight-line': return 'Estimated (direct)';
      default: return '';
    }
  }, [route]);

  if (routeLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Navigation className="h-4 w-4 animate-spin" />
          Calculating safest route...
        </div>
      </div>
    );
  }

  if (!route && !destination) {
    const label = destinationType ? DESTINATION_LABELS[destinationType].toLowerCase() : 'destination';
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Navigation className="h-4 w-4 text-primary-500" />
            Emergency Route
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">&times;</button>
        </div>
        <p className="text-sm text-gray-500">No nearby {label} found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-4 max-h-80 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Navigation className="h-4 w-4 text-primary-500" />
          Emergency Route
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">&times;</button>
      </div>

      {destination && (
        <div className="flex items-center gap-2 text-sm bg-blue-50 rounded-lg p-2.5 mb-3">
          <MapPin className="h-4 w-4 text-primary-500 shrink-0" />
          <span className="text-gray-700">
            Destination: <strong>{destination.item.name}</strong>
            <span className="text-gray-400 ml-1">({destination.distanceKm.toFixed(1)} km)</span>
          </span>
        </div>
      )}

      {route && (
        <>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {route.durationMin} min
            </span>
            <span className="flex items-center gap-1">
              <Footprints className="h-3.5 w-3.5" />
              {route.distanceKm.toFixed(1)} km
            </span>
            <span className="text-xs text-gray-400 ml-auto">{providerLabel}</span>
          </div>

          {route.steps.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Directions</p>
              <ol className="space-y-1">
                {route.steps.map((step, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-gray-400 font-medium mt-0.5 shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}
