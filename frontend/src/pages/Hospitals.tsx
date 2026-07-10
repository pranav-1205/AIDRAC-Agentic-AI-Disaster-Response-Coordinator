import MaterialIcon from '../components/ui/MaterialIcon';
import { useGeolocation } from '../hooks/useGeolocation';
import { useApi } from '../hooks/useApi';
import { useSettings } from '../context/SettingsContext';
import { locationApi } from '../services/api';
import type { NearbyResponse } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import LocationStatus from '../components/LocationStatus';

export default function Hospitals() {
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
        <h1 className="text-3xl font-bold font-display text-on-surface tracking-tight">Hospitals</h1>
        <p className="text-sm text-on-surface-variant mt-1 font-mono uppercase tracking-widest">Live data from OpenStreetMap</p>
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
            <p className="text-sm text-on-surface-variant mb-4">Enable GPS access to find nearby hospitals.</p>
            <Button variant="primary" onClick={geo.refresh}>Enable Location</Button>
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div className="space-y-6">{renderHeader()}<LoadingSpinner /></div>;
  if (error) return <div className="space-y-6">{renderHeader()}<ErrorState message={error} onRetry={refetch} /></div>;

  const hospitals = nearby?.hospitals ?? [];
  const sorted = [...hospitals].sort((a, b) => a.distance - b.distance);

  if (sorted.length === 0) {
    return (
      <div className="space-y-6">
        {renderHeader()}
        <EmptyState title="No Hospitals Found" description="No hospitals found near your location on OpenStreetMap." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderHeader()}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.map((h, i) => (
          <Card key={`${h.latitude}-${h.longitude}-${i}`} variant="default" padding="md" className="group hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-danger-500/10 border border-danger-500/20 rounded-xl">
                  <MaterialIcon icon="local_hospital" className="text-2xl text-danger-400" />
                </div>
                <div>
                  <h3 className="font-bold text-on-surface text-lg tracking-wide">{h.name}</h3>
                  {h.address && (
                    <p className="text-sm font-mono text-on-surface-variant uppercase tracking-widest flex items-center gap-1 mt-1">
                      <MaterialIcon icon="sell" className="text-sm" />
                      <span className="truncate max-w-[200px] lg:max-w-[300px]">{h.address}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-4 border-t border-[var(--card-border)]">
              <div className="flex items-center gap-1.5 text-on-surface-variant font-mono text-sm">
                <MaterialIcon icon="my_location" className="text-base" />
                {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
              </div>
              <span className="flex items-center gap-1 text-sm uppercase font-mono tracking-widest px-3 py-1.5 rounded bg-primary-500/[0.12] text-primary-400 border border-primary-500/[0.25] whitespace-nowrap">
                <MaterialIcon icon="navigation" className="text-sm" />
                {h.distance < 1
                  ? `${(h.distance * 1000).toFixed(0)} m`
                  : `${h.distance.toFixed(2)} km`}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
