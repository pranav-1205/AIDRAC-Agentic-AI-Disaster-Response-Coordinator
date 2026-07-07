import { CloudSun, AlertTriangle, MapPin, Activity, RefreshCw, Droplets } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import LocationStatus from '../components/LocationStatus';
import { useApi } from '../hooks/useApi';
import { useGeolocation } from '../hooks/useGeolocation';
import { useWeather } from '../hooks/useWeather';
import { disasterApi, alertApi, shelterApi, hospitalApi, locationApi } from '../services/api';
import type { Disaster, Alert, Shelter, Hospital, NearbyResponse } from '../types';

export default function Dashboard() {
  const geolocation = useGeolocation({ watch: false });
  const { weather, loading: weatherLoading, error: weatherError } = useWeather(geolocation.position);

  const { data: disasters, loading: disastersLoading } = useApi<Disaster[]>(
    () => disasterApi.getActive()
  );
  const { data: alerts, loading: alertsLoading } = useApi<Alert[]>(
    () => alertApi.getAll()
  );
  const { data: dbShelters } = useApi<Shelter[]>(() => shelterApi.getAll());
  const { data: dbHospitals } = useApi<Hospital[]>(() => hospitalApi.getAll());

  const { data: nearby } = useApi<NearbyResponse>(
    () => geolocation.position ? locationApi.nearby(geolocation.position.lat, geolocation.position.lng) : Promise.reject('no gps'),
    [geolocation.position?.lat, geolocation.position?.lng]
  );

  const activeDisasters = disasters?.filter((d) => d.status === 'active').length ?? 0;
  const criticalAlerts = alerts?.filter((a) => a.severity === 'critical' || a.severity === 'severe').length ?? 0;

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
          title="Active Disasters"
          value={activeDisasters}
          icon={<AlertTriangle className="h-6 w-6" />}
          subtitle={`${disasters?.length ?? 0} total incidents`}
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Disaster Zones</h2>
        {disastersLoading ? (
          <LoadingSpinner size="sm" />
        ) : disasters && disasters.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Severity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Reported</th>
                </tr>
              </thead>
              <tbody>
                {disasters.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{d.type}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        d.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        d.severity === 'severe' ? 'bg-orange-100 text-orange-700' :
                        d.severity === 'high' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {d.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        d.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No active disasters</p>
        )}
      </div>
    </div>
  );
}
