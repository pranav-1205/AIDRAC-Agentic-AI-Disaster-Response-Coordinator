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

export interface AlertLocation {
  name: string;
  latitude: number;
  longitude: number;
  location_source: string;
  location_type?: string | null;
  state?: string | null;
  district?: string | null;
  resolved_order?: number | null;
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
  latitude?: number | null;
  longitude?: number | null;
  location_source?: string | null;
  locations?: AlertLocation[];
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
  accuracy: number;
  timestamp: number;
}

export interface GeolocationState {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  permissionDenied: boolean;
  unsupported: boolean;
  permissionState: PermissionState;
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
  category?: string;
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

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  response?: AIRecommendationResponse;
  error?: string;
  loading?: boolean;
}

export interface RiskComponentBreakdown {
  weather_score: number;
  alert_score: number;
  disaster_score: number;
  infrastructure_score: number;
}

export interface RiskAssessmentResponse {
  user_risk: string;
  regional_alert_severity: string;
  reason: string;
  evacuation_required: boolean;
  inside_alert_polygon: boolean;
  nearby_alerts: number;
  regional_alert_count: number;
  components: RiskComponentBreakdown;
}

export interface NearbyUser {
  user_id: number;
  full_name: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  last_seen: string;
  status: string;
}

export interface NearbyUsersResponse {
  users: NearbyUser[];
  count: number;
}

export type SOSStatus = 
  | 'active' 
  | 'cancelled' 
  | 'resolved' 
  | 'received' 
  | 'acknowledged' 
  | 'awaiting_responder' 
  | 'responder_assigned' 
  | 'responder_accepted' 
  | 'assistance_in_progress' 
  | 'assistance_provided' 
  | 'user_confirmed_safe';

export type SOSResponderType = 'community' | 'official';

export interface SOSIncident {
  id: number;
  reporting_user_id: number;
  assigned_responder_id: number | null;
  latitude: number;
  longitude: number;
  location_accuracy: number | null;
  location_timestamp: number | null;
  emergency_type: string | null;
  emergency_details: string | null;
  status: SOSStatus;
  responder_type: SOSResponderType | null;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  resolved_at: string | null;
  reporting_user_name?: string;
  assigned_responder_name?: string;
}

export interface SOSAdminListResponse {
  id: number;
  reporting_user_id: number;
  reporting_user_name: string | null;
  assigned_responder_id: number | null;
  assigned_responder_name: string | null;
  latitude: number;
  longitude: number;
  location_accuracy: number | null;
  emergency_type: string | null;
  status: SOSStatus;
  responder_type: SOSResponderType | null;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  resolved_at: string | null;
}

export interface SOSNearbyResponse {
  sos_id: number;
  distance_km: number;
  emergency_type: string | null;
  created_at: string;
  victim_name: string;
}

export interface SOSActiveResponse {
  sos: SOSIncident | null;
  is_responder: boolean;
  responder_sos: SOSIncident | null;
}

export interface SOSIncidentCreate {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  emergency_type?: string;
  emergency_details?: string;
}

export interface AdminOverviewResponse {
  active_alerts: number;
  active_sos: number;
  people_in_affected_zones: number;
  people_marked_safe: number;
  people_requiring_help: number;
  available_responders: number;
  active_response_tasks: number;
}

export interface AdminAlertResponse {
  id: number;
  title: string;
  message: string;
  severity: string;
  created_at: string;
  external_id?: string;
  expires_at?: string;
  event?: string;
  urgency?: string;
  certainty?: string;
  area?: string;
  is_active: boolean;
  polygons?: string;
  source?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_source?: string | null;
  locations?: AlertLocation[];
}

export interface AdminSOSResponse {
  id: number;
  reporting_user_id: number;
  reporting_user_name?: string | null;
  assigned_responder_id?: number | null;
  assigned_responder_name?: string | null;
  latitude: number;
  longitude: number;
  location_accuracy?: number | null;
  location_timestamp?: number | null;
  emergency_type?: string | null;
  emergency_details?: string | null;
  status: SOSStatus;
  responder_type?: SOSResponderType | null;
  created_at: string;
  updated_at: string;
  accepted_at?: string | null;
  resolved_at?: string | null;
}

export interface AdminResponderResponse {
  id: number;
  full_name: string;
  email: string;
  last_latitude?: number | null;
  last_longitude?: number | null;
  location_accuracy?: number | null;
  last_location_update?: string | null;
  is_online: boolean;
  active_sos_id?: number | null;
  active_sos_status?: SOSStatus | null;
}

export interface AdminUserResponse {
  id: number;
  full_name: string;
  email: string;
  role: string;
  last_latitude?: number | null;
  last_longitude?: number | null;
  location_accuracy?: number | null;
  last_location_update?: string | null;
  location_visibility: boolean;
  is_online: boolean;
  created_at?: string | null;
}

export interface AdminIncidentHistoryResponse {
  id: number;
  reporting_user_id: number;
  reporting_user_name?: string | null;
  assigned_responder_id?: number | null;
  assigned_responder_name?: string | null;
  latitude: number;
  longitude: number;
  location_accuracy?: number | null;
  emergency_type?: string | null;
  emergency_details?: string | null;
  status: SOSStatus;
  responder_type?: SOSResponderType | null;
  created_at: string;
  updated_at: string;
  accepted_at?: string | null;
  resolved_at?: string | null;
}

export interface AdminZoneStatsResponse {
  total_people_detected: number;
  people_requiring_help: number;
  active_sos: number;
  people_helped: number;
  people_marked_safe: number;
  responders_active: number;
}
