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
  event?: string;
  external_id?: string;
  expires_at?: string;
  expired_at?: string;
  is_active?: boolean;
  area?: string;
  urgency?: string;
  certainty?: string;
  polygons?: string;
  source?: string;
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

export type NearbyCategory = 'hospital' | 'shelter' | 'police' | 'firestation' | 'pharmacy';
export type EmergencyDestinationType = 'shelter' | 'community_centre' | 'school' | 'hospital' | 'police' | 'firestation' | 'pharmacy';
export const DESTINATION_LABELS: Record<EmergencyDestinationType, string> = {
  shelter: 'Safe Shelter',
  community_centre: 'Community Centre',
  school: 'School',
  hospital: 'Hospital',
  police: 'Police Station',
  firestation: 'Fire Station',
  pharmacy: 'Pharmacy',
};

export interface NearbyPlace {
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
  address: string | null;
}

export interface NearbyResponse {
  hospitals: NearbyPlace[];
  shelters: NearbyPlace[];
  community_centres: NearbyPlace[];
  schools: NearbyPlace[];
  police: NearbyPlace[];
  firestations: NearbyPlace[];
  pharmacies: NearbyPlace[];
}

export interface AIRecommendationRequest {
  question: string;
  lat?: number;
  lng?: number;
}

export interface UserSettings {
  id: number;
  user_id: number;
  theme: string;
  accent_color: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  sound_alerts: boolean;
  emergency_radius: number;
  min_alert_severity: string;
  default_map_type: string;
  auto_locate: boolean;
  show_gov_alerts: boolean;
  show_user_disasters: boolean;
  larger_text: boolean;
  reduced_motion: boolean;
}

export interface AIRecommendationResponse {
  riskLevel: string;
  summary: string;
  recommendedDestination: { type: string; name: string } | null;
  reason: string;
  actions: string[];
}
