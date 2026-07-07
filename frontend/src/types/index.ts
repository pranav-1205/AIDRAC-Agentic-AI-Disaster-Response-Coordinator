export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Shelter {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  occupancy: number;
  phone?: string;
  address?: string;
}

export interface Hospital {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  emergency_available: boolean;
  phone?: string;
  address?: string;
}

export interface Disaster {
  id: number;
  type: string;
  severity: string;
  latitude: number;
  longitude: number;
  description?: string;
  status: string;
  created_at: string;
}

export interface Alert {
  id: number;
  title: string;
  message: string;
  disaster_id?: number;
  severity: string;
  created_at: string;
}

export interface Weather {
  temperature: number;
  feels_like: number;
  humidity: number;
  description: string;
  wind_speed: number;
  rain: number;
  icon: string;
  city: string;
  is_mock: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface GeoPosition {
  lat: number;
  lng: number;
}

export interface GeolocationState {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  permissionDenied: boolean;
  unsupported: boolean;
}

export interface NearestItem<T> {
  item: T;
  distanceKm: number;
}

export interface RouteInfo {
  coordinates: [number, number][];
  distanceKm: number;
  durationMin: number;
  steps: string[];
  provider: 'openrouteservice' | 'osrm' | 'straight-line';
}
