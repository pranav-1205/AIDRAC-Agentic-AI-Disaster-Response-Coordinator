import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Navigation } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { shelterApi, hospitalApi } from '../services/api';
import { findNearest } from '../utils/haversine';
import type { Shelter, Hospital } from '../types';

export default function EmergencyButton() {
  const navigate = useNavigate();
  const { position } = useGeolocation({ watch: false });
  const [showMenu, setShowMenu] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const handleEmergencyRoute = async () => {
    if (!position) return;
    setCalculating(true);
    try {
      const [sheltersRes, hospitalsRes] = await Promise.all([
        shelterApi.getAll(),
        hospitalApi.getAll(),
      ]);
      const shelters: Shelter[] = sheltersRes.data;
      const hospitals: Hospital[] = hospitalsRes.data;
      const nearestShelter = findNearest(shelters, position.lat, position.lng);
      const nearestHospital = findNearest(hospitals, position.lat, position.lng);

      navigate('/map', {
        state: {
          emergencyRoute: true,
          nearestShelter,
          nearestHospital,
          userPosition: position,
        },
      });
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {showMenu && (
        <div className="flex flex-col gap-2 animate-fade-in">
          <button
            onClick={handleEmergencyRoute}
            disabled={calculating || !position}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-primary-700 transition-all disabled:opacity-50"
          >
            <Navigation className={`h-5 w-5 ${calculating ? 'animate-spin' : ''}`} />
            <span className="font-medium text-sm">Find Safest Route</span>
          </button>
        </div>
      )}

      <button
        onClick={() => setShowMenu((prev) => !prev)}
        className="flex items-center gap-2 bg-red-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-red-700 transition-all animate-bounce"
      >
        <Phone className="h-5 w-5" />
        <span className="font-bold">Emergency: 112</span>
      </button>
    </div>
  );
}
