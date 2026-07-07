import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useApi } from '../hooks/useApi';
import { useGeolocation } from '../hooks/useGeolocation';
import { shelterApi, hospitalApi, disasterApi } from '../services/api';
import { findNearest, sortByDistance } from '../utils/haversine';
import { getRoute } from '../utils/routing';
import type { Shelter, Hospital, Disaster, RouteInfo, NearestItem, GeoPosition } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import LocationStatus from '../components/LocationStatus';
import RoutePanel from '../components/RoutePanel';

const userIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#1e40af;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:16px;">📍</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const shelterIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#f97316;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;">🏠</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const hospitalIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#dc2626;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;">🏥</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const disasterIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#991b1b;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid #fca5a5;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:16px;">⚠️</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const nearestShelterIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#15803d;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:3px solid #86efac;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:18px;">🏠</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function severityRadius(severity: string): number {
  switch (severity) {
    case 'critical': return 3000;
    case 'severe': return 2000;
    case 'high': return 1500;
    case 'moderate': return 1000;
    default: return 500;
  }
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'severe': return '#ea580c';
    case 'high': return '#ca8a04';
    default: return '#2563eb';
  }
}

function FlyTo({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom || map.getZoom(), { duration: 1 });
  }, [center, zoom, map]);
  return null;
}

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50], duration: 1 });
  }, [bounds, map]);
  return null;
}

export default function MapPage() {
  const location = useLocation();
  const navState = location.state as {
    emergencyRoute?: boolean;
    nearestShelter?: NearestItem<Shelter>;
    nearestHospital?: NearestItem<Hospital>;
    userPosition?: GeoPosition;
  } | null;

  const geolocation = useGeolocation({ watch: true });
  const [activeLayer, setActiveLayer] = useState<'all' | 'shelters' | 'hospitals' | 'disasters'>('all');
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showRoutePanel, setShowRoutePanel] = useState(!!navState?.emergencyRoute);

  const position = navState?.userPosition || geolocation.position;
  const posTuple: [number, number] = position ? [position.lat, position.lng] : [28.6139, 77.209];

  const { data: shelters, loading: sheltersLoading } = useApi<Shelter[]>(() => shelterApi.getAll());
  const { data: hospitals, loading: hospitalsLoading } = useApi<Hospital[]>(() => hospitalApi.getAll());
  const { data: disasters, loading: disastersLoading } = useApi<Disaster[]>(() => disasterApi.getAll());

  const loading = sheltersLoading || hospitalsLoading || disastersLoading;

  const nearestShelter = useMemo(
    () => (shelters && position ? findNearest(shelters, position.lat, position.lng) : null),
    [shelters, position]
  );

  const nearestHospital = useMemo(
    () => (hospitals && position ? findNearest(hospitals, position.lat, position.lng) : null),
    [hospitals, position]
  );

  const sortedShelters = useMemo(
    () => (shelters && position ? sortByDistance(shelters, position.lat, position.lng).slice(0, 5) : []),
    [shelters, position]
  );

  const sortedHospitals = useMemo(
    () => (hospitals && position ? sortByDistance(hospitals, position.lat, position.lng).slice(0, 5) : []),
    [hospitals, position]
  );

  const fetchRoute = useCallback(async () => {
    if (!position || !nearestShelter) return;
    setRouteLoading(true);
    try {
      const routeData = await getRoute(
        [position.lat, position.lng],
        [nearestShelter.item.latitude, nearestShelter.item.longitude]
      );
      setRoute(routeData);
    } finally {
      setRouteLoading(false);
    }
  }, [position, nearestShelter]);

  useEffect(() => {
    if (showRoutePanel && position && nearestShelter) {
      fetchRoute();
    }
  }, [showRoutePanel, position, nearestShelter, fetchRoute]);

  const routeBounds = useMemo(() => {
    if (!route?.coordinates.length) return null;
    return L.latLngBounds(
      route.coordinates.map((c) => L.latLng(c[0], c[1]))
    );
  }, [route]);

  const shouldShowNearestMarker = activeLayer === 'all' || activeLayer === 'shelters';

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interactive Map</h1>
          <p className="text-gray-500 mt-1">Disaster zones, shelters, and hospitals</p>
        </div>
        <div className="flex items-center gap-3">
          <LocationStatus geolocation={geolocation} />
          <div className="flex gap-2">
            {(['all', 'shelters', 'hospitals', 'disasters'] as const).map((layer) => (
              <button
                key={layer}
                onClick={() => setActiveLayer(layer)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeLayer === layer
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {layer.charAt(0).toUpperCase() + layer.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="card p-0 overflow-hidden" style={{ height: '600px' }}>
          <MapContainer center={posTuple} zoom={13} className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <FlyTo center={posTuple} zoom={13} />

            {routeBounds && <FitBounds bounds={routeBounds} />}

            {/* Route polyline */}
            {route && route.coordinates.length > 1 && (
              <Polyline
                positions={route.coordinates}
                pathOptions={{
                  color: '#1e40af',
                  weight: 4,
                  opacity: 0.8,
                  dashArray: '10, 6',
                }}
              />
            )}

            {/* User location */}
            <Marker position={posTuple} icon={userIcon}>
              <Popup>
                <div className="text-sm font-medium">You are here</div>
              </Popup>
            </Marker>

            {/* Nearest shelter highlight */}
            {shouldShowNearestMarker && nearestShelter && (
              <Marker
                position={[nearestShelter.item.latitude, nearestShelter.item.longitude]}
                icon={nearestShelterIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-medium text-green-700">Nearest Shelter</p>
                    <p className="font-medium">{nearestShelter.item.name}</p>
                    <p>Distance: {nearestShelter.distanceKm.toFixed(2)} km</p>
                    <p>Capacity: {nearestShelter.item.occupancy}/{nearestShelter.item.capacity}</p>
                    {nearestShelter.item.address && (
                      <p className="text-xs text-gray-500">{nearestShelter.item.address}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* All shelters */}
            {(activeLayer === 'all' || activeLayer === 'shelters') &&
              shelters?.map((s) => {
                if (nearestShelter && s.id === nearestShelter.item.id) return null;
                return (
                  <Marker key={`s-${s.id}`} position={[s.latitude, s.longitude]} icon={shelterIcon}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-medium">{s.name}</p>
                        <p>Capacity: {s.occupancy}/{s.capacity}</p>
                        {s.address && <p className="text-xs text-gray-500">{s.address}</p>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Hospitals */}
            {(activeLayer === 'all' || activeLayer === 'hospitals') &&
              hospitals?.map((h) => (
                <Marker key={`h-${h.id}`} position={[h.latitude, h.longitude]} icon={hospitalIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{h.name}</p>
                      <p className={h.emergency_available ? 'text-green-600' : 'text-red-600'}>
                        {h.emergency_available ? 'Emergency Available' : 'No Emergency'}
                      </p>
                      {position && (
                        <p className="text-xs text-gray-500 mt-1">
                          {findNearest([h], position.lat, position.lng)?.distanceKm.toFixed(2)} km away
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Disasters with radius circles */}
            {(activeLayer === 'all' || activeLayer === 'disasters') &&
              disasters?.map((d) => (
                <div key={`d-${d.id}`}>
                  <Marker position={[d.latitude, d.longitude]} icon={disasterIcon}>
                    <Popup>
                      <div className="text-sm max-w-48">
                        <p className="font-medium">{d.type}</p>
                        <p className="capitalize">Severity: {d.severity}</p>
                        <p className="capitalize">Status: {d.status}</p>
                        {d.description && <p className="text-xs text-gray-500 mt-1">{d.description}</p>}
                        {position && (
                          <p className="text-xs text-gray-400 mt-1">
                            {findNearest([d as Disaster], position.lat, position.lng)?.distanceKm.toFixed(2)} km away
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={[d.latitude, d.longitude]}
                    radius={severityRadius(d.severity)}
                    pathOptions={{
                      color: severityColor(d.severity),
                      fillColor: severityColor(d.severity),
                      fillOpacity: 0.08,
                      weight: 2,
                    }}
                  />
                </div>
              ))}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <button
            onClick={() => {
              setShowRoutePanel((p) => !p);
              if (!showRoutePanel) fetchRoute();
            }}
            className={`w-full py-2.5 rounded-lg font-medium transition-all ${
              showRoutePanel
                ? 'bg-primary-500 text-white'
                : 'bg-emergency-50 text-emergency-600 border border-emergency-200 hover:bg-emergency-100'
            }`}
          >
            {showRoutePanel ? 'Hide Route Info' : 'Show Safest Route'}
          </button>

          {showRoutePanel && (
            <RoutePanel
              route={route}
              nearestShelter={nearestShelter}
              nearestHospital={nearestHospital}
              routeLoading={routeLoading}
              onClose={() => setShowRoutePanel(false)}
            />
          )}

          {/* Nearest shelters list */}
          {sortedShelters.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Nearest Shelters</h3>
              <div className="space-y-2">
                {sortedShelters.map((s) => (
                  <div key={s.item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate max-w-[180px]">{s.item.name}</span>
                    <span className="text-gray-400 shrink-0 ml-2">{s.distanceKm.toFixed(1)} km</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearest hospitals list */}
          {sortedHospitals.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Nearest Hospitals</h3>
              <div className="space-y-2">
                {sortedHospitals.map((h) => (
                  <div key={h.item.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate max-w-[180px]">{h.item.name}</span>
                    <span className="text-gray-400 shrink-0 ml-2">{h.distanceKm.toFixed(1)} km</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary-500 inline-block" /> Your Location</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emergency-500 inline-block" /> Shelter</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Hospital</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-900 inline-block" /> Disaster Zone</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> Nearest Shelter</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 w-6 border-t-2 border-primary-500 border-dashed inline-block" /> Evacuation Route</span>
      </div>
    </div>
  );
}
