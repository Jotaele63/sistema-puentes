import axios from 'axios';

const BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  changePassword: (passwordActual: string, passwordNueva: string) =>
    api.put('/auth/change-password', { passwordActual, passwordNueva }),
};

// Bridges
export const bridgesApi = {
  dashboard: () => api.get('/bridges/dashboard'),
  pendientes: () => api.get('/bridges/pendientes'),
  list: (params?: Record<string, unknown>) => api.get('/bridges', { params }),
  get: (id: string) => api.get(`/bridges/${id}`),
  create: (data: unknown) => api.post('/bridges', data),
  update: (id: string, data: unknown) => api.put(`/bridges/${id}`, data),
  submit: (id: string) => api.post(`/bridges/${id}/submit`),
  approve: (id: string, comentarios?: string) => api.post(`/bridges/${id}/approve`, { comentarios }),
  reject: (id: string, comentarios: string) => api.post(`/bridges/${id}/reject`, { comentarios }),
  renew: (id: string, comentarios?: string) => api.post(`/bridges/${id}/renew`, { comentarios }),
  close: (id: string, observaciones?: string) => api.post(`/bridges/${id}/close`, { observaciones }),
  activate: (id: string) => api.post(`/bridges/${id}/activate`),
  pdf: (id: string) => api.get(`/bridges/${id}/pdf`),
  addControl: (id: string, data: unknown) => api.post(`/bridges/${id}/control`, data),
};

// Users
export const usersApi = {
  list: () => api.get('/users'),
  create: (data: unknown) => api.post('/users', data),
  update: (id: string, data: unknown) => api.put(`/users/${id}`, data),
  deactivate: (id: string) => api.delete(`/users/${id}`),
};

// Reports
export const reportsApi = {
  monthly: (mes?: number, anio?: number) => api.get('/reports/monthly', { params: { mes, anio } }),
  quarterly: () => api.get('/reports/quarterly'),
  custom: (params: Record<string, unknown>) => api.get('/reports/custom', { params }),
  trends: () => api.get('/reports/trends'),
};

// Audits
export const auditsApi = {
  list: () => api.get('/audits'),
  create: (observaciones?: string) => api.post('/audits', { observaciones }),
};

// Notifications
export const notifsApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Logs
export const logsApi = {
  list: (params?: Record<string, unknown>) => api.get('/logs', { params }),
};

export default api;
