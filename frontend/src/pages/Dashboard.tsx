import { CloudSun, AlertTriangle, MapPin, Activity, RefreshCw, Droplets } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import LocationStatus from '../components/LocationStatus';
import AIAssistant from '../components/AIAssistant';
import { useApi } from '../hooks/useApi';
import { useGeolocation } from '../hooks/useGeolocation';
import { useWeather } from '../hooks/useWeather';
import { alertApi, shelterApi, hospitalApi, locationApi } from '../services/api';
import type { Alert, Shelter, Hospital, NearbyResponse } from '../types';

export default function Dashboard() {
  const geolocation = useGeolocation({ watch: false });
  const { weather, loading: weatherLoading, error: weatherError } = useWeather(geolocation.position);

  const { data: alerts, loading: alertsLoading } = useApi<Alert[]>(
    () => alertApi.getAll()
  );
  const { data: dbShelters } = useApi<Shelter[]>(() => shelterApi.getAll());
  const { data: dbHospitals } = useApi<Hospital[]>(() => hospitalApi.getAll());

  const { data: nearby } = useApi<NearbyResponse>(
    () => geolocation.position ? locationApi.nearby(geolocation.position.lat, geolocation.position.lng) : Promise.reject('no gps'),
    [geolocation.position?.lat, geolocation.position?.lng]
  );

  const distinctEvents = [...new Set(alerts?.filter((a) => a.event).map((a) => a.event) ?? [])];
  const activeDisasterEvents = distinctEvents.length;
  const totalActiveAlerts = alerts?.length ?? 0;
  const criticalAlerts = alerts?.filter((a) => a.severity === 'critical' || a.severity === 'severe').length ?? 0;

  const sevRank: Record<string, number> = { critical: 0, severe: 1, high: 2, warning: 3, advisory: 4, info: 5 };
  const eventMap = new Map<string, { count: number; severity: string; areas: Set<string> }>();
  alerts?.filter((a) => a.event).forEach((a) => {
    const ev = a.event!;
    if (!eventMap.has(ev)) eventMap.set(ev, { count: 0, severity: a.severity, areas: new Set() });
    const entry = eventMap.get(ev)!;
    entry.count++;
    if ((sevRank[a.severity] ?? 5) < (sevRank[entry.severity] ?? 5)) entry.severity = a.severity;
    if (a.area) entry.areas.add(a.area);
  });
  const eventList = Array.from(eventMap.entries()).map(([event, info]) => ({
    event,
    count: info.count,
    severity: info.severity,
    area: [...info.areas].join(', '),
  })).sort((a, b) => b.count - a.count);

  const shelterCount = nearby ? nearby.shelters.length : (dbShelters?.length ?? 0);
  const hospitalCount = nearby ? nearby.hospitals.length : (dbHospitals?.length ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Real-time disaster response overview</p>
        </div>
        <LocationStatus geolocation={geolocation} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Active Alerts Events"
          value={activeDisasterEvents}
          icon={<AlertTriangle className="h-6 w-6" />}
          subtitle={`${totalActiveAlerts} active alerts`}
          color="red"
        />
        <DashboardCard
          title="Critical Alerts"
          value={criticalAlerts}
          icon={<Activity className="h-6 w-6" />}
          subtitle={`${alerts?.length ?? 0} total alerts`}
          color="orange"
        />
        <DashboardCard
          title="Available Shelters"
          value={shelterCount}
          icon={<MapPin className="h-6 w-6" />}
          subtitle={nearby ? 'live (OSM)' : 'from database'}
          color="blue"
        />
        <DashboardCard
          title="Hospitals"
          value={hospitalCount}
          icon={<MapPin className="h-6 w-6" />}
          subtitle={nearby ? 'live (OSM)' : 'from database'}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CloudSun className="h-5 w-5 text-primary-500" />
            Current Weather
            {weatherLoading && !weather && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
          </h2>
          {weatherLoading && !weather ? (
            <LoadingSpinner size="sm" />
          ) : weatherError && !weather ? (
            <ErrorState message={weatherError} />
          ) : weather ? (
            <div className="flex items-center gap-6">
              <div className="text-5xl font-bold text-primary-900">
                {weather.temperature}°C
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="capitalize">{weather.description}</p>
                <p>Feels like: {weather.feels_like}°C</p>
                <p>Humidity: {weather.humidity}%</p>
                <p>Wind: {weather.wind_speed} m/s</p>
                <p className="flex items-center gap-1"><Droplets className="h-3 w-3" /> Rain: {weather.rain > 0 ? `${weather.rain} mm/h` : 'None'}</p>
                <p className="text-xs text-gray-400">
                  {weather.city}
                  {weather.is_mock && ' (mock)'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <MapPin className="h-5 w-5 mr-2" />
              Enable GPS for local weather
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Recent Alerts
          </h2>
          {alertsLoading ? (
            <LoadingSpinner size="sm" />
          ) : alerts && alerts.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg text-sm border ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : alert.severity === 'severe'
                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}
                >
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-xs mt-0.5 opacity-75">{alert.message.slice(0, 80)}...</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No recent alerts</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Disaster Events</h2>
        {alertsLoading ? (
          <LoadingSpinner size="sm" />
        ) : eventList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Event</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Severity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Area</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Alerts</th>
                </tr>
              </thead>
              <tbody>
                {eventList.map((ev) => (
                  <tr key={ev.event} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{ev.event}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        ev.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        ev.severity === 'severe' ? 'bg-orange-100 text-orange-700' :
                        ev.severity === 'high' ? 'bg-yellow-100 text-yellow-700' :
                        ev.severity === 'warning' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {ev.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{ev.area || '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{ev.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No active disaster events from CAP alerts</p>
        )}
      </div>

      <AIAssistant />
    </div>
  );
}
