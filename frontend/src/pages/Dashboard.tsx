import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Home, Hospital as HospitalIcon, Shield, MapPin,
  Flame, Phone, Copy, Check, AlertTriangle, Navigation, UserCheck, Clock, Shield as ShieldIcon,
} from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AIAssistant, { AIAssistantWithRef } from '../components/AIAssistant';
import ResponderSOSPanel from '../components/ResponderSOSPanel';
import { useApi } from '../hooks/useApi';
import { useGeolocation } from '../hooks/useGeolocation';
import { useWeather } from '../hooks/useWeather';
import { useSettings } from '../context/SettingsContext';
import { useNearbySOS } from '../hooks/useNearbySOS';
import { sortByDistance, findNearest } from '../utils/haversine';
import { alertApi, shelterApi, hospitalApi, disasterApi, locationApi, riskApi, sosApi } from '../services/api';
import type { Alert, Shelter, Hospital, Disaster, NearbyResponse, RiskAssessmentResponse, GeoPosition, SOSIncident, SOSNearbyResponse, SOSStatus } from '../types';
import MaterialIcon from '../components/ui/MaterialIcon';
import { showBrowserNotification, playAlertSound } from '../utils/notifications';

const SEVERITY_RANK: Record<string, number> = {
  critical: 0, severe: 1, high: 2, warning: 3, moderate: 4, advisory: 5, info: 6,
};

function meetsMinSeverity(severity: string, min: string): boolean {
  return (SEVERITY_RANK[severity] ?? 6) <= (SEVERITY_RANK[min] ?? 6);
}

function isPositionFresh(position: GeoPosition | null, staleThresholdMs = 300000): boolean {
  if (!position) return false;
  return Date.now() - position.timestamp < staleThresholdMs;
}

// Network/Wi-Fi fixes on desktops routinely report accuracies in the hundreds
// of metres, so a 100 m ceiling rejected perfectly usable positions and made
// the dashboard claim GPS was disabled.
function isPositionAccurate(position: GeoPosition | null, maxAccuracyMeters = 1000): boolean {
  if (!position) return false;
  return position.accuracy <= maxAccuracyMeters;
}

const QUICK_ACTIONS = [
  { label: 'Find Nearest Shelter', question: 'Where is the nearest safe shelter?', icon: 'emergency_home' },
  { label: 'Navigate to Hospital', question: 'Navigate me to the nearest hospital', icon: 'local_hospital' },
  { label: 'Safe Evacuation Route', question: 'What is the safest evacuation route from my location?', icon: 'route' },
  { label: 'Is Evacuation Needed?', question: 'Should I evacuate? What is the current risk level?', icon: 'warning' },
];

const CONTACTS = [
  { name: 'Police', number: '100', icon: 'local_police', color: 'text-primary-400' },
  { name: 'Fire Station', number: '101', icon: 'fire_truck', color: 'text-orange-400' },
  { name: 'Ambulance', number: '102', icon: 'ambulance', color: 'text-danger-400' },
  { name: 'Disaster Helpline', number: '1070', icon: 'support_agent', color: 'text-warning-400' },
];

function formatDistance(d: number): string {
  return d < 1 ? `${(d * 1000).toFixed(0)} m` : `${d.toFixed(1)} km`;
}

export default function Dashboard() {
  const { settings } = useSettings();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const aiAssistantRef = useRef<{ submitQuestion: (question: string) => void }>(null);

  const handleQuickAction = (question: string) => {
    aiAssistantRef.current?.submitQuestion(question);
  };

  const handleAcceptSOS = async (sosId: number) => {
    try {
      await sosApi.accept(sosId);
      refetchSOS();
      // Refresh active SOS to get the responder assignment
      const response = await sosApi.getActive();
      const data = response.data as { sos: SOSIncident | null; is_responder: boolean; responder_sos: SOSIncident | null };
      setActiveSOS(data.sos);
      setIsResponder(data.is_responder);
      if (data.is_responder && data.responder_sos) {
        setShowResponderPanel(true);
      }
    } catch (err) {
      console.error('Failed to accept SOS:', err);
    }
  };

  const updateSOSStatus = async (sosId: number, status: SOSStatus) => {
    try {
      await sosApi.updateStatus(sosId, { status });
      // Refresh active SOS
      const response = await sosApi.getActive();
      const data = response.data as { sos: SOSIncident | null; is_responder: boolean; responder_sos: SOSIncident | null };
      setActiveSOS(data.sos);
      setIsResponder(data.is_responder);
    } catch (err) {
      console.error('Failed to update SOS status:', err);
    }
  };

  const navigateToVictim = (sos: SOSIncident) => {
    if (!position) return;
    // Navigate to map page with victim as destination
    // This would integrate with the existing routing system
    window.open(`/map?dest=${sos.latitude},${sos.longitude}&type=sos`, '_blank');
  };

  const geolocation = useGeolocation({ watch: false });
  const browserPosition = geolocation.position;
  // A coarse fix still drives the nearby/weather panels, so it is used rather
  // than discarded. Quality is reported as a notice instead of blanking the
  // dashboard out behind a false "Enable GPS" prompt.
  const position = browserPosition;
  const coarsePosition = browserPosition !== null && !isPositionAccurate(browserPosition);
  const isStalePosition = browserPosition !== null && !isPositionFresh(browserPosition);

  const { weather, loading: weatherLoading, error: weatherError } = useWeather(position);

  const { data: alerts } = useApi<Alert[]>(() => alertApi.getAll());
  const { data: dbShelters } = useApi<Shelter[]>(() => shelterApi.getAll());
  const { data: dbHospitals } = useApi<Hospital[]>(() => hospitalApi.getAll());
  const { data: disasters } = useApi<Disaster[]>(() => disasterApi.getAll());

  const radiusMeters = settings.emergency_radius * 1000;
  const { data: nearby } = useApi<NearbyResponse>(
    () => position ? locationApi.nearby(position.lat, position.lng, radiusMeters) : Promise.reject('no gps'),
    [position?.lat, position?.lng, radiusMeters]
  );

  const { data: riskData } = useApi<RiskAssessmentResponse>(
    () => position ? riskApi.get(position.lat, position.lng) : Promise.reject('no gps'),
    [position?.lat, position?.lng]
  );

  // Nearby SOS emergencies
  const { emergencies: nearbySOS, loading: sosLoading, refetch: refetchSOS } = useNearbySOS(position, {
    enabled: !!position,
    refreshIntervalMs: 30000,
    radiusKm: settings.emergency_radius,
  });

  // Active SOS for current user (victim or responder)
  const [activeSOS, setActiveSOS] = useState<SOSIncident | null>(null);
  const [isResponder, setIsResponder] = useState(false);
  const [showResponderPanel, setShowResponderPanel] = useState(false);
  const [lastNotifiedSOS, setLastNotifiedSOS] = useState<number | null>(null);
  const [lastNotifiedAlert, setLastNotifiedAlert] = useState<number | null>(null);

  useEffect(() => {
    const fetchActiveSOS = async () => {
      try {
        const response = await sosApi.getActive();
        const data = response.data as { sos: SOSIncident | null; is_responder: boolean; responder_sos: SOSIncident | null };
        setActiveSOS(data.sos);
        setIsResponder(data.is_responder);
        if (data.is_responder && data.responder_sos && !showResponderPanel) {
          setShowResponderPanel(true);
        }
      } catch {
        // Ignore errors
      }
    };

    fetchActiveSOS();
    const interval = setInterval(fetchActiveSOS, 10000);
    return () => clearInterval(interval);
  }, [showResponderPanel]);

  const sortedAlerts = useMemo(() => {
    if (!alerts) return [];
    return [...alerts]
      .filter((a) => meetsMinSeverity(a.severity, settings.min_alert_severity))
      .sort((a, b) => (SEVERITY_RANK[a.severity] ?? 6) - (SEVERITY_RANK[b.severity] ?? 6));
  }, [alerts, settings.min_alert_severity]);

  // Notification wiring for nearby SOS and alerts
  useEffect(() => {
    if (!settings.notifications_enabled || !settings.push_notifications || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // Notify about nearby SOS
    if (nearbySOS.length > 0) {
      const nearestSOS = nearbySOS[0];
      if (nearestSOS.sos_id !== lastNotifiedSOS) {
        showBrowserNotification(
          '🚨 Emergency Nearby',
          `${nearestSOS.victim_name} needs assistance ~${nearestSOS.distance_km.toFixed(1)} km away`
        );
        playAlertSound();
        setLastNotifiedSOS(nearestSOS.sos_id);
      }
    }

    // Notify about critical alerts in area
    if (sortedAlerts.length > 0) {
      const criticalAlert = sortedAlerts.find(a => a.severity === 'critical' || a.severity === 'severe');
      if (criticalAlert && criticalAlert.id !== lastNotifiedAlert) {
        showBrowserNotification(
          '⚠️ Critical Alert',
          `${criticalAlert.title}: ${criticalAlert.message.slice(0, 100)}...`
        );
        playAlertSound();
        setLastNotifiedAlert(criticalAlert.id);
      }
    }
  }, [nearbySOS, sortedAlerts, settings.notifications_enabled, settings.push_notifications, lastNotifiedSOS, lastNotifiedAlert]);

  const activeDisasters = useMemo(() => {
    if (!disasters) return [];
    return disasters.filter((d) => d.status === 'active');
  }, [disasters]);

  const nearbyDisasters = useMemo(() => {
    if (!position || !activeDisasters.length) return [];
    const sorted = sortByDistance(activeDisasters, position.lat, position.lng);
    return sorted.filter((d) => d.distanceKm <= settings.emergency_radius);
  }, [position, activeDisasters, settings.emergency_radius]);

  const totalActiveAlerts = alerts?.length ?? 0;
  const criticalAlertCount = alerts?.filter((a) => a.severity === 'critical' || a.severity === 'severe').length ?? 0;

  const nearestShelter = useMemo<{ name: string; dist: number } | null>(() => {
    if (position && nearby?.shelters?.length) {
      const s = sortByDistance(nearby.shelters, position.lat, position.lng);
      if (s.length) return { name: s[0].item.name, dist: s[0].distanceKm };
    }
    if (dbShelters?.length && position) {
      const s = sortByDistance(dbShelters, position.lat, position.lng);
      if (s.length) return { name: s[0].item.name, dist: s[0].distanceKm };
    }
    return null;
  }, [position, nearby, dbShelters]);

  const nearestHospital_ = useMemo<{ name: string; dist: number } | null>(() => {
    if (position && nearby?.hospitals?.length) {
      const s = sortByDistance(nearby.hospitals, position.lat, position.lng);
      if (s.length) return { name: s[0].item.name, dist: s[0].distanceKm };
    }
    if (dbHospitals?.length && position) {
      const s = sortByDistance(dbHospitals, position.lat, position.lng);
      if (s.length) return { name: s[0].item.name, dist: s[0].distanceKm };
    }
    return null;
  }, [position, nearby, dbHospitals]);

  const nearestFireStation = useMemo<{ name: string; dist: number } | null>(() => {
    if (position && nearby?.firestations?.length) {
      const s = sortByDistance(nearby.firestations, position.lat, position.lng);
      if (s.length) return { name: s[0].item.name, dist: s[0].distanceKm };
    }
    return null;
  }, [position, nearby]);

  const nearestPolice = useMemo<{ name: string; dist: number } | null>(() => {
    if (position && nearby?.police?.length) {
      const s = sortByDistance(nearby.police, position.lat, position.lng);
      if (s.length) return { name: s[0].item.name, dist: s[0].distanceKm };
    }
    return null;
  }, [position, nearby]);

  const riskDisplay = useMemo(() => {
    const rl = riskData?.user_risk;
    if (!rl) {
      const nearbySrc = nearbyDisasters.length ? nearbyDisasters[0] : null;
      const nearbyD = nearbySrc?.item;
      if (position && nearbyD) {
        const s = nearbyD.severity as string;
        if (s === 'critical' || s === 'severe') return { label: 'HIGH RISK', color: 'text-red-400', dot: 'bg-red-500', bg: 'bg-red-500/10 border-red-500/20', threats: nearbyDisasters.length };
        if (s === 'high') return { label: 'ELEVATED', color: 'text-orange-400', dot: 'bg-orange-500', bg: 'bg-orange-500/10 border-orange-500/20', threats: nearbyDisasters.length };
        return { label: 'MODERATE', color: 'text-yellow-400', dot: 'bg-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20', threats: nearbyDisasters.length };
      }
      return { label: 'SAFE', color: 'text-green-400', dot: 'bg-green-500', bg: 'bg-green-500/10 border-green-500/20', threats: 0 };
    }
    const map: Record<string, { label: string; color: string; dot: string; bg: string }> = {
      SAFE:     { label: 'SAFE',     color: 'text-green-400', dot: 'bg-green-500', bg: 'bg-green-500/10 border-green-500/20' },
      LOW:      { label: 'LOW',      color: 'text-lime-400',  dot: 'bg-lime-500',  bg: 'bg-lime-500/10 border-lime-500/20' },
      MODERATE: { label: 'MODERATE', color: 'text-yellow-400', dot: 'bg-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
      HIGH:     { label: 'HIGH',     color: 'text-orange-400', dot: 'bg-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
      EXTREME:  { label: 'EXTREME',  color: 'text-red-400',   dot: 'bg-red-500',   bg: 'bg-red-500/10 border-red-500/20' },
    };
    const d = map[rl] || { label: rl, color: 'text-slate-400', dot: 'bg-slate-500', bg: 'bg-slate-500/10 border-slate-500/20' };
    return { ...d, threats: riskData.nearby_alerts };
  }, [riskData, position, nearbyDisasters]);

  const handleCopy = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch { /* noop */ }
  }, []);

  const weatherCity = weather?.city || null;

  return (
    <div className="space-y-6">

      {/* ===== Page Title ===== */}
      <h1 className="text-3xl font-bold font-display text-white tracking-tight">Dashboard</h1>

      {coarsePosition && browserPosition && (
        <div className="flex items-start gap-2 rounded-lg border border-warning-500/20 bg-warning-500/10 px-3 py-2 text-xs text-warning-300">
          <MaterialIcon icon="gps_not_fixed" className="text-base shrink-0" />
          <span>
            Using an approximate location (±{Math.round(browserPosition.accuracy)}m
            {isStalePosition ? ', last updated over 5 minutes ago' : ''}). Nearby results cover the area
            around this point rather than your exact spot.
          </span>
        </div>
      )}

      {/* ===== 1. Status Strip ===== */}
      <div className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border ${riskDisplay.bg}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${riskDisplay.dot} animate-pulse shrink-0`} />
        <span className={`text-sm font-bold font-mono uppercase tracking-widest ${riskDisplay.color}`}>
          {riskDisplay.label}
        </span>
        <span className="hidden sm:inline text-sm text-slate-400">·</span>
        <span className="hidden sm:flex items-center gap-1.5 text-sm text-slate-400">
          <MapPin className="h-4 w-4" />
          {position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'Location unavailable'}
        </span>
        <span className="hidden md:inline text-sm text-slate-500">·</span>
        <span className="hidden md:flex items-center gap-1.5 text-sm text-slate-500">
          {riskData
            ? riskData.nearby_alerts > 0
              ? `${riskData.nearby_alerts} nearby threat${riskData.nearby_alerts !== 1 ? 's' : ''}`
              : 'No nearby threats'
            : nearbyDisasters.length > 0
              ? `${nearbyDisasters.length} nearby threat${nearbyDisasters.length !== 1 ? 's' : ''}`
              : 'No nearby threats'}
        </span>
        <span className="hidden lg:inline text-sm text-slate-600">·</span>
        <span className="hidden lg:flex items-center gap-1.5 text-sm text-slate-600">
          <span className={`w-2 h-2 rounded-full ${position ? 'bg-green-500' : 'bg-slate-600'}`} />
          GPS {position ? 'Active' : 'Unavailable'}
        </span>
        <div className="ml-auto flex items-center gap-4 text-sm text-slate-500">
          {weather && (
            <span className="hidden sm:flex items-center gap-1.5">
              <MaterialIcon icon="cloud" className="text-xl" />
              {weather.temperature}°C
            </span>
          )}
          {weatherCity && (
            <span className="hidden lg:inline">{weatherCity}</span>
          )}
        </div>
      </div>

      {/* ===== SOS: Nearby Emergencies ===== */}
      {nearbySOS.length > 0 && (
        <Card variant="glass" padding="md" className="border-danger-500/30 bg-danger-500/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-danger-500/20 border border-danger-500/30">
              <AlertTriangle className="h-5 w-5 text-danger-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">🚨 EMERGENCY NEARBY</h3>
              <p className="text-sm text-slate-400">{nearbySOS.length} emergency alert{nearbySOS.length !== 1 ? 's' : ''} in your area</p>
            </div>
          </div>
          <div className="space-y-2">
            {nearbySOS.slice(0, 3).map((sos) => (
              <div key={sos.sos_id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-danger-500/20">
                    <AlertTriangle className="h-5 w-5 text-danger-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {sos.victim_name} needs assistance
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      ~{sos.distance_km.toFixed(1)} km away
                      {sos.emergency_type && ` · ${sos.emergency_type}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleAcceptSOS(sos.sos_id)}
                  className="px-4 py-2 rounded-lg bg-danger-600 text-white text-sm font-medium hover:bg-danger-500 transition-colors"
                >
                  ACCEPT TO HELP
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ===== SOS: Active Responder Section ===== */}
      {isResponder && activeSOS && showResponderPanel && (
        <ResponderSOSPanel
          sos={activeSOS}
          onClose={() => setShowResponderPanel(false)}
          onStatusUpdate={async (status) => {
            await updateSOSStatus(activeSOS.id, status);
            if (['user_confirmed_safe', 'resolved', 'cancelled'].includes(status)) {
              setShowResponderPanel(false);
              setIsResponder(false);
              setActiveSOS(null);
            }
          }}
        />
      )}

      {/* ===== 2. Summary Row ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Resource Summary */}
        <div className="lg:col-span-5">
          <div className="h-full rounded-xl border border-slate-700/40 bg-slate-900/50 backdrop-blur-sm p-5">
            <p className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">Nearest Resources</p>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/20 shrink-0">
                  <Home className="h-5 w-5 text-primary-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-mono text-slate-500 uppercase">Shelter</p>
                  <p className="text-sm font-medium text-slate-200 truncate">{nearestShelter?.name ?? '—'}</p>
                  <p className="text-sm text-slate-500">{nearestShelter ? formatDistance(nearestShelter.dist) : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-danger-500/10 border border-danger-500/20 shrink-0">
                  <HospitalIcon className="h-5 w-5 text-danger-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-mono text-slate-500 uppercase">Hospital</p>
                  <p className="text-sm font-medium text-slate-200 truncate">{nearestHospital_?.name ?? '—'}</p>
                  <p className="text-sm text-slate-500">{nearestHospital_ ? formatDistance(nearestHospital_.dist) : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 shrink-0">
                  <Flame className="h-5 w-5 text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-mono text-slate-500 uppercase">Fire Station</p>
                  <p className="text-sm font-medium text-slate-200 truncate">{nearestFireStation?.name ?? '—'}</p>
                  <p className="text-sm text-slate-500">{nearestFireStation ? formatDistance(nearestFireStation.dist) : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-success-500/10 border border-success-500/20 shrink-0">
                  <Shield className="h-5 w-5 text-success-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-mono text-slate-500 uppercase">Police</p>
                  <p className="text-sm font-medium text-slate-200 truncate">{nearestPolice?.name ?? '—'}</p>
                  <p className="text-sm text-slate-500">{nearestPolice ? formatDistance(nearestPolice.dist) : ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nearby Threats */}
        <div className="lg:col-span-3">
          <div className="h-full rounded-xl border border-slate-700/40 bg-slate-900/50 backdrop-blur-sm p-5 flex flex-col justify-center">
            <p className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-2">Nearby Threats</p>
            {position ? (
              nearbyDisasters.length > 0 ? (
                <div>
                  <p className="text-4xl font-bold font-display text-white">{nearbyDisasters.length}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {nearbyDisasters[0].item.type} ~{nearbyDisasters[0].distanceKm.toFixed(1)}km away
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <p className="text-base text-slate-400">No threats in your area</p>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <p className="text-base text-slate-500">Enable GPS</p>
              </div>
            )}
          </div>
        </div>

        {/* Weather */}
        <div className="lg:col-span-4">
          <div className="h-full rounded-xl border border-slate-700/40 bg-slate-900/50 backdrop-blur-sm p-5 flex flex-col">
            <p className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">Current Weather</p>
            {weatherLoading && !weather ? (
              <LoadingSpinner size="sm" />
            ) : weatherError && !weather ? (
              <p className="text-sm text-slate-500">{weatherError}</p>
            ) : weather ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold font-display text-white tracking-tight leading-none">{weather.temperature}°</span>
                      <span className="text-base text-slate-400 capitalize ml-1">{weather.description}</span>
                    </div>
                  </div>
                  <MaterialIcon icon="cloud" className="text-4xl text-slate-300" />
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Humidity</span>
                    <span className="font-mono font-medium text-slate-200">{weather.humidity}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Wind</span>
                    <span className="font-mono font-medium text-slate-200">{weather.wind_speed} m/s</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Rainfall</span>
                    <span className="font-mono font-medium text-slate-200">{weather.rain} mm</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Feels Like</span>
                    <span className="font-mono font-medium text-slate-200">{weather.feels_like}°</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-auto">
                <MaterialIcon icon="location_off" className="text-lg" />
                Enable GPS
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===== 3. AI Decision Support ===== */}
      <Card variant="glass" padding="lg" className="w-full">
        <div className="flex items-start gap-4 mb-5">
          <div className="p-2.5 rounded-xl bg-primary-500/15 border border-primary-500/25 shrink-0">
            <MaterialIcon icon="support_agent" className="text-3xl text-primary-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold font-display text-white">AI Decision Support</h2>
            <p className="text-sm text-slate-400 mt-1">Ask about evacuations, safe routes, or what to do in an emergency.</p>
          </div>
          <Badge variant="info" size="md" className="shrink-0 mt-1">Powered by Gemini</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => handleQuickAction(action.question)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:bg-primary-500/10 hover:border-primary-500/25 text-slate-300 hover:text-white transition-all text-sm cursor-pointer text-left"
            >
              <MaterialIcon icon={action.icon} className="text-xl shrink-0 text-primary-400" />
              <span className="font-medium leading-snug">{action.label}</span>
            </button>
          ))}
        </div>

        <AIAssistantWithRef ref={aiAssistantRef} />
      </Card>

      {/* ===== 4. Emergency Contacts ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CONTACTS.map((contact, i) => (
          <div
            key={contact.name}
            className="p-4 rounded-xl border border-slate-700/40 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 shrink-0 mt-0.5">
                <MaterialIcon icon={contact.icon} className={`text-xl ${contact.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-300 truncate">{contact.name}</p>
                <p className="text-base font-bold font-display text-white tracking-tight">{contact.number}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-3 sm:mt-0 sm:justify-end">
              <button
                onClick={() => handleCopy(contact.number, i)}
                className="w-10 h-10 rounded-lg bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                title="Copy number"
                aria-label={`Copy ${contact.name} number`}
              >
                {copiedIndex === i ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </button>
              <a
                href={`tel:${contact.number}`}
                className="w-10 h-10 rounded-lg bg-primary-500/15 border border-primary-500/25 text-primary-400 hover:bg-primary-500/25 transition-colors flex items-center justify-center cursor-pointer"
                title="Call"
                aria-label={`Call ${contact.name}`}
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ===== 5. Active Disaster Events Table ===== */}
      <div className="rounded-xl border border-slate-700/40 bg-slate-900/50 backdrop-blur-sm p-5">
        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-4">Active Disaster Events</h3>
        {activeDisasters.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-base text-left">
              <thead>
                <tr className="border-b border-slate-700/30">
                  <th className="py-3.5 px-4 font-mono text-xs text-slate-500 uppercase tracking-widest font-medium">Disaster</th>
                  <th className="py-3.5 px-4 font-mono text-xs text-slate-500 uppercase tracking-widest font-medium">Severity</th>
                  <th className="py-3.5 px-4 font-mono text-xs text-slate-500 uppercase tracking-widest font-medium">Location</th>
                  <th className="py-3.5 px-4 font-mono text-xs text-slate-500 uppercase tracking-widest font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {activeDisasters.map((d) => (
                  <tr key={d.id} className="border-b border-slate-700/20 last:border-b-0 hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-200 capitalize text-sm">{d.type}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge severity={d.severity} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-sm">
                      {d.latitude.toFixed(2)}, {d.longitude.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-sm">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center gap-3 py-5 text-base text-slate-500">
            <MaterialIcon icon="check_circle" className="text-success-500" />
            No active disaster events
          </div>
        )}
      </div>
    </div>
  );
}
