import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Navigation } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { locationApi } from '../services/api';
import { findNearest } from '../utils/haversine';
import type { NearbyPlace } from '../types';

export default function EmergencyButton() {
  const navigate = useNavigate();
  const { position } = useGeolocation({ watch: false });
  const [showMenu, setShowMenu] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const handleEmergencyRoute = async () => {
    if (!position) return;
    setCalculating(true);
    try {
      const nearby = await locationApi.nearby(position.lat, position.lng);
      const shelters: NearbyPlace[] = nearby.data.shelters;
      const hospitals: NearbyPlace[] = nearby.data.hospitals;
      const nearestShelter = shelters.length > 0 ? findNearest(shelters, position.lat, position.lng) : null;
      const nearestHospital = hospitals.length > 0 ? findNearest(hospitals, position.lat, position.lng) : null;

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
