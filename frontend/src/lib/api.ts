import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: {
    email: string;
    username: string;
    password: string;
    ln_markets_api_key: string;
    ln_markets_api_secret: string;
    ln_markets_passphrase: string;
    coupon_code?: string;
  }) => api.post('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),

  refresh: (data: { refresh_token: string }) =>
    api.post('/api/auth/refresh', data),

  logout: () => api.post('/api/auth/logout'),

  getProfile: () => api.get('/api/auth/me'),
};

// Automation API
export const automationAPI = {
  create: (data: { type: string; config: any }) =>
    api.post('/api/automations', data),

  getAll: (params?: { type?: string; is_active?: boolean }) =>
    api.get('/api/automations', { params }),

  getById: (id: string) => api.get(`/api/automations/${id}`),

  update: (id: string, data: { config?: any; is_active?: boolean }) =>
    api.put(`/api/automations/${id}`, data),

  delete: (id: string) => api.delete(`/api/automations/${id}`),

  toggle: (id: string) => api.patch(`/api/automations/${id}/toggle`),

  getStats: () => api.get('/api/automations/stats'),
};

export default api;
