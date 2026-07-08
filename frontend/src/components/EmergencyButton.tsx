import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Home, Heart, Shield, Flame, Pill } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { locationApi } from '../services/api';
import { findNearest } from '../utils/haversine';
import type { EmergencyDestinationType, NearbyPlace, NearbyResponse, NearestItem } from '../types';
import { DESTINATION_LABELS } from '../types';

const DEST_ICONS: Record<EmergencyDestinationType, React.ReactNode> = {
  shelter: <Home className="h-5 w-5" />,
  community_centre: <Home className="h-5 w-5" />,
  school: <Home className="h-5 w-5" />,
  hospital: <Heart className="h-5 w-5" />,
  police: <Shield className="h-5 w-5" />,
  firestation: <Flame className="h-5 w-5" />,
  pharmacy: <Pill className="h-5 w-5" />,
};

const DEST_COLORS: Record<EmergencyDestinationType, string> = {
  shelter: 'bg-orange-600 hover:bg-orange-700',
  community_centre: 'bg-orange-600 hover:bg-orange-700',
  school: 'bg-orange-600 hover:bg-orange-700',
  hospital: 'bg-red-600 hover:bg-red-700',
  police: 'bg-blue-700 hover:bg-blue-800',
  firestation: 'bg-red-800 hover:bg-red-900',
  pharmacy: 'bg-emerald-600 hover:bg-emerald-700',
};

const SAFE_SHELTER_PRIORITY: { type: EmergencyDestinationType; category: keyof NearbyResponse }[] = [
  { type: 'shelter', category: 'shelters' },
  { type: 'community_centre', category: 'community_centres' },
  { type: 'school', category: 'schools' },
  { type: 'hospital', category: 'hospitals' },
  { type: 'police', category: 'police' },
  { type: 'firestation', category: 'firestations' },
];

function getCategory(dest: EmergencyDestinationType): keyof NearbyResponse {
  switch (dest) {
    case 'shelter': return 'shelters';
    case 'community_centre': return 'community_centres';
    case 'school': return 'schools';
    case 'hospital': return 'hospitals';
    case 'police': return 'police';
    case 'firestation': return 'firestations';
    case 'pharmacy': return 'pharmacies';
  }
}

export default function EmergencyButton() {
  const navigate = useNavigate();
  const { position } = useGeolocation({ watch: false });
  const [showMenu, setShowMenu] = useState(false);
  const [calculating, setCalculating] = useState<EmergencyDestinationType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => { if (errorTimer.current) clearTimeout(errorTimer.current); };
  }, []);

  const showError = (msg: string) => {
    setError(msg);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setError(null), 5000);
  };

  const handleSafeShelter = async () => {
    if (!position) return;
    setCalculating('shelter');
    try {
      const nearby = await locationApi.nearby(position.lat, position.lng);
      for (const entry of SAFE_SHELTER_PRIORITY) {
        const items: NearbyPlace[] = nearby.data[entry.category];
        if (items.length > 0) {
          const nearest = findNearest(items, position.lat, position.lng);
          navigate('/map', {
            state: {
              emergencyRoute: true,
              destinationType: entry.type,
              destinationItem: nearest,
              userPosition: position,
            },
          });
          return;
        }
      }
      showError('No safe destination found nearby.');
    } finally {
      setCalculating(null);
    }
  };

  const handleSelect = async (dest: EmergencyDestinationType) => {
    if (!position) return;
    if (dest === 'shelter') {
      await handleSafeShelter();
      return;
    }
    setCalculating(dest);
    try {
      const nearby = await locationApi.nearby(position.lat, position.lng);
      const items: NearbyPlace[] = nearby.data[getCategory(dest)];
      const nearest: NearestItem<NearbyPlace> | null = items.length > 0
        ? findNearest(items, position.lat, position.lng)
        : null;

      navigate('/map', {
        state: {
          emergencyRoute: true,
          destinationType: dest,
          destinationItem: nearest,
          userPosition: position,
        },
      });
    } finally {
      setCalculating(null);
    }
  };

  const visibleDestinations: EmergencyDestinationType[] = ['shelter', 'hospital', 'police', 'firestation', 'pharmacy'];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {showMenu && (
        <div className="flex flex-col gap-2 animate-fade-in">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg shadow">
              {error}
            </div>
          )}
          {visibleDestinations.map((dest) => {
            const loading = calculating === dest;
            return (
              <button
                key={dest}
                onClick={() => handleSelect(dest)}
                disabled={loading || !position}
                className={`flex items-center gap-2 text-white px-4 py-3 rounded-full shadow-lg transition-all disabled:opacity-50 ${DEST_COLORS[dest]}`}
              >
                <span className={loading ? 'animate-spin' : ''}>{DEST_ICONS[dest]}</span>
                <span className="font-medium text-sm whitespace-nowrap">{DESTINATION_LABELS[dest]}</span>
              </button>
            );
          })}
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
