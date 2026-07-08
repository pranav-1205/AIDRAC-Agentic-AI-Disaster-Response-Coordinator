import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useApi } from '../hooks/useApi';
import { useGeolocation } from '../hooks/useGeolocation';
import { shelterApi, hospitalApi, disasterApi, locationApi } from '../services/api';
import { findNearest, sortByDistance } from '../utils/haversine';
import { getRoute } from '../utils/routing';
import type {
  Shelter, Hospital, Disaster, RouteInfo, NearestItem, GeoPosition,
  NearbyPlace, NearbyResponse, EmergencyDestinationType,
} from '../types';
import { DESTINATION_LABELS } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import LocationStatus from '../components/LocationStatus';
import RoutePanel from '../components/RoutePanel';
import { Navigation } from 'lucide-react';

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

const policeIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#1d4ed8;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;">👮</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const fireIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#b91c1c;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;">🔥</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const pharmacyIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#059669;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;">💊</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const disasterIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#991b1b;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid #fca5a5;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:16px;">⚠️</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const DEST_ICON_CONFIG: Record<EmergencyDestinationType, { bg: string; border: string; emoji: string }> = {
  shelter: { bg: '#f97316', border: '#fed7aa', emoji: '🏠' },
  community_centre: { bg: '#0d9488', border: '#ccfbf1', emoji: '👥' },
  school: { bg: '#ca8a04', border: '#fef9c3', emoji: '📚' },
  hospital: { bg: '#dc2626', border: '#fca5a5', emoji: '❤️' },
  police: { bg: '#1d4ed8', border: '#bfdbfe', emoji: '👮' },
  firestation: { bg: '#b91c1c', border: '#fecaca', emoji: '🔥' },
  pharmacy: { bg: '#059669', border: '#a7f3d0', emoji: '💊' },
};

function getDestinationIcon(type: EmergencyDestinationType): L.DivIcon {
  const cfg = DEST_ICON_CONFIG[type];
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${cfg.bg};color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:3px solid ${cfg.border};box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:18px;">${cfg.emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

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

type LayerKey = 'all' | 'shelters' | 'hospitals' | 'disasters' | 'police' | 'firestations' | 'pharmacies';

const LAYERS: { key: LayerKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'shelters', label: 'Shelters' },
  { key: 'hospitals', label: 'Hospitals' },
  { key: 'police', label: 'Police' },
  { key: 'firestations', label: 'Fire' },
  { key: 'pharmacies', label: 'Pharmacy' },
  { key: 'disasters', label: 'Disasters' },
];

export default function MapPage() {
  const location = useLocation();
  const navState = location.state as {
    emergencyRoute?: boolean;
    userPosition?: GeoPosition;
    destinationType?: EmergencyDestinationType;
    destinationItem?: NearestItem<NearbyPlace>;
  } | null;

  const geolocation = useGeolocation({ watch: true });
  const [activeLayer, setActiveLayer] = useState<LayerKey>('all');
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [showRoutePanel, setShowRoutePanel] = useState(!!navState?.emergencyRoute);

  const position = navState?.userPosition || geolocation.position;
  const hasGps = !!position;
  const posTuple: [number, number] = position ? [position.lat, position.lng] : [28.6139, 77.209];

  const { data: dbShelters, loading: dbSheltersLoading } = useApi<Shelter[]>(() => shelterApi.getAll());
  const { data: dbHospitals, loading: dbHospitalsLoading } = useApi<Hospital[]>(() => hospitalApi.getAll());
  const { data: disasters, loading: disastersLoading } = useApi<Disaster[]>(() => disasterApi.getAll());

  const { data: nearby, loading: nearbyLoading, refetch: refetchNearby } = useApi<NearbyResponse>(
    () => position ? locationApi.nearby(position.lat, position.lng) : Promise.reject('no gps'),
    [position?.lat, position?.lng]
  );

  const loading = dbSheltersLoading || dbHospitalsLoading || disastersLoading;
  const overpassLoaded = !nearbyLoading && !!nearby;

  const liveShelters = useMemo(() => nearby?.shelters ?? [], [nearby]);
  const liveHospitals = useMemo(() => nearby?.hospitals ?? [], [nearby]);
  const livePolice = useMemo(() => nearby?.police ?? [], [nearby]);
  const liveFirestations = useMemo(() => nearby?.firestations ?? [], [nearby]);
  const livePharmacies = useMemo(() => nearby?.pharmacies ?? [], [nearby]);

  const allShelters: NearbyPlace[] = useMemo(() => {
    if (hasGps) return overpassLoaded ? liveShelters : [];
    return (dbShelters ?? []).map((s) => ({
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      distance: 0,
      address: s.address ?? null,
    }));
  }, [liveShelters, dbShelters, hasGps, overpassLoaded]);

  const allHospitals: (NearbyPlace & { emergency_available?: boolean })[] = useMemo(() => {
    if (hasGps) return overpassLoaded ? liveHospitals : [];
    return (dbHospitals ?? []).map((h) => ({
      name: h.name,
      latitude: h.latitude,
      longitude: h.longitude,
      distance: 0,
      address: h.address ?? null,
      emergency_available: h.emergency_available,
    }));
  }, [liveHospitals, dbHospitals, hasGps, overpassLoaded]);

  const destinationType: EmergencyDestinationType | null = navState?.destinationType ?? null;
  const destination: NearestItem<NearbyPlace> | null = navState?.destinationItem ?? null;

  const sortedShelters = useMemo(
    () => (allShelters.length > 0 && position ? sortByDistance(allShelters, position.lat, position.lng).slice(0, 5) : []),
    [allShelters, position]
  );

  const sortedHospitals = useMemo(
    () => (allHospitals.length > 0 && position ? sortByDistance(allHospitals, position.lat, position.lng).slice(0, 5) : []),
    [allHospitals, position]
  );

  const fetchRoute = useCallback(async () => {
    if (!position || !destination) return;
    setRouteLoading(true);
    try {
      const routeData = await getRoute(
        [position.lat, position.lng],
        [destination.item.latitude, destination.item.longitude]
      );
      setRoute(routeData);
    } finally {
      setRouteLoading(false);
    }
  }, [position, destination]);

  useEffect(() => {
    if (showRoutePanel && position && destination) {
      fetchRoute();
    }
  }, [showRoutePanel, position, destination, fetchRoute]);

  useEffect(() => { if (position) refetchNearby(); }, [position?.lat, position?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const routeBounds = useMemo(() => {
    if (!route?.coordinates.length) return null;
    return L.latLngBounds(
      route.coordinates.map((c) => L.latLng(c[0], c[1]))
    );
  }, [route]);

  const showShelters = activeLayer === 'all' || activeLayer === 'shelters';
  const showHospitals = activeLayer === 'all' || activeLayer === 'hospitals';
  const showPolice = activeLayer === 'all' || activeLayer === 'police';
  const showFirestations = activeLayer === 'all' || activeLayer === 'firestations';
  const showPharmacies = activeLayer === 'all' || activeLayer === 'pharmacies';
  const showDisasters = activeLayer === 'all' || activeLayer === 'disasters';

  if (loading && !nearby) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interactive Map</h1>
          <p className="text-gray-500 mt-1">Live infrastructure from OpenStreetMap</p>
        </div>
        <div className="flex items-center gap-3">
          <LocationStatus geolocation={geolocation} />
          <div className="flex gap-1 flex-wrap">
            {LAYERS.map((layer) => (
              <button
                key={layer.key}
                onClick={() => setActiveLayer(layer.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeLayer === layer.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {layer.label}
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

            {route && route.coordinates.length > 1 && (
              <Polyline
                positions={route.coordinates}
                pathOptions={{ color: '#1e40af', weight: 4, opacity: 0.8, dashArray: '10, 6' }}
              />
            )}

            {/* User location */}
            <Marker position={posTuple} icon={userIcon}>
              <Popup><div className="text-sm font-medium">You are here</div></Popup>
            </Marker>

            {/* Destination highlight */}
            {destination && (
              <Marker
                position={[destination.item.latitude, destination.item.longitude]}
                icon={getDestinationIcon(destinationType ?? 'shelter')}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-medium text-green-700">
                      {destinationType ? DESTINATION_LABELS[destinationType] : 'Destination'}
                    </p>
                    <p className="font-medium">{destination.item.name}</p>
                    <p>Distance: {destination.distanceKm.toFixed(2)} km</p>
                    {destination.item.address && (
                      <p className="text-xs text-gray-500">{destination.item.address}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Shelters */}
            {showShelters &&
              allShelters.map((s, i) => {
                if (destination && s.name === destination.item.name && s.latitude === destination.item.latitude) return null;
                return (
                  <Marker key={`s-${i}`} position={[s.latitude, s.longitude]} icon={shelterIcon}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.distance.toFixed(2)} km away</p>
                        {s.address && <p className="text-xs text-gray-500">{s.address}</p>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Hospitals */}
            {showHospitals &&
              allHospitals.map((h, i) => {
                if (destination && h.name === destination.item.name && h.latitude === destination.item.latitude) return null;
                return (
                  <Marker key={`h-${i}`} position={[h.latitude, h.longitude]} icon={hospitalIcon}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-medium">{h.name}</p>
                        <p className="text-xs text-gray-500">{h.distance.toFixed(2)} km away</p>
                        {(h as any).emergency_available !== undefined && (
                          <p className={(h as any).emergency_available ? 'text-green-600 text-xs' : 'text-red-600 text-xs'}>
                            {(h as any).emergency_available ? 'Emergency Available' : 'No Emergency'}
                          </p>
                        )}
                        {h.address && <p className="text-xs text-gray-500">{h.address}</p>}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

            {/* Police stations */}
            {showPolice &&
              livePolice.map((p, i) => (
                <Marker key={`p-${i}`} position={[p.latitude, p.longitude]} icon={policeIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.distance.toFixed(2)} km away</p>
                      {p.address && <p className="text-xs text-gray-500">{p.address}</p>}
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Fire stations */}
            {showFirestations &&
              liveFirestations.map((f, i) => (
                <Marker key={`f-${i}`} position={[f.latitude, f.longitude]} icon={fireIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{f.name}</p>
                      <p className="text-xs text-gray-500">{f.distance.toFixed(2)} km away</p>
                      {f.address && <p className="text-xs text-gray-500">{f.address}</p>}
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Pharmacies */}
            {showPharmacies &&
              livePharmacies.map((ph, i) => (
                <Marker key={`ph-${i}`} position={[ph.latitude, ph.longitude]} icon={pharmacyIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{ph.name}</p>
                      <p className="text-xs text-gray-500">{ph.distance.toFixed(2)} km away</p>
                      {ph.address && <p className="text-xs text-gray-500">{ph.address}</p>}
                    </div>
                  </Popup>
                </Marker>
              ))}

            {/* Disasters */}
            {showDisasters &&
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
                    pathOptions={{ color: severityColor(d.severity), fillColor: severityColor(d.severity), fillOpacity: 0.08, weight: 2 }}
                  />
                </div>
              ))}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {destination && (
            <>
              <button
                onClick={() => setShowRoutePanel((p) => !p)}
                className={`w-full py-2.5 rounded-lg font-medium transition-all ${
                  showRoutePanel
                    ? 'bg-primary-500 text-white'
                    : 'bg-emergency-50 text-emergency-600 border border-emergency-200 hover:bg-emergency-100'
                }`}
              >
                {showRoutePanel ? 'Hide Route Info' : (
                  <span className="flex items-center justify-center gap-2">
                    <Navigation className="h-4 w-4" /> Emergency Route
                  </span>
                )}
              </button>

              {showRoutePanel && (
                <RoutePanel
                  route={route}
                  destination={destination}
                  destinationType={destinationType}
                  routeLoading={routeLoading}
                  onClose={() => setShowRoutePanel(false)}
                />
              )}
            </>
          )}

          {nearbyLoading && !nearby && (
            <div className="text-sm text-gray-400 text-center py-4">Loading live data...</div>
          )}

          {!position && (
            <div className="text-sm text-gray-400 text-center py-4">Enable GPS to discover nearby infrastructure</div>
          )}

          {/* Nearest shelters */}
          {sortedShelters.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Nearest Shelters
                {liveShelters.length > 0 && <span className="text-xs text-green-500 ml-1">● live</span>}
              </h3>
              <div className="space-y-2">
                {sortedShelters.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate max-w-[180px]">{s.item.name}</span>
                    <span className="text-gray-400 shrink-0 ml-2">{s.distanceKm.toFixed(1)} km</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nearest hospitals */}
          {sortedHospitals.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Nearest Hospitals
                {liveHospitals.length > 0 && <span className="text-xs text-green-500 ml-1">● live</span>}
              </h3>
              <div className="space-y-2">
                {sortedHospitals.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate max-w-[180px]">{h.item.name}</span>
                    <span className="text-gray-400 shrink-0 ml-2">{h.distanceKm.toFixed(1)} km</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live counts */}
          {position && nearby && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Nearby Infrastructure</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emergency-500 inline-block" />
                  <span className="text-gray-600">Shelters</span>
                  <span className="ml-auto font-medium">{nearby.shelters.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                  <span className="text-gray-600">Hospitals</span>
                  <span className="ml-auto font-medium">{nearby.hospitals.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-700 inline-block" />
                  <span className="text-gray-600">Police</span>
                  <span className="ml-auto font-medium">{nearby.police.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-800 inline-block" />
                  <span className="text-gray-600">Fire</span>
                  <span className="ml-auto font-medium">{nearby.firestations.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" />
                  <span className="text-gray-600">Pharmacy</span>
                  <span className="ml-auto font-medium">{nearby.pharmacies.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary-500 inline-block" /> Your Location</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emergency-500 inline-block" /> Shelter</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Hospital</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-700 inline-block" /> Police</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-800 inline-block" /> Fire</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> Pharmacy</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-900 inline-block" /> Disaster Zone</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> Nearest Shelter</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 w-6 border-t-2 border-primary-500 border-dashed inline-block" /> Evacuation Route</span>
      </div>
    </div>
  );
}
