import { Stethoscope, Phone, MapPin, Ambulance } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { hospitalApi } from '../services/api';
import { Hospital } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function Hospitals() {
  const { data: hospitals, loading, error, refetch } = useApi<Hospital[]>(() => hospitalApi.getAll());

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!hospitals || hospitals.length === 0) return <EmptyState title="No Hospitals Found" description="No hospitals are registered in the system." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
        <p className="text-gray-500 mt-1">Nearby hospitals and emergency availability</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hospitals.map((hospital) => (
          <div key={hospital.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <Stethoscope className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
                  {hospital.address && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {hospital.address}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
                  hospital.emergency_available
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                <Ambulance className="h-3 w-3" />
                {hospital.emergency_available ? 'Available' : 'Unavailable'}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {hospital.latitude.toFixed(4)}, {hospital.longitude.toFixed(4)}
              </div>
            </div>

            {hospital.phone && (
              <a
                href={`tel:${hospital.phone}`}
                className="mt-3 flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600"
              >
                <Phone className="h-3 w-3" />
                {hospital.phone}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
