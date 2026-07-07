import { Building2, Stethoscope, AlertTriangle, Users, Shield } from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import LoadingSpinner from '../components/LoadingSpinner';
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
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 mt-1">System overview and management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Shelters"
          value={shelters?.length ?? 0}
          icon={<Building2 className="h-6 w-6" />}
          subtitle={`${totalOccupancy}/${totalCapacity} occupied`}
          color="blue"
        />
        <DashboardCard
          title="Total Hospitals"
          value={hospitals?.length ?? 0}
          icon={<Stethoscope className="h-6 w-6" />}
          subtitle={`${hospitals?.filter((h) => h.emergency_available).length ?? 0} emergency ready`}
          color="green"
        />
        <DashboardCard
          title="Active Disasters"
          value={activeDisasters}
          icon={<AlertTriangle className="h-6 w-6" />}
          subtitle={`${disasters?.length ?? 0} total incidents`}
          color="red"
        />
        <DashboardCard
          title="System Status"
          value="Operational"
          icon={<Users className="h-6 w-6" />}
          subtitle="All systems online"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shelter Overview</h2>
          {shelters && shelters.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Name</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Occupancy</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Capacity</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">%</th>
                  </tr>
                </thead>
                <tbody>
                  {shelters.map((s) => (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{s.name}</td>
                      <td className="py-2 px-3 text-center">{s.occupancy}</td>
                      <td className="py-2 px-3 text-center">{s.capacity}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          (s.occupancy / s.capacity) > 0.8 ? 'bg-red-100 text-red-700' :
                          (s.occupancy / s.capacity) > 0.5 ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {Math.round((s.occupancy / s.capacity) * 100)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No shelters registered</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Disaster Zones</h2>
          {disasters && disasters.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Type</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Severity</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {disasters.map((d) => (
                    <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{d.type}</td>
                      <td className="py-2 px-3 capitalize">{d.severity}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          d.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No disaster zones</p>
          )}
        </div>
      </div>
    </div>
  );
}
