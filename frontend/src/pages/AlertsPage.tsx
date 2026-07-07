import { Bell, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { alertApi } from '../services/api';
import { Alert } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

const severityConfig = {
  critical: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: AlertTriangle },
  severe: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', icon: AlertTriangle },
  warning: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', icon: AlertCircle },
  info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: Info },
};

export default function AlertsPage() {
  const { data: alerts, loading, error, refetch } = useApi<Alert[]>(() => alertApi.getAll());

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!alerts || alerts.length === 0) return <EmptyState title="No Alerts" description="There are no emergency alerts at this time." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emergency Alerts</h1>
        <p className="text-gray-500 mt-1">Real-time emergency notifications and warnings</p>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info;
          const Icon = config.icon;

          return (
            <div key={alert.id} className={`border rounded-xl p-4 ${config.bg}`}>
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg mt-0.5 ${config.bg}`}>
                  <Icon className={`h-5 w-5 ${config.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${config.text}`}>{alert.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${config.bg} ${config.text}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
