import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, Pill, TriangleAlert } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { useGeolocation } from '../hooks/useGeolocation';
import { useSettings } from '../context/SettingsContext';
import { shelterApi, hospitalApi, disasterApi, alertApi, locationApi } from '../services/api';
import { findNearest, haversineDistance } from '../utils/haversine';
import { getRoute } from '../utils/routing';
import { getCategory } from '../utils/destination';
import type {
  Shelter, Hospital, Disaster, Alert, RouteInfo, NearestItem, GeoPosition,
  NearbyPlace, NearbyResponse, EmergencyDestinationType,
} from '../types';
import { DESTINATION_LABELS } from '../types';
import MaterialIcon from '../components/ui/MaterialIcon';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LocationStatus from '../components/LocationStatus';
import RoutePanel from '../components/RoutePanel';

const TILE_URLS: Record<string, string> = {
  standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  terrain: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
};

const TILE_ATTR: Record<string, string> = {
  standard: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  satellite: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  terrain: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
};

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

function alertSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'warning': return '#f97316';
    case 'advisory': return '#ca8a04';
    case 'info': return '#2563eb';
    default: return '#64748b';
  }
}

function govAlertIcon(severity: string): L.DivIcon {
  const color = alertSeverityColor(severity);
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:15px;line-height:1;">⚠</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function alertPolygonStyle(severity: string): L.PathOptions {
  const color = alertSeverityColor(severity);
  return { color, fillColor: color, fillOpacity: 0.12, weight: 2.5 };
}

function parseAlertPolygons(polygons?: string | null): [number, number][][] {
  if (!polygons) return [];
  const cleaned = polygons.replace(/,/g, ' ');
  return cleaned.split(';').filter(Boolean).map((polyStr) => {
    const parts = polyStr.trim().split(/\s+/);
    const coords: [number, number][] = [];
    for (let i = 0; i + 1 < parts.length; i += 2) {
      coords.push([parseFloat(parts[i]), parseFloat(parts[i + 1])]);
    }
    return coords;
  }).filter((p) => p.length >= 3);
}

function polygonCentroid(polygon: [number, number][]): [number, number] {
  const lat = polygon.reduce((s, c) => s + c[0], 0) / polygon.length;
  const lng = polygon.reduce((s, c) => s + c[1], 0) / polygon.length;
  return [lat, lng];
}

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

function FitBounds({ bounds, maxZoom }: { bounds: L.LatLngBoundsExpression; maxZoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50], duration: 1, maxZoom });
  }, [bounds, map, maxZoom]);
  return null;
}

type LayerKey = 'all' | 'shelters' | 'hospitals' | 'disasters' | 'gov_alerts' | 'police' | 'firestations' | 'pharmacies';

const LAYERS: { key: LayerKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'shelters', label: 'Shelters' },
  { key: 'hospitals', label: 'Hospitals' },
  { key: 'police', label: 'Police' },
  { key: 'firestations', label: 'Fire' },
  { key: 'pharmacies', label: 'Pharmacy' },
  { key: 'disasters', label: 'Disasters' },
  { key: 'gov_alerts', label: 'Gov Alerts' },
];

function InfraRow({ item, count }: { item: typeof INFRA_ITEMS[number]; count: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`w-2 h-2 rounded-full ${item.dot} shrink-0`} />
      <span className="inline-flex items-center justify-center w-5 shrink-0 overflow-hidden">
        {item.key === 'pharmacies' ? (
          <Pill className={`${item.color}`} size={16} />
        ) : (
          <MaterialIcon icon={item.icon} className={`text-base ${item.color}`} />
        )}
      </span>
      <span className="text-sm text-slate-400 flex-1">{item.label}</span>
      <span className="text-base font-mono font-bold text-slate-200">{count}</span>
    </div>
  );
}

const INFRA_ITEMS = [
  { key: 'shelters' as const, icon: 'emergency_home', label: 'Shelters', color: 'text-secondary-400', dot: 'bg-secondary-500' },
  { key: 'hospitals' as const, icon: 'local_hospital', label: 'Hospitals', color: 'text-danger-400', dot: 'bg-danger-500' },
  { key: 'police' as const, icon: 'local_police', label: 'Police', color: 'text-blue-400', dot: 'bg-blue-500' },
  { key: 'firestations' as const, icon: 'fire_truck', label: 'Fire Stations', color: 'text-orange-400', dot: 'bg-red-600' },
  { key: 'pharmacies' as const, icon: 'pharmacy', label: 'Pharmacy', color: 'text-success-400', dot: 'bg-success-500' },
];

function formatExpiry(expires_at?: string | null): string {
  if (!expires_at) return 'N/A';
  try {
    return new Date(expires_at).toLocaleString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return expires_at;
  }
}

function sourceLabel(source?: string | null): string {
  if (!source) return 'Government';
  switch (source.toLowerCase()) {
    case 'imd': return 'IMD';
    case 'ndma': return 'NDMA';
    default: return source;
  }
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 0, severe: 1, high: 2, warning: 3, moderate: 4, advisory: 5, info: 6,
};

function meetsMinSeverity(severity: string, min: string): boolean {
  return (SEVERITY_RANK[severity] ?? 6) <= (SEVERITY_RANK[min] ?? 6);
}

export default function MapPage() {
  const { settings } = useSettings();
  const location = useLocation();
  const navState = location.state as {
    emergencyRoute?: boolean;
    userPosition?: GeoPosition;
    destinationType?: EmergencyDestinationType;
    destinationItem?: NearestItem<NearbyPlace>;
  } | null;

  const geolocation = useGeolocation({ watch: settings.auto_locate });
  const [activeLayer, setActiveLayer] = useState<LayerKey>('all');
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [showRoutePanel, setShowRoutePanel] = useState(!!navState?.emergencyRoute);
  const [locateKey, setLocateKey] = useState(0);
  const [localDest, setLocalDest] = useState<{ destination: NearestItem<NearbyPlace>; type: EmergencyDestinationType } | null>(null);

  const position = navState?.userPosition || geolocation.position;
  const hasGps = !!position;
  const posTuple: [number, number] = position ? [position.lat, position.lng] : [0, 0];

  const mapType = settings.default_map_type || 'standard';
  const tileUrl = TILE_URLS[mapType] || TILE_URLS.standard;
  const tileAttr = TILE_ATTR[mapType] || TILE_ATTR.standard;
  const radiusMeters = settings.emergency_radius * 1000;

  const { data: dbShelters, loading: dbSheltersLoading } = useApi<Shelter[]>(() => shelterApi.getAll());
  const { data: dbHospitals, loading: dbHospitalsLoading } = useApi<Hospital[]>(() => hospitalApi.getAll());
  const { data: disasters, loading: disastersLoading } = useApi<Disaster[]>(() => disasterApi.getAll());
  const { data: alertsData, loading: alertsLoading } = useApi<Alert[]>(
    () => alertApi.getAll(position ? { lat: position.lat, lng: position.lng } : undefined),
    [position?.lat, position?.lng]
  );

  const { data: nearby, loading: nearbyLoading, refetch: refetchNearby } = useApi<NearbyResponse>(
    () => position ? locationApi.nearby(position.lat, position.lng, radiusMeters) : Promise.reject('no gps'),
    [position?.lat, position?.lng, radiusMeters]
  );

  const loading = dbSheltersLoading || dbHospitalsLoading || disastersLoading || alertsLoading;
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

  const alerts = useMemo(() => {
    if (!alertsData) return [];
    return alertsData.filter((a) => meetsMinSeverity(a.severity, settings.min_alert_severity));
  }, [alertsData, settings.min_alert_severity]);

  const visibleDisasters = useMemo(() => {
    if (!disasters) return [];
    if (!settings.show_user_disasters) return [];
    return disasters.filter((d) => d.status === 'active');
  }, [disasters, settings.show_user_disasters]);

  const destinationType: EmergencyDestinationType | null = localDest?.type ?? navState?.destinationType ?? null;
  const destination: NearestItem<NearbyPlace> | null = localDest?.destination ?? navState?.destinationItem ?? null;

  const fetchRoute = useCallback(async () => {
    if (!position || !destination) return;
    setRouteLoading(true);
    setRouteError(null);
    try {
      const routeData = await getRoute(
        [position.lat, position.lng],
        [destination.item.latitude, destination.item.longitude]
      );
      setRoute(routeData);
    } catch {
      setRouteError('Routing service unavailable. Check your connection and try again.');
      setRoute(null);
    } finally {
      setRouteLoading(false);
    }
  }, [position, destination]);

  useEffect(() => {
    if (showRoutePanel && position && destination) {
      fetchRoute();
    }
  }, [showRoutePanel, position, destination, fetchRoute]);

  useEffect(() => {
    if (navState?.emergencyRoute && navState?.destinationItem && navState?.destinationType) {
      setDestination(navState.destinationItem, navState.destinationType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (position && settings.auto_locate) refetchNearby(); }, [position?.lat, position?.lng, settings.auto_locate]); // eslint-disable-line react-hooks/exhaustive-deps

  const routeBounds = useMemo(() => {
    if (!route?.coordinates.length) return null;
    return L.latLngBounds(
      route.coordinates.map((c) => L.latLng(c[0], c[1]))
    );
  }, [route]);

  const showAll = activeLayer === 'all';
  const showShelters = showAll || activeLayer === 'shelters';
  const showHospitals = showAll || activeLayer === 'hospitals';
  const showPolice = showAll || activeLayer === 'police';
  const showFirestations = showAll || activeLayer === 'firestations';
  const showPharmacies = showAll || activeLayer === 'pharmacies';
  const showDisasters = (showAll || activeLayer === 'disasters') && settings.show_user_disasters;
  const showGovAlerts = (showAll || activeLayer === 'gov_alerts') && settings.show_gov_alerts;

  const markerLimit = showAll ? 5 : Infinity;

  const setDestination = useCallback((dest: NearestItem<NearbyPlace>, type: EmergencyDestinationType) => {
    setLocalDest({ destination: dest, type });
    setShowRoutePanel(true);
  }, []);

  const handleClearRoute = useCallback(() => {
    setRoute(null);
    setShowRoutePanel(false);
    setLocalDest(null);
  }, []);

  const handleLocateMe = useCallback(() => {
    if (position) {
      setLocateKey((k) => k + 1);
    } else {
      geolocation.refresh();
    }
  }, [position, geolocation]);

  const handleFindDestination = useCallback((category: EmergencyDestinationType) => {
    if (!position || !nearby) return;
    const nearbyKey = getCategory(category);
    if (!nearbyKey) return;
    const items = nearby[nearbyKey];
    if (!items || items.length === 0) return;
    const nearest = findNearest(items, position.lat, position.lng);
    if (nearest) setDestination(nearest, category);
  }, [position, nearby, setDestination]);

  useEffect(() => {
    if (!position || !hasGps) return;
    const radiusKm = settings.emergency_radius;
    const points: [number, number][] = [[position.lat, position.lng]];
    for (const d of visibleDisasters) {
      if (haversineDistance(position.lat, position.lng, d.latitude, d.longitude) <= radiusKm) {
        points.push([d.latitude, d.longitude]);
      }
    }
    for (const a of alerts) {
      const polys = parseAlertPolygons(a.polygons);
      if (polys.length > 0) {
        const c = polygonCentroid(polys[0]);
        if (haversineDistance(position.lat, position.lng, c[0], c[1]) <= radiusKm) {
          points.push(c);
        }
      }
    }
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
      if (bounds.getNorthEast().distanceTo(bounds.getSouthWest()) / 1000 <= radiusKm * 2) {
        setBoundsToFit(bounds);
        return;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position?.lat, position?.lng, visibleDisasters, alerts, hasGps, settings.emergency_radius]);

  const [fitBounds, setBoundsToFit] = useState<L.LatLngBoundsExpression | null>(null);

  if (loading && !nearby) return <LoadingSpinner />;

  return (
    <div className="h-full flex flex-col">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2 shrink-0">
        <h1 className="text-2xl font-bold font-display text-white tracking-tight">Interactive Map</h1>
        <div className="flex items-center gap-3">
          <LocationStatus geolocation={geolocation} />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1 flex-wrap mb-2 shrink-0">
        {LAYERS.map((layer) => {
          const isDisabled =
            (layer.key === 'gov_alerts' && !settings.show_gov_alerts) ||
            (layer.key === 'disasters' && !settings.show_user_disasters);
          return (
            <button
              key={layer.key}
              onClick={() => !isDisabled && setActiveLayer(layer.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                isDisabled
                  ? 'bg-slate-800/20 text-slate-600 border border-slate-700/20 cursor-not-allowed'
                  : activeLayer === layer.key
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800/60 hover:text-slate-300 border border-slate-700/40'
              }`}
              disabled={isDisabled}
            >
              {layer.label}
            </button>
          );
        })}
      </div>

      {/* Map area: full viewport with floating overlays */}
      <div className="flex-1 relative min-h-0 rounded-xl border border-slate-700/40 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        <MapContainer center={posTuple} zoom={13} className="absolute inset-0 z-0">
          <TileLayer
            attribution={tileAttr}
            url={tileUrl}
          />

          {settings.auto_locate && <FlyTo key={locateKey} center={posTuple} zoom={13} />}
          {routeBounds && <FitBounds bounds={routeBounds} />}
          {fitBounds && <FitBounds bounds={fitBounds} maxZoom={11} />}

          {route && route.coordinates.length > 1 && (
            <Polyline
              positions={route.coordinates}
              pathOptions={{ color: '#1e40af', weight: 4, opacity: 0.8, dashArray: '10, 6' }}
            />
          )}

          <Marker position={posTuple} icon={userIcon}>
            <Popup><div className="text-sm font-medium">You are here</div></Popup>
          </Marker>

          {destination && (
            <Marker
              position={[destination.item.latitude, destination.item.longitude]}
              icon={getDestinationIcon(destinationType ?? 'shelter')}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-medium text-success-700">
                    {destinationType ? DESTINATION_LABELS[destinationType] : 'Destination'}
                  </p>
                  <p className="font-medium">{destination.item.name}</p>
                  <p>Distance: {destination.distanceKm.toFixed(2)} km</p>
                  {destination.item.address && (
                    <p className="text-xs text-on-surface-variant">{destination.item.address}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {showShelters &&
            allShelters.slice(0, markerLimit).map((s, i) => {
              if (destination && s.name === destination.item.name && s.latitude === destination.item.latitude) return null;
              return (
                <Marker key={`s-${i}`} position={[s.latitude, s.longitude]} icon={shelterIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-on-surface-variant">{s.distance.toFixed(2)} km away</p>
                      {s.address && <p className="text-xs text-on-surface-variant">{s.address}</p>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {showHospitals &&
            allHospitals.slice(0, markerLimit).map((h, i) => {
              if (destination && h.name === destination.item.name && h.latitude === destination.item.latitude) return null;
              return (
                <Marker key={`h-${i}`} position={[h.latitude, h.longitude]} icon={hospitalIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{h.name}</p>
                      <p className="text-xs text-on-surface-variant">{h.distance.toFixed(2)} km away</p>
                      {(h as any).emergency_available !== undefined && (
                        <p className={(h as any).emergency_available ? 'text-success-700 text-xs' : 'text-danger-500 text-xs'}>
                          {(h as any).emergency_available ? 'Emergency Available' : 'No Emergency'}
                        </p>
                      )}
                      {h.address && <p className="text-xs text-on-surface-variant">{h.address}</p>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {showPolice &&
            livePolice.slice(0, markerLimit).map((p, i) => (
              <Marker key={`p-${i}`} position={[p.latitude, p.longitude]} icon={policeIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-on-surface-variant">{p.distance.toFixed(2)} km away</p>
                    {p.address && <p className="text-xs text-on-surface-variant">{p.address}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}

          {showFirestations &&
            liveFirestations.slice(0, markerLimit).map((f, i) => (
              <Marker key={`f-${i}`} position={[f.latitude, f.longitude]} icon={fireIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-medium">{f.name}</p>
                    <p className="text-xs text-on-surface-variant">{f.distance.toFixed(2)} km away</p>
                    {f.address && <p className="text-xs text-on-surface-variant">{f.address}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}

          {showPharmacies &&
            livePharmacies.slice(0, markerLimit).map((ph, i) => (
              <Marker key={`ph-${i}`} position={[ph.latitude, ph.longitude]} icon={pharmacyIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-medium">{ph.name}</p>
                    <p className="text-xs text-on-surface-variant">{ph.distance.toFixed(2)} km away</p>
                    {ph.address && <p className="text-xs text-on-surface-variant">{ph.address}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}

          {showDisasters &&
            visibleDisasters.map((d) => (
              <div key={`d-${d.id}`}>
                <Marker position={[d.latitude, d.longitude]} icon={disasterIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{d.type}</p>
                      <p className="capitalize">Severity: {d.severity}</p>
                      <p className="capitalize">Status: {d.status}</p>
                      {d.description && <p className="text-xs text-on-surface-variant mt-1">{d.description}</p>}
                      {position && (
                        <p className="text-xs text-on-surface-variant/60 mt-1">
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

          {showGovAlerts &&
            alerts.map((a) => {
              const polys = parseAlertPolygons(a.polygons);
              if (polys.length === 0) return null;
              const centroid = polygonCentroid(polys[0]);
              const severity = a.severity || 'info';
              const icon = govAlertIcon(severity);
              return (
                <div key={`gov-${a.id}`}>
                  {polys.map((poly, idx) => (
                    <Polygon
                      key={`p-${a.id}-${idx}`}
                      positions={poly}
                      pathOptions={alertPolygonStyle(severity)}
                    />
                  ))}
                  <Marker position={centroid} icon={icon}>
                    <Popup>
                      <div className="text-sm max-w-64">
                        <p className="font-medium text-base mb-1">{a.title}</p>
                        {a.event && <p className="text-xs text-slate-400 mb-1">{a.event}</p>}
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider text-white"
                            style={{ backgroundColor: alertSeverityColor(severity) }}
                          >
                            {severity}
                          </span>
                          <span className="text-[10px] font-mono uppercase text-slate-500">{sourceLabel(a.source)}</span>
                        </div>
                        {a.area && <p className="text-xs text-slate-400 mb-1">Area: {a.area}</p>}
                        {a.expires_at && <p className="text-xs text-slate-500 mb-1">Expires: {formatExpiry(a.expires_at)}</p>}
                        {a.message && <p className="text-xs text-slate-300 mt-1 leading-relaxed">{a.message}</p>}
                      </div>
                    </Popup>
                  </Marker>
                </div>
              );
            })}
        </MapContainer>

        {/* Floating right panel: Infrastructure + Quick Actions + RoutePanel */}
        <div className="absolute top-3 right-3 z-20 w-56 space-y-2 pointer-events-none">
          <div className="pointer-events-auto">
            {nearbyLoading && !nearby && (
              <div className="text-xs font-mono text-slate-500 text-center py-3">Loading live data...</div>
            )}
            {!position && (
              <div className="text-xs font-mono text-slate-500 text-center py-3">Enable GPS...</div>
            )}

            {position && nearby && (
              <Card variant="glass" padding="sm">
                <div className="flex items-center gap-2 mb-2">
                  <MaterialIcon icon="layers" className="text-base text-slate-400" />
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Infrastructure</h3>
                </div>
                <div className="space-y-2">
                  {INFRA_ITEMS.map((item) => (
                    <InfraRow key={item.key} item={item} count={nearby[item.key]?.length ?? 0} />
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card variant="glass" padding="sm" className="mt-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 overflow-hidden inline-flex items-center justify-center"><MaterialIcon icon="flash_on" className="text-base text-slate-400" /></span>
                <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-1 mb-1.5">
                <button
                  onClick={() => handleFindDestination('shelter')}
                  disabled={!position}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-slate-800/40 border border-slate-700/40 hover:bg-secondary-500/10 hover:border-secondary-500/25 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <span className="w-4 overflow-hidden inline-flex items-center justify-center"><MaterialIcon icon="emergency_home" className="text-sm text-secondary-400" /></span>
                  <span className="text-[10px] font-mono uppercase tracking-wider">Shelter</span>
                </button>
                <button
                  onClick={() => handleFindDestination('hospital')}
                  disabled={!position}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-slate-800/40 border border-slate-700/40 hover:bg-danger-500/10 hover:border-danger-500/25 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <span className="w-4 overflow-hidden inline-flex items-center justify-center"><MaterialIcon icon="local_hospital" className="text-sm text-danger-400" /></span>
                  <span className="text-[10px] font-mono uppercase tracking-wider">Hospital</span>
                </button>
                <button
                  onClick={() => handleFindDestination('police')}
                  disabled={!position}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-slate-800/40 border border-slate-700/40 hover:bg-blue-500/10 hover:border-blue-500/25 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <span className="w-4 overflow-hidden inline-flex items-center justify-center"><MaterialIcon icon="local_police" className="text-sm text-blue-400" /></span>
                  <span className="text-[10px] font-mono uppercase tracking-wider">Police</span>
                </button>
                <button
                  onClick={() => handleFindDestination('firestation')}
                  disabled={!position}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-slate-800/40 border border-slate-700/40 hover:bg-orange-500/10 hover:border-orange-500/25 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <span className="w-4 overflow-hidden inline-flex items-center justify-center"><MaterialIcon icon="fire_truck" className="text-sm text-orange-400" /></span>
                  <span className="text-[10px] font-mono uppercase tracking-wider">Fire</span>
                </button>
                <button
                  onClick={() => handleFindDestination('pharmacy')}
                  disabled={!position}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-slate-800/40 border border-slate-700/40 hover:bg-emerald-500/10 hover:border-emerald-500/25 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <span className="w-4 overflow-hidden inline-flex items-center justify-center"><Pill className="text-emerald-400" size={16} /></span>
                  <span className="text-[10px] font-mono uppercase tracking-wider">Pharmacy</span>
                </button>
              </div>
              {/* Utility buttons */}
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={handleLocateMe}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-slate-800/40 border border-slate-700/40 hover:bg-primary-500/10 hover:border-primary-500/25 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <span className="w-4 overflow-hidden inline-flex items-center justify-center"><MaterialIcon icon="my_location" className="text-sm text-primary-400" /></span>
                  <span className="text-[10px] font-mono uppercase tracking-wider">Locate</span>
                </button>
                <button
                  onClick={handleClearRoute}
                  disabled={!route}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-slate-800/40 border border-slate-700/40 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                >
                  <span className="w-4 overflow-hidden inline-flex items-center justify-center"><MaterialIcon icon="clear" className="text-sm text-slate-400" /></span>
                  <span className="text-[10px] font-mono uppercase tracking-wider">Clear</span>
                </button>
              </div>
            </Card>
          </div>

          {/* RoutePanel */}
          {showRoutePanel && (route || routeError) && (
            <div className="pointer-events-auto">
              <RoutePanel
                route={route}
                routeError={routeError}
                destination={destination!}
                destinationType={destinationType}
                routeLoading={routeLoading}
                onClose={handleClearRoute}
              />
            </div>
          )}
        </div>

        {/* Legend Overlay (bottom-left inside map) */}
        <div className="absolute bottom-3 left-3 z-20 p-2 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/40 shadow-lg">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono tracking-widest uppercase text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-600 inline-block shadow-[0_0_6px_rgba(37,99,235,0.6)] border border-white shrink-0" /> You</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary-500 inline-block shadow-[0_0_6px_rgba(249,115,22,0.6)] shrink-0" /> Shelter</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger-500 inline-block shadow-[0_0_6px_rgba(220,38,38,0.6)] shrink-0" /> Hospital</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block shadow-[0_0_6px_rgba(59,130,246,0.6)] shrink-0" /> Police</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-600 inline-block shadow-[0_0_6px_rgba(220,38,38,0.6)] shrink-0" /> Fire</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success-500 inline-block shadow-[0_0_6px_rgba(34,197,94,0.6)] shrink-0" /> Pharmacy</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-danger-700 border border-danger-300 inline-block shadow-[0_0_8px_rgba(220,38,38,0.8)] shrink-0" /> Disaster</span>
            <span className="flex items-center gap-1"><span className="w-4 border-t-2 border-primary-500 border-dashed inline-block" /> Route</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block shadow-[0_0_6px_rgba(220,38,38,0.6)] shrink-0" /> Critical</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-orange-500 inline-block shadow-[0_0_6px_rgba(249,115,22,0.6)] shrink-0" /> Warning</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-600 inline-block shadow-[0_0_6px_rgba(202,138,4,0.6)] shrink-0" /> Advisory</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block shadow-[0_0_6px_rgba(37,99,235,0.6)] shrink-0" /> Info</span>
            <span className="flex items-center gap-1"><TriangleAlert className="text-red-400" size={12} /> Gov Alert</span>
          </div>
        </div>

        {/* Route toggle overlay (top-left inside map) */}
        {destination && (
          <div className="absolute top-3 left-3 z-20">
            <Button
              onClick={() => setShowRoutePanel((p) => !p)}
              variant={showRoutePanel ? 'primary' : 'secondary'}
              size="sm"
              icon={!showRoutePanel ? <Navigation className="h-3.5 w-3.5" /> : undefined}
            >
              {showRoutePanel ? 'Hide Route' : 'Route'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
