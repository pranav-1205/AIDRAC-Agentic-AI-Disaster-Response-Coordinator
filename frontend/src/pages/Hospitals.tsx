import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MaterialIcon from '../components/ui/MaterialIcon';
import { useGeolocation } from '../hooks/useGeolocation';
import { useApi } from '../hooks/useApi';
import { useSettings } from '../context/SettingsContext';
import { locationApi } from '../services/api';
import type { NearbyResponse, NearbyPlace, EmergencyDestinationType, GeoPosition } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import LocationStatus from '../components/LocationStatus';
import { useProgressiveList } from '../hooks/useProgressiveList';

function isPositionFresh(position: GeoPosition | null, staleThresholdMs = 30000): boolean {
  if (!position) return false;
  return Date.now() - position.timestamp < staleThresholdMs;
}

function isPositionAccurate(position: GeoPosition | null, maxAccuracyMeters = 100): boolean {
  if (!position) return false;
  return position.accuracy <= maxAccuracyMeters;
}

export default function Hospitals() {
  const { settings } = useSettings();
  const geo = useGeolocation({ watch: false });
  const browserPosition = geo.position;
  const hasFreshPosition = isPositionFresh(browserPosition) && isPositionAccurate(browserPosition);
  const position = hasFreshPosition ? browserPosition : null;
  const navigate = useNavigate();

  const radiusMeters = settings.emergency_radius * 1000;

  const handleNavigate = (place: NearbyPlace) => {
    navigate('/map', {
      state: {
        emergencyRoute: true,
        userPosition: position ?? browserPosition ?? undefined,
        destinationType: 'hospital' as EmergencyDestinationType,
        destinationItem: { item: place, distanceKm: place.distance },
      },
    });
  };

  const { data: nearby, loading, error, forceRefetch } = useApi<NearbyResponse>(
    (force) => (position ? locationApi.nearby(position.lat, position.lng, radiusMeters, { force }) : Promise.reject('no gps')),
    [position?.lat, position?.lng, radiusMeters]
  );

  const renderHeader = () => (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold font-display text-on-surface tracking-tight">Hospitals</h1>
        <p className="text-sm text-on-surface-variant mt-1 font-mono uppercase tracking-widest">Live data from OpenStreetMap</p>
      </div>
      <LocationStatus geolocation={geo} showDetails={true} />
    </div>
  );

  // -------------------------
  // ALL HOOKS - before any conditional return
  // -------------------------

  const hospitals = useMemo(() => nearby?.hospitals ?? [], [nearby]);

  const sorted = useMemo(
    () => [...hospitals].sort((a, b) => a.distance - b.distance),
    [hospitals]
  );

  const {
    visibleItems,
    visibleCount,
    totalCount,
    hasMore,
    loadMore,
  } = useProgressiveList(sorted, {
    initialCount: 25,
    increment: 20,
  });

  // -------------------------
  // Conditional returns - AFTER all hooks
  // -------------------------

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
  if (error) return <div className="space-y-6">{renderHeader()}<ErrorState message={error} onRetry={forceRefetch} /></div>;

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

      {/* Result counter */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-mono text-on-surface-variant">
          Showing {visibleCount} of {totalCount} hospital{totalCount !== 1 ? 's' : ''}
        </p>

        {hasMore && (
          <Button
            variant="secondary"
            size="sm"
            onClick={loadMore}
            className="ml-auto"
          >
            <MaterialIcon icon="expand_more" className="h-4 w-4" />
            Load More
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleItems.map((h, i) => {
          const isPriority = i < 5;
          return (
            <Card key={`${h.latitude}-${h.longitude}-${i}`} variant="default" padding="md" className="group hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-danger-500/10 border border-danger-500/20 rounded-xl">
                    <MaterialIcon icon="local_hospital" className="text-2xl text-danger-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-on-surface text-lg tracking-wide">{h.name}</h3>
                      {isPriority && (
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-white bg-primary-500 rounded">
                          PRIORITY
                        </span>
                      )}
                    </div>
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
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm uppercase font-mono tracking-widest px-3 py-1.5 rounded bg-primary-500/[0.12] text-primary-400 border border-primary-500/[0.25] whitespace-nowrap">
                    <MaterialIcon icon="navigation" className="text-sm" />
                    {h.distance < 1
                      ? `${(h.distance * 1000).toFixed(0)} m`
                      : `${h.distance.toFixed(2)} km`}
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<MaterialIcon icon="navigation" className="h-4 w-4" />}
                    onClick={() => handleNavigate(h)}
                    className="whitespace-nowrap"
                  >
                    Navigate
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
