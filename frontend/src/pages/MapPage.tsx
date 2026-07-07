import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useApi } from '../hooks/useApi';
import { shelterApi, hospitalApi, disasterApi } from '../services/api';
import { Shelter, Hospital, Disaster } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

const userIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#1e40af;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:16px;">📍</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const shelterIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#f97316;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;">🏠</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const hospitalIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#dc2626;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-size:14px;">🏥</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const disasterIcon = L.divIcon({
  className: 'custom-marker',
  html: '<div style="background:#991b1b;color:white;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:3px solid #fca5a5;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:16px;">⚠️</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapController() {
  const map = useMap();
  return null;
}

export default function MapPage() {
  const [activeLayer, setActiveLayer] = useState<'all' | 'shelters' | 'hospitals' | 'disasters'>('all');
  const userPosition: [number, number] = [28.6139, 77.209];

  const { data: shelters, loading: sheltersLoading } = useApi<Shelter[]>(() => shelterApi.getAll());
  const { data: hospitals, loading: hospitalsLoading } = useApi<Hospital[]>(() => hospitalApi.getAll());
  const { data: disasters, loading: disastersLoading } = useApi<Disaster[]>(() => disasterApi.getAll());

  const loading = sheltersLoading || hospitalsLoading || disastersLoading;

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'severe': return '#ea580c';
      case 'high': return '#ca8a04';
      default: return '#2563eb';
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interactive Map</h1>
          <p className="text-gray-500 mt-1">Disaster zones, shelters, and hospitals</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'shelters', 'hospitals', 'disasters'] as const).map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeLayer === layer
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {layer.charAt(0).toUpperCase() + layer.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden" style={{ height: '600px' }}>
        <MapContainer center={userPosition} zoom={12} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={userPosition} icon={userIcon}>
            <Popup>
              <div className="text-sm font-medium">Your Location</div>
            </Popup>
          </Marker>

          {(activeLayer === 'all' || activeLayer === 'shelters') &&
            shelters?.map((s) => (
              <Marker key={`s-${s.id}`} position={[s.latitude, s.longitude]} icon={shelterIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-medium">{s.name}</p>
                    <p>Capacity: {s.occupancy}/{s.capacity}</p>
                    <p className="text-xs text-gray-500">{s.address}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {(activeLayer === 'all' || activeLayer === 'hospitals') &&
            hospitals?.map((h) => (
              <Marker key={`h-${h.id}`} position={[h.latitude, h.longitude]} icon={hospitalIcon}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-medium">{h.name}</p>
                    <p className={h.emergency_available ? 'text-green-600' : 'text-red-600'}>
                      {h.emergency_available ? 'Emergency Available' : 'No Emergency'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {(activeLayer === 'all' || activeLayer === 'disasters') &&
            disasters?.map((d) => (
              <div key={`d-${d.id}`}>
                <Marker position={[d.latitude, d.longitude]} icon={disasterIcon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{d.type}</p>
                      <p className="capitalize">Severity: {d.severity}</p>
                      <p className="capitalize">Status: {d.status}</p>
                      {d.description && <p className="text-xs text-gray-500 mt-1">{d.description}</p>}
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[d.latitude, d.longitude]}
                  radius={1000}
                  pathOptions={{
                    color: severityColor(d.severity),
                    fillColor: severityColor(d.severity),
                    fillOpacity: 0.1,
                  }}
                />
              </div>
            ))}
        </MapContainer>
      </div>

      <div className="flex items-center gap-6 text-sm text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary-500 inline-block" /> Your Location</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emergency-500 inline-block" /> Shelter</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Hospital</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-900 inline-block" /> Disaster Zone</span>
      </div>
    </div>
  );
}
