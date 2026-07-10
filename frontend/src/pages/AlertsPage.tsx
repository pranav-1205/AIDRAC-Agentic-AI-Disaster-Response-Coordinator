import { useMemo } from 'react';
import MaterialIcon from '../components/ui/MaterialIcon';
import { useApi } from '../hooks/useApi';
import { alertApi } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { Alert } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

const SEVERITY_RANK: Record<string, number> = {
  critical: 0, severe: 1, high: 2, warning: 3, moderate: 4, advisory: 5, info: 6,
};

function meetsMinSeverity(severity: string, min: string): boolean {
  return (SEVERITY_RANK[severity] ?? 6) <= (SEVERITY_RANK[min] ?? 6);
}

const severityConfig = {
  critical: { badgeVariant: 'danger' as const, icon: 'warning', color: 'text-danger-400' },
  severe: { badgeVariant: 'warning' as const, icon: 'error', color: 'text-warning-400' },
  warning: { badgeVariant: 'info' as const, icon: 'info', color: 'text-blue-400' },
  info: { badgeVariant: 'info' as const, icon: 'info', color: 'text-on-surface-variant' },
};

export default function AlertsPage() {
  const { settings } = useSettings();
  const { data: alerts, loading, error, refetch } = useApi<Alert[]>(() => alertApi.getAll());

  const filtered = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter((a) => meetsMinSeverity(a.severity, settings.min_alert_severity));
  }, [alerts, settings.min_alert_severity]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!alerts || alerts.length === 0) return <EmptyState title="No Alerts" description="There are no emergency alerts at this time." />;
  if (filtered.length === 0) return <EmptyState title="No Alerts" description={`No alerts at "${settings.min_alert_severity}" severity or higher.`} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display text-on-surface tracking-tight">Emergency Alerts</h1>
        <p className="text-sm text-on-surface-variant mt-1 font-mono uppercase tracking-widest">Real-time emergency notifications and warnings</p>
      </div>

      <div className="space-y-4">
        {filtered.map((alert) => {
          const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info;

          return (
            <Card key={alert.id} variant="default" padding="md" className="flex items-start gap-4 hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200">
              <div className="shrink-0 mt-0.5">
                <MaterialIcon icon={config.icon} className={`text-2xl ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold font-display text-on-surface">{alert.title}</h3>
                  <Badge variant={config.badgeVariant} size="sm">{alert.severity}</Badge>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">{alert.message}</p>
                <div className="flex items-center gap-2 mt-4 text-sm font-mono text-on-surface-variant uppercase tracking-widest">
                  <MaterialIcon icon="schedule" className="text-base" />
                  {new Date(alert.created_at).toLocaleString()}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
