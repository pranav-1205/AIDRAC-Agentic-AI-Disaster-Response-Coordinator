import { Building2, MapPin, Navigation, Tag, Home, Users } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useApi } from '../hooks/useApi';
import { locationApi } from '../services/api';
import type { NearbyResponse, NearbyPlace } from '../types';
import { DESTINATION_LABELS } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import LocationStatus from '../components/LocationStatus';

function typeIcon(type: string) {
  switch (type) {
    case 'shelter': return <Home className="h-5 w-5 text-emergency-500" />;
    case 'community_centre': return <Users className="h-5 w-5 text-blue-500" />;
    case 'school': return <Building2 className="h-5 w-5 text-green-500" />;
    default: return <Building2 className="h-5 w-5 text-emergency-500" />;
  }
}

function typeBg(type: string) {
  switch (type) {
    case 'shelter': return 'bg-orange-50';
    case 'community_centre': return 'bg-blue-50';
    case 'school': return 'bg-green-50';
    default: return 'bg-orange-50';
  }
}

interface ShelteredPlace extends NearbyPlace {
  category: string;
}

export default function Shelters() {
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
            <h1 className="text-2xl font-bold text-gray-900">Shelters</h1>
            <p className="text-gray-500 mt-1">Emergency shelters, community centres, and schools from OpenStreetMap</p>
          </div>
          <LocationStatus geolocation={geo} />
        </div>
        {geo.loading ? (
          <LoadingSpinner />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">Location Required</h3>
            <p className="text-sm text-gray-400 mb-4">Enable GPS access to find nearby shelters.</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Shelters</h1>
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
            <h1 className="text-2xl font-bold text-gray-900">Shelters</h1>
            <p className="text-gray-500 mt-1">Live data from OpenStreetMap</p>
          </div>
          <LocationStatus geolocation={geo} />
        </div>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  const combined: ShelteredPlace[] = [
    ...(nearby?.shelters ?? []).map((p) => ({ ...p, category: 'shelter' })),
    ...(nearby?.community_centres ?? []).map((p) => ({ ...p, category: 'community_centre' })),
    ...(nearby?.schools ?? []).map((p) => ({ ...p, category: 'school' })),
  ];

  const sorted = combined.sort((a, b) => a.distance - b.distance);

  if (sorted.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shelters</h1>
            <p className="text-gray-500 mt-1">Live data from OpenStreetMap</p>
          </div>
          <LocationStatus geolocation={geo} />
        </div>
        <EmptyState title="No Shelters Found" description="No shelters, community centres, or schools found near your location on OpenStreetMap." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shelters</h1>
          <p className="text-gray-500 mt-1">Live data from OpenStreetMap</p>
        </div>
        <LocationStatus geolocation={geo} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((s, i) => (
          <div key={`${s.category}-${s.latitude}-${s.longitude}-${i}`} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${typeBg(s.category)}`}>
                  {typeIcon(s.category)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {DESTINATION_LABELS[s.category as keyof typeof DESTINATION_LABELS] ?? s.category}
                  </p>
                  {s.address && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Tag className="h-3 w-3" />
                      {s.address}
                    </p>
                  )}
                </div>
              </div>
              <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700 whitespace-nowrap">
                <Navigation className="h-3 w-3" />
                {s.distance < 1
                  ? `${(s.distance * 1000).toFixed(0)} m`
                  : `${(s.distance).toFixed(2)} km`}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
