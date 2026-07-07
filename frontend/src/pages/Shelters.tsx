import { Building2, MapPin, Users, Phone } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { shelterApi } from '../services/api';
import { Shelter } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function Shelters() {
  const { data: shelters, loading, error, refetch } = useApi<Shelter[]>(() => shelterApi.getAll());

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!shelters || shelters.length === 0) return <EmptyState title="No Shelters Found" description="No shelters are registered in the system." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shelters</h1>
        <p className="text-gray-500 mt-1">Emergency shelters and their current occupancy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shelters.map((shelter) => {
          const occupancyPercent = Math.round((shelter.occupancy / shelter.capacity) * 100);
          const isFull = occupancyPercent >= 90;

          return (
            <div key={shelter.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Building2 className="h-5 w-5 text-emergency-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{shelter.name}</h3>
                    {shelter.address && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {shelter.address}
                      </p>
                    )}
                  </div>
                </div>
                {isFull && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                    Full
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{shelter.occupancy} / {shelter.capacity} occupied</span>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isFull ? 'bg-red-500' : occupancyPercent > 60 ? 'bg-emergency-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{occupancyPercent}% full</span>
                  <span>{shelter.capacity - shelter.occupancy} spots left</span>
                </div>
              </div>

              {shelter.phone && (
                <a
                  href={`tel:${shelter.phone}`}
                  className="mt-3 flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600"
                >
                  <Phone className="h-3 w-3" />
                  {shelter.phone}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
