import axios from 'axios';
import {
  CACHE_TTL,
  cachedRequest,
  invalidateApiCache,
  nearbyCacheKey,
  type CachedRequestOptions,
} from './apiCache';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { full_name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/users/me'),
};

export const shelterApi = {
  // Cached: static reference data, requested by Map, Dashboard and Admin.
  // Mutations below invalidate it so the UI never shows a stale list.
  getAll: (options?: CachedRequestOptions) =>
    cachedRequest('shelters:all', CACHE_TTL.reference, () => api.get('/shelters'), options),
  create: (data: any) =>
    api.post('/shelters', data).then((res) => {
      invalidateApiCache('shelters:');
      return res;
    }),
  update: (id: number, data: any) =>
    api.put(`/shelters/${id}`, data).then((res) => {
      invalidateApiCache('shelters:');
      return res;
    }),
  delete: (id: number) =>
    api.delete(`/shelters/${id}`).then((res) => {
      invalidateApiCache('shelters:');
      return res;
    }),
};

export const hospitalApi = {
  getAll: (options?: CachedRequestOptions) =>
    cachedRequest('hospitals:all', CACHE_TTL.reference, () => api.get('/hospitals'), options),
  create: (data: any) =>
    api.post('/hospitals', data).then((res) => {
      invalidateApiCache('hospitals:');
      return res;
    }),
};

export const disasterApi = {
  // Not cached: status/severity changes drive map + risk rendering.
  getAll: () => api.get('/disasters'),
  getActive: () => api.get('/disasters/active'),
  create: (data: any) => api.post('/disasters', data),
};

export const alertApi = {
  // Not cached: alerts expire and change severity, so staleness is user-visible
  // and would risk showing inactive/expired entries.
  getAll: (params?: { lat?: number; lng?: number; all?: boolean }) =>
    api.get('/alerts', { params }),
  create: (data: any) => api.post('/alerts', data),
};

export const settingsApi = {
  // Not cached: must reflect the signed-in user and updates applied via update().
  get: () => api.get('/users/settings'),
  update: (data: Record<string, unknown>) => api.put('/users/settings', data),
};

export const routeApi = {
  getAll: () => api.get('/routes'),
  create: (data: any) => api.post('/routes', data),
};

export const weatherApi = {
  // Not cached: useWeather already re-polls on its own 5-minute interval.
  get: (lat: number, lng: number) =>
    api.get('/weather', { params: { lat, lng } }),
};

const DEFAULT_RADIUS = 10_000;

export const locationApi = {
  /**
   * Nearby OSM infrastructure (hospitals, shelters, community centres, schools,
   * police, fire stations, pharmacies).
   *
   * Backed by a single Overpass fan-out on the server, so this is the most
   * expensive read in the app and the one repeated by Shelters, Hospitals,
   * Dashboard and Map. Results are shared in-memory for CACHE_TTL.nearby and
   * concurrent identical calls collapse into one HTTP request.
   *
   * The 4th argument is optional; existing `locationApi.nearby(lat, lng, radius)`
   * call sites keep working and gain caching automatically.
   */
  nearby: (lat: number, lng: number, radius?: number, options?: CachedRequestOptions) => {
    const effectiveRadius = radius ?? DEFAULT_RADIUS;
    return cachedRequest(
      nearbyCacheKey(lat, lng, effectiveRadius),
      CACHE_TTL.nearby,
      () => api.get('/location/nearby', { params: { lat, lng, radius: effectiveRadius } }),
      options
    );
  },
  // Not cached: scored per request and currently unused by the UI.
  safeDestination: (lat: number, lng: number, radius?: number) =>
    api.get('/location/safe-destination', { params: { lat, lng, radius: radius ?? DEFAULT_RADIUS } }),
};

export const userApi = {
  updateLocation: (data: { latitude: number; longitude: number; accuracy?: number; timestamp?: number }) =>
    api.post('/users/location', data),
  // Never cached: live presence for disaster coordination, polled every 30s.
  getNearbyUsers: (lat: number, lng: number, radiusKm?: number) =>
    api.get('/users/nearby', { params: { lat, lng, radius_km: radiusKm ?? 10 } }),
};

export const sosApi = {
  create: (data: any) => api.post('/sos', data),
  getActive: () => api.get('/sos/active'),
  getNearby: (lat: number, lng: number, radiusKm?: number) =>
    api.get('/sos/nearby', { params: { lat, lng, radius_km: radiusKm ?? 10 } }),
  getById: (id: number) => api.get(`/sos/${id}`),
  cancel: (id: number) => api.post(`/sos/${id}/cancel`),
  accept: (id: number) => api.post(`/sos/${id}/accept`),
  updateStatus: (id: number, data: any) => api.post(`/sos/${id}/status`, data),
  confirmSafe: (id: number) => api.post(`/sos/${id}/confirm-safe`),
  getHistory: (params?: { limit?: number; offset?: number }) =>
    api.get('/sos/my/history', { params }),
  // Admin
  adminGetActive: () => api.get('/sos/admin/active'),
  adminGetHistory: (params?: { limit?: number; offset?: number }) =>
    api.get('/sos/admin/history', { params }),
  adminAssignResponder: (id: number, responderId?: number) =>
    api.post(`/sos/admin/${id}/responder`, null, { params: { responder_id: responderId } }),
};

export const aiApi = {
  recommend: (data: { question: string; lat?: number; lng?: number }) =>
    api.post('/ai/recommendation', data),
};

export const riskApi = {
  get: (lat: number, lng: number) =>
    api.get('/risk', { params: { lat, lng } }),
};

export const adminApi = {
  getOverview: () => api.get('/admin/overview'),
  getAlerts: (params?: { active_only?: boolean; limit?: number; offset?: number }) =>
    api.get('/admin/alerts', { params }),
  getSOS: (params?: { status_filter?: string; limit?: number; offset?: number }) =>
    api.get('/admin/sos', { params }),
  getResponders: (params?: { active_only?: boolean; limit?: number; offset?: number }) =>
    api.get('/admin/responders', { params }),
  getUsers: (params?: { limit?: number; offset?: number }) =>
    api.get('/admin/users', { params }),
  getIncidents: (params?: { status_filter?: string; date_from?: string; date_to?: string; limit?: number; offset?: number }) =>
    api.get('/admin/incidents', { params }),
  getZoneStats: (params?: { disaster_id?: number; alert_id?: number }) =>
    api.get('/admin/zone-stats', { params }),
  acknowledgeSOS: (sosId: number) => api.post(`/admin/sos/${sosId}/acknowledge`),
  assignResponder: (sosId: number, responderId: number) => api.post(`/admin/sos/${sosId}/assign`, null, { params: { responder_id: responderId } }),
  updateSOSStatus: (sosId: number, status: string) => api.post(`/admin/sos/${sosId}/status`, { status }),
};

export const routingApi = {
  ors: (start: [number, number], end: [number, number], apiKey: string) => {
    const body = {
      coordinates: [
        [start[1], start[0]],
        [end[1], end[0]],
      ],
      instructions: true,
      geometry: true,
      format: 'geojson',
    };
    return fetch('https://api.openrouteservice.org/v2/directions/foot-walking/geojson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: apiKey },
      body: JSON.stringify(body),
    }).then((r) => r.json());
  },
  osrm: (start: [number, number], end: [number, number]) => {
    const url = `https://router.project-osrm.org/route/v1/foot/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;
    return fetch(url).then((r) => r.json());
  },
};

export default api;
