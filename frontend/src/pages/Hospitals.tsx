import { Stethoscope, MapPin, Navigation, Tag } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useApi } from '../hooks/useApi';
import { locationApi } from '../services/api';
import type { NearbyResponse } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import LocationStatus from '../components/LocationStatus';

export default function Hospitals() {
  const geo = useGeolocation({ watch: false });
  const position = geo.position;

  const { data: nearby, loading, error, refetch } = useApi<NearbyResponse>(
    () => position ? locationApi.nearby(position.lat, position.lng) : Promise.reject('no gps'),
    [position?.lat, position?.lng]
  );

  if (!position) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
            <p className="text-gray-500 mt-1">Nearby hospitals from OpenStreetMap</p>
          </div>
          <LocationStatus geolocation={geo} />
        </div>
        {geo.loading ? (
          <LoadingSpinner />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">Location Required</h3>
            <p className="text-sm text-gray-400 mb-4">Enable GPS access to find nearby hospitals.</p>
            <button onClick={geo.refresh} className="btn-primary">
              Enable Location
            </button>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
            <p className="text-gray-500 mt-1">Live data from OpenStreetMap</p>
          </div>
          <LocationStatus geolocation={geo} />
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
            <p className="text-gray-500 mt-1">Live data from OpenStreetMap</p>
          </div>
          <LocationStatus geolocation={geo} />
        </div>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  const hospitals = nearby?.hospitals ?? [];
  const sorted = [...hospitals].sort((a, b) => a.distance - b.distance);

  if (sorted.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
            <p className="text-gray-500 mt-1">Live data from OpenStreetMap</p>
          </div>
          <LocationStatus geolocation={geo} />
        </div>
        <EmptyState title="No Hospitals Found" description="No hospitals found near your location on OpenStreetMap." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
          <p className="text-gray-500 mt-1">Live data from OpenStreetMap</p>
        </div>
        <LocationStatus geolocation={geo} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((h, i) => (
          <div key={`${h.latitude}-${h.longitude}-${i}`} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Stethoscope className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{h.name}</h3>
                  {h.address && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Tag className="h-3 w-3" />
                      {h.address}
                    </p>
                  )}
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
                <Navigation className="h-3 w-3" />
                {h.distance < 1
                  ? `${(h.distance * 1000).toFixed(0)} m`
                  : `${h.distance.toFixed(2)} km`}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
