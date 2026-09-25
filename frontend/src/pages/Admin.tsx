import { useState, useEffect, useCallback } from 'react';
import MaterialIcon from '../components/ui/MaterialIcon';
import DashboardCard from '../components/DashboardCard';
import StatusBadge from '../components/ui/StatusBadge';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Badge from '../components/ui/Badge';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { adminApi, shelterApi, hospitalApi, disasterApi, alertApi, sosApi, locationApi } from '../services/api';
import { Shelter, Hospital, SOSStatus, SOSResponderType, AdminOverviewResponse, AdminZoneStatsResponse, AdminResponderResponse, AdminIncidentHistoryResponse, AdminSOSResponse } from '../types';
import { AlertTriangle, Navigation, UserCheck, Shield, MapPin, Clock, User, Users, CheckCircle, XCircle, Map, RefreshCw, MoreVertical } from 'lucide-react';

const STATUS_COLORS: Record<SOSStatus, string> = {
  active: 'bg-danger-500/20 border-danger-500/30 text-danger-400',
  received: 'bg-danger-500/20 border-danger-500/30 text-danger-400',
  acknowledged: 'bg-warning-500/20 border-warning-500/30 text-warning-400',
  awaiting_responder: 'bg-warning-500/20 border-warning-500/30 text-warning-400',
  responder_assigned: 'bg-primary-500/20 border-primary-500/30 text-primary-400',
  responder_accepted: 'bg-success-500/20 border-success-500/30 text-success-400',
  assistance_in_progress: 'bg-primary-500/20 border-primary-500/30 text-primary-400',
  assistance_provided: 'bg-success-500/20 border-success-500/30 text-success-400',
  user_confirmed_safe: 'bg-success-500/20 border-success-500/30 text-success-400',
  cancelled: 'bg-slate-500/20 border-slate-500/30 text-slate-400',
  resolved: 'bg-success-500/20 border-success-500/30 text-success-400',
};

const STATUS_LABELS: Record<SOSStatus, string> = {
  active: 'Active',
  received: 'Received',
  acknowledged: 'Acknowledged',
  awaiting_responder: 'Awaiting Responder',
  responder_assigned: 'Responder Assigned',
  responder_accepted: 'Responder Accepted',
  assistance_in_progress: 'Assistance In Progress',
  assistance_provided: 'Assistance Provided',
  user_confirmed_safe: 'User Confirmed Safe',
  cancelled: 'Cancelled',
  resolved: 'Resolved',
};

const RESPONDER_TYPE_LABELS: Record<SOSResponderType, string> = {
  community: 'Community Responder',
  official: 'Official Responder',
};

const STATUS_GROUPS: { key: string; label: string; statuses: SOSStatus[] }[] = [
  { key: 'active', label: 'NEW', statuses: ['active', 'received'] },
  { key: 'acknowledged', label: 'ACKNOWLEDGED', statuses: ['acknowledged'] },
  { key: 'assigned', label: 'ASSIGNED', statuses: ['awaiting_responder', 'responder_assigned'] },
  { key: 'responding', label: 'RESPONDING', statuses: ['responder_accepted', 'assistance_in_progress'] },
  { key: 'resolved', label: 'RESOLVED', statuses: ['assistance_provided', 'user_confirmed_safe', 'resolved'] },
];


function SOSStatusGroup({ statuses, label, incidents, onAction }: {
  statuses: SOSStatus[];
  label: string;
  incidents: AdminSOSResponse[];
  onAction: (sos: AdminSOSResponse, action: string) => void;
}) {
  const filtered = incidents.filter(s => statuses.includes(s.status));
  
  if (filtered.length === 0) return null;

  return (
    <Card variant="glass" padding="md" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest">{label}</h3>
        <Badge variant="info" size="sm">{filtered.length}</Badge>
      </div>
      <div className="space-y-2">
        {filtered.map((sos) => (
          <div key={sos.id} className={`p-3 rounded-lg border ${STATUS_COLORS[sos.status] || 'bg-slate-800/50 border-slate-700/50'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-mono text-slate-400">SOS #{sos.id}</span>
                  <span className="px-2 py-1 rounded text-xs font-mono uppercase tracking-wider" style={{ backgroundColor: STATUS_COLORS[sos.status] }}>
                    {STATUS_LABELS[sos.status]}
                  </span>
                  {sos.responder_type && (
                    <span className="px-2 py-1 rounded text-xs font-mono bg-slate-700/50 border border-slate-600">
                      {RESPONDER_TYPE_LABELS[sos.responder_type]}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-300">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {sos.reporting_user_name || `User #${sos.reporting_user_id}`}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {sos.latitude.toFixed(4)}, {sos.longitude.toFixed(4)}
                    {sos.location_accuracy && ` (±${Math.round(sos.location_accuracy)}m)`}
                  </span>
                  {sos.emergency_type && (
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {sos.emergency_type}
                    </span>
                  )}
                  {sos.assigned_responder_name && (
                    <span className="flex items-center gap-1 text-success-400">
                      <UserCheck className="h-3 w-3" />
                      Responder: {sos.assigned_responder_name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-xs text-slate-500">
                  Created: {new Date(sos.created_at).toLocaleString()}
                </span>
                {sos.accepted_at && (
                  <span className="text-xs text-slate-500">
                    Accepted: {new Date(sos.accepted_at).toLocaleString()}
                  </span>
                )}
                <div className="flex gap-1">
                  {sos.status === 'active' || sos.status === 'received' ? (
                    <>
                      <button
                        onClick={() => onAction(sos, 'acknowledge')}
                        className="px-2 py-1 text-xs rounded bg-warning-500/20 border border-warning-500/30 text-warning-400 hover:bg-warning-500/30"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => onAction(sos, 'assign')}
                        className="px-2 py-1 text-xs rounded bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30"
                      >
                        Assign
                      </button>
                    </>
                  ) : sos.status === 'acknowledged' || sos.status === 'awaiting_responder' ? (
                    <button
                      onClick={() => onAction(sos, 'assign')}
                      className="px-2 py-1 text-xs rounded bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30"
                    >
                      Assign Responder
                    </button>
                  ) : sos.status === 'responder_assigned' || sos.status === 'responder_accepted' ? (
                    <button
                      onClick={() => onAction(sos, 'progress')}
                      className="px-2 py-1 text-xs rounded bg-success-500/20 border border-success-500/30 text-success-400 hover:bg-success-500/30"
                    >
                      Mark Progress
                    </button>
                  ) : sos.status === 'assistance_in_progress' ? (
                    <button
                      onClick={() => onAction(sos, 'complete')}
                      className="px-2 py-1 text-xs rounded bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30"
                    >
                      Mark Complete
                    </button>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded bg-slate-500/20 border border-slate-500/30 text-slate-400">
                      Closed
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ResponderList({ responders, onAssign }: { responders: AdminResponderResponse[]; onAssign: (responderId: number) => void }) {
  if (responders.length === 0) {
    return (
      <div className="flex items-center gap-3 py-5 text-base text-slate-500">
        <Users className="text-slate-500" />
        No available responders
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {responders.map((r) => (
        <div key={r.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${r.is_online ? 'bg-green-500' : 'bg-slate-500'}`} />
            <div>
              <p className="text-sm font-medium text-white">{r.full_name}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                {r.last_location_update && (
                  <>
                    <Clock className="h-3 w-3" />
                    {new Date(r.last_location_update).toLocaleTimeString()}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {r.active_sos_id && (
              <Badge variant="info" size="sm" className="text-xs">
                Active SOS: {r.active_sos_status}
              </Badge>
            )}
            {!r.active_sos_id && (
              <button
                onClick={() => onAssign(r.id)}
                className="px-3 py-1.5 text-xs rounded bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30"
              >
                Assign
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ZoneStatsPanel({ stats, onRefresh }: { stats: AdminZoneStatsResponse | null; onRefresh: () => void }) {
  if (!stats) return null;

  return (
    <Card variant="glass" padding="md" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest">Affected Zone Statistics</h3>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded hover:bg-white/5 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4 text-slate-400" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-danger-500/10 border border-danger-500/20">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">People in Zone</p>
          <p className="text-2xl font-bold font-display text-danger-400">{stats.total_people_detected}</p>
        </div>
        <div className="p-3 rounded-lg bg-warning-500/10 border border-warning-500/20">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">Requiring Help</p>
          <p className="text-2xl font-bold font-display text-warning-400">{stats.people_requiring_help}</p>
        </div>
        <div className="p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">Active SOS</p>
          <p className="text-2xl font-bold font-display text-primary-400">{stats.active_sos}</p>
        </div>
        <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/20">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">People Helped</p>
          <p className="text-2xl font-bold font-display text-success-400">{stats.people_helped}</p>
        </div>
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">Marked Safe</p>
          <p className="text-2xl font-bold font-display text-emerald-400">{stats.people_marked_safe}</p>
        </div>
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">Active Responders</p>
          <p className="text-2xl font-bold font-display text-purple-400">{stats.responders_active}</p>
        </div>
      </div>
    </Card>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { settings } = useSettings();

  const { data: overview, loading: overviewLoading, refetch: refetchOverview } = useApi<AdminOverviewResponse>(
    () => adminApi.getOverview(),
    []
  );

  const { data: sosIncidents, loading: sosLoading, refetch: refetchSOS } = useApi<AdminSOSResponse[]>(
    () => adminApi.getSOS({ limit: 100 }),
    []
  );

  const { data: responders, loading: respondersLoading, refetch: refetchResponders } = useApi<AdminResponderResponse[]>(
    () => adminApi.getResponders({ active_only: true, limit: 50 }),
    []
  );

  const { data: zoneStats, loading: zoneStatsLoading, refetch: refetchZoneStats } = useApi<AdminZoneStatsResponse>(
    () => adminApi.getZoneStats(),
    []
  );

  const loading = overviewLoading || sosLoading || respondersLoading;

  const handleSOSAction = useCallback(async (sos: AdminSOSResponse, action: string) => {
    try {
      switch (action) {
        case 'acknowledge':
          await adminApi.acknowledgeSOS(sos.id);
          break;
        case 'assign':
          // In a real implementation, this would open a modal to select responder
          // For now, we'll just acknowledge
          await adminApi.acknowledgeSOS(sos.id);
          break;
        case 'progress':
          await adminApi.updateSOSStatus(sos.id, 'assistance_in_progress');
          break;
        case 'complete':
          await adminApi.updateSOSStatus(sos.id, 'assistance_provided');
          break;
      }
      refetchSOS();
      refetchOverview();
      refetchZoneStats();
    } catch (err) {
      console.error('Failed to perform SOS action:', err);
    }
  }, [refetchSOS, refetchOverview, refetchZoneStats]);

  const handleAssignResponder = useCallback(async (responderId: number) => {
    // This would need a selected SOS ID - for now just refresh
    refetchResponders();
    refetchOverview();
  }, [refetchResponders, refetchOverview]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.2)]">
          <MaterialIcon icon="admin_panel_settings" className="text-3xl text-primary-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-sm font-mono text-slate-400 uppercase tracking-widest mt-1">Emergency Response Coordination Center</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { refetchOverview(); refetchSOS(); refetchResponders(); refetchZoneStats(); }}
            className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/40 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            title="Refresh All"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6">
        <DashboardCard
          title="Active Alerts"
          value={overview?.active_alerts ?? 0}
          icon="notifications_active"
          subtitle="Government disaster alerts"
          color="red"
        />
        <DashboardCard
          title="Active SOS"
          value={overview?.active_sos ?? 0}
          icon="warning"
          subtitle="Emergency incidents requiring response"
          color="orange"
        />
        <DashboardCard
          title="In Affected Zones"
          value={overview?.people_in_affected_zones ?? 0}
          icon="location_on"
          subtitle="Users detected in alert areas"
          color="blue"
        />
        <DashboardCard
          title="Requiring Help"
          value={overview?.people_requiring_help ?? 0}
          icon="sos"
          subtitle="SOS without assigned responder"
          color="amber"
        />
        <DashboardCard
          title="Marked Safe"
          value={overview?.people_marked_safe ?? 0}
          icon="check_circle"
          subtitle="Confirmed safe by victim"
          color="green"
        />
        <DashboardCard
          title="Available Responders"
          value={overview?.available_responders ?? 0}
          icon="volunteer_activism"
          subtitle="Online users with location sharing"
          color="purple"
        />
        <DashboardCard
          title="Active Tasks"
          value={overview?.active_response_tasks ?? 0}
          icon="assignment"
          subtitle="SOS with responder en route"
          color="cyan"
        />
      </div>

      {/* Zone Statistics */}
      <ZoneStatsPanel stats={zoneStats} onRefresh={refetchZoneStats} />

      {/* SOS Management by Status */}
      <div className="space-y-6">
        <SectionHeader title="SOS Incident Management" subtitle="Grouped by response status" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {STATUS_GROUPS.map((group) => (
            <SOSStatusGroup
              key={group.key}
              statuses={group.statuses}
              label={group.label}
              incidents={sosIncidents || []}
              onAction={handleSOSAction}
            />
          ))}
        </div>
      </div>

      {/* Responders Available for Assignment */}
      <Card variant="glass" padding="md">
        <SectionHeader title="Available Nearby Responders" subtitle="Users with location sharing enabled who can be assigned to SOS incidents" />
        <ResponderList responders={responders || []} onAssign={handleAssignResponder} />
      </Card>

      {/* Incident History */}
      <Card variant="glass" padding="md">
        <SectionHeader title="Incident History" subtitle="Recent SOS incidents and resolutions" />
        <div className="space-y-2">
          {(sosIncidents || []).filter(s => ['resolved', 'cancelled', 'user_confirmed_safe'].includes(s.status)).slice(0, 10).map((sos) => (
            <div key={sos.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-mono text-slate-400">SOS #{sos.id}</span>
                <span className="px-2 py-1 rounded text-xs font-mono uppercase tracking-wider" style={{ backgroundColor: STATUS_COLORS[sos.status] }}>
                  {STATUS_LABELS[sos.status]}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-300">
                <span>{sos.reporting_user_name || `User #${sos.reporting_user_id}`}</span>
                {sos.assigned_responder_name && (
                  <span className="text-success-400 flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    Responder: {sos.assigned_responder_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(sos.created_at).toLocaleString()}
                </span>
                {sos.resolved_at && (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-success-400" />
                    Resolved: {new Date(sos.resolved_at).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}