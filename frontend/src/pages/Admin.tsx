import MaterialIcon from '../components/ui/MaterialIcon';
import DashboardCard from '../components/DashboardCard';
import StatusBadge from '../components/ui/StatusBadge';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useApi } from '../hooks/useApi';
import { shelterApi, hospitalApi, disasterApi } from '../services/api';
import { Shelter, Hospital, Disaster } from '../types';

export default function Admin() {
  const { data: shelters, loading: sheltersLoading } = useApi<Shelter[]>(() => shelterApi.getAll());
  const { data: hospitals, loading: hospitalsLoading } = useApi<Hospital[]>(() => hospitalApi.getAll());
  const { data: disasters, loading: disastersLoading } = useApi<Disaster[]>(() => disasterApi.getAll());

  const loading = sheltersLoading || hospitalsLoading || disastersLoading;

  if (loading) return <LoadingSpinner />;

  const activeDisasters = disasters?.filter((d) => d.status === 'active').length ?? 0;
  const totalCapacity = shelters?.reduce((sum, s) => sum + s.capacity, 0) ?? 0;
  const totalOccupancy = shelters?.reduce((sum, s) => sum + s.occupancy, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.2)]">
          <MaterialIcon icon="admin_panel_settings" className="text-3xl text-primary-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display text-white tracking-tight">Admin Console</h1>
          <p className="text-sm font-mono text-slate-400 uppercase tracking-widest mt-1">System Overview & Management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Shelters"
          value={shelters?.length ?? 0}
          icon="emergency_home"
          subtitle={`${totalOccupancy}/${totalCapacity} occupied`}
          color="blue"
        />
        <DashboardCard
          title="Total Hospitals"
          value={hospitals?.length ?? 0}
          icon="local_hospital"
          subtitle={`${hospitals?.filter((h) => h.emergency_available).length ?? 0} emergency ready`}
          color="green"
        />
        <DashboardCard
          title="Active Disasters"
          value={activeDisasters}
          icon="warning"
          subtitle={`${disasters?.length ?? 0} total incidents`}
          color="red"
        />
        <DashboardCard
          title="System Status"
          value="Operational"
          icon="dns"
          subtitle="All systems online"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glass" padding="md">
          <SectionHeader title="Shelter Overview" />
          {shelters && shelters.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-sm font-mono uppercase tracking-widest text-slate-400">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-center py-3 px-4">Occupancy</th>
                    <th className="text-center py-3 px-4">Capacity</th>
                    <th className="text-center py-3 px-4">%</th>
                  </tr>
                </thead>
                <tbody>
                  {shelters.map((s) => (
                    <tr key={s.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-200">{s.name}</td>
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">{s.occupancy}</td>
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">{s.capacity}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge severity={
                          (s.occupancy / s.capacity) > 0.8 ? 'critical' :
                          (s.occupancy / s.capacity) > 0.5 ? 'severe' : 'low'
                        } />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-sm mt-4 font-mono">No shelters registered</p>
          )}
        </Card>

        <Card variant="glass" padding="md">
          <SectionHeader title="Active Disaster Zones" />
          {disasters && disasters.length > 0 ? (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-sm font-mono uppercase tracking-widest text-slate-400">
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Severity</th>
                    <th className="text-center py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {disasters.map((d) => (
                    <tr key={d.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-200">{d.type}</td>
                      <td className="py-3 px-4 capitalize text-slate-400">{d.severity}</td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge severity={d.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 text-sm mt-4 font-mono">No disaster zones</p>
          )}
        </Card>
      </div>
    </div>
  );
}
