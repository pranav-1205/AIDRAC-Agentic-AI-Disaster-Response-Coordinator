import axios from 'axios';

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
  getAll: () => api.get('/shelters'),
  create: (data: any) => api.post('/shelters', data),
  update: (id: number, data: any) => api.put(`/shelters/${id}`, data),
  delete: (id: number) => api.delete(`/shelters/${id}`),
};

export const hospitalApi = {
  getAll: () => api.get('/hospitals'),
  create: (data: any) => api.post('/hospitals', data),
};

export const disasterApi = {
  getAll: () => api.get('/disasters'),
  getActive: () => api.get('/disasters/active'),
  create: (data: any) => api.post('/disasters', data),
};

export const alertApi = {
  getAll: () => api.get('/alerts'),
  create: (data: any) => api.post('/alerts', data),
};

export const routeApi = {
  getAll: () => api.get('/routes'),
  create: (data: any) => api.post('/routes', data),
};

export const weatherApi = {
  get: (lat?: number, lng?: number) =>
    api.get('/weather', { params: { lat, lng } }),
};

export default api;
