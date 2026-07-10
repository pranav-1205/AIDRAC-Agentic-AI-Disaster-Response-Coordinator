import { useMemo } from 'react';
import MaterialIcon from '../components/ui/MaterialIcon';
import { useGeolocation } from '../hooks/useGeolocation';
import { useApi } from '../hooks/useApi';
import { useSettings } from '../context/SettingsContext';
import { locationApi } from '../services/api';
import type { NearbyResponse, NearbyPlace } from '../types';
import { DESTINATION_LABELS } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import LocationStatus from '../components/LocationStatus';

function typeIcon(type: string) {
  switch (type) {
    case 'shelter': return 'emergency_home';
    case 'community_centre': return 'diversity_3';
    case 'school': return 'school';
    default: return 'domain';
  }
}

function typeBg(type: string) {
  switch (type) {
    case 'shelter': return 'bg-secondary-500/10 border-secondary-500/20 text-secondary-400';
    case 'community_centre': return 'bg-primary-500/10 border-primary-500/20 text-primary-400';
    case 'school': return 'bg-success-500/10 border-success-500/20 text-success-400';
    default: return 'bg-on-surface-variant/10 border-on-surface-variant/20 text-on-surface-variant';
  }
}

interface ShelteredPlace extends NearbyPlace {
  category: string;
}

export default function Shelters() {
  const { settings } = useSettings();
  const geo = useGeolocation({ watch: false });
  const position = geo.position;

  const radiusMeters = settings.emergency_radius * 1000;

  const { data: nearby, loading, error, refetch } = useApi<NearbyResponse>(
    () => position ? locationApi.nearby(position.lat, position.lng, radiusMeters) : Promise.reject('no gps'),
    [position?.lat, position?.lng, radiusMeters]
  );

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold font-display text-on-surface tracking-tight">Shelters</h1>
        <p className="text-sm text-on-surface-variant mt-1 font-mono uppercase tracking-widest">Emergency shelters, community centres, and schools</p>
      </div>
      <LocationStatus geolocation={geo} />
    </div>
  );

  if (!position) {
    return (
      <div className="space-y-6">
        {renderHeader()}
        {geo.loading ? (
          <LoadingSpinner />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MaterialIcon icon="location_off" className="text-6xl text-on-surface-variant/40 mb-4" />
            <h3 className="text-lg font-medium text-on-surface mb-1">Location Required</h3>
            <p className="text-sm text-on-surface-variant mb-4">Enable GPS access to find nearby shelters.</p>
            <Button variant="primary" onClick={geo.refresh}>Enable Location</Button>
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div className="space-y-6">{renderHeader()}<LoadingSpinner /></div>;
  if (error) return <div className="space-y-6">{renderHeader()}<ErrorState message={error} onRetry={refetch} /></div>;

  const combined: ShelteredPlace[] = [
    ...(nearby?.shelters ?? []).map((p) => ({ ...p, category: 'shelter' })),
    ...(nearby?.community_centres ?? []).map((p) => ({ ...p, category: 'community_centre' })),
    ...(nearby?.schools ?? []).map((p) => ({ ...p, category: 'school' })),
  ];

  const sorted = combined.sort((a, b) => a.distance - b.distance);

  if (sorted.length === 0) {
    return (
      <div className="space-y-6">
        {renderHeader()}
        <EmptyState title="No Shelters Found" description="No shelters, community centres, or schools found near your location on OpenStreetMap." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderHeader()}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.map((s, i) => (
          <Card key={`${s.category}-${s.latitude}-${s.longitude}-${i}`} variant="default" padding="md" className="group hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 border rounded-xl ${typeBg(s.category)}`}>
                  <MaterialIcon icon={typeIcon(s.category)} className="text-2xl" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-lg tracking-wide">{s.name}</h3>
                  <p className="text-sm font-mono uppercase tracking-widest text-on-surface-variant mt-0.5">
                    {DESTINATION_LABELS[s.category as keyof typeof DESTINATION_LABELS] ?? s.category}
                  </p>
                  {s.address && (
                    <p className="text-sm font-mono text-on-surface-variant uppercase tracking-widest flex items-center gap-1 mt-1">
                      <MaterialIcon icon="sell" className="text-sm" />
                      <span className="truncate max-w-[200px] lg:max-w-[300px]">{s.address}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-4 border-t border-[var(--card-border)]">
              <div className="flex items-center gap-1.5 text-on-surface-variant font-mono text-sm">
                <MaterialIcon icon="my_location" className="text-base" />
                {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
              </div>
              <span className="flex items-center gap-1 text-sm uppercase font-mono tracking-widest px-3 py-1.5 rounded bg-primary-500/[0.12] text-primary-400 border border-primary-500/[0.25] whitespace-nowrap">
                <MaterialIcon icon="navigation" className="text-sm" />
                {s.distance < 1
                  ? `${(s.distance * 1000).toFixed(0)} m`
                  : `${(s.distance).toFixed(2)} km`}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
