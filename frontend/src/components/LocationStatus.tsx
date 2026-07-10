import { MapPin, Crosshair, AlertCircle } from 'lucide-react';
import type { GeolocationState } from '../types';

interface LocationStatusProps {
  geolocation: GeolocationState & { refresh: () => void };
}

export default function LocationStatus({ geolocation }: LocationStatusProps) {
  const { position, error, loading, permissionDenied, unsupported } = geolocation;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Crosshair className="h-4 w-4 animate-spin" />
        Acquiring GPS...
      </div>
    );
  }

  if (unsupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-yellow-600">
        <AlertCircle className="h-4 w-4" />
        GPS not supported
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="flex items-center gap-2 text-sm text-danger-500">
        <AlertCircle className="h-4 w-4" />
        No GPS permission
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-secondary-500">
        <AlertCircle className="h-4 w-4" />
        {error}
      </div>
    );
  }

  if (position) {
    return (
      <div className="flex items-center gap-2 text-sm text-success-700">
        <MapPin className="h-4 w-4" />
        {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
      </div>
    );
  }

  return null;
}
