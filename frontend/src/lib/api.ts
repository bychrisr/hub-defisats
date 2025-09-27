import axios from 'axios';

// ✅ PROXY: Usar proxy do Vite para /api
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    console.log('🔍 AXIOS REQUEST INTERCEPTOR - Request being sent');
    console.log('📊 Request details:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: config.headers,
      data: config.data,
      timestamp: new Date().toISOString()
    });
    
    const token = localStorage.getItem('access_token');
    console.log('🔑 Token from localStorage:', token ? 'EXISTS' : 'MISSING');
    console.log('🔑 Token value:', token ? '[REDACTED]' : 'null');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Authorization header set:', '[REDACTED]');
      console.log('🔑 Final headers:', { ...config.headers, Authorization: '[REDACTED]' });
    } else {
      console.log('❌ No token found in localStorage');
    }
    return config;
  },
  error => {
    console.log('❌ AXIOS REQUEST INTERCEPTOR - Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  response => {
    console.log('✅ AXIOS RESPONSE INTERCEPTOR - Response received');
    console.log('📊 Response details:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    return response;
  },
  async error => {
    console.log('❌ AXIOS ERROR INTERCEPTOR - Error received');
    console.log('📊 Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message,
      timestamp: new Date().toISOString()
    });
    
    const originalRequest = error.config;

    // Evitar loop infinito - não tentar refresh se já tentou ou se é o próprio endpoint de refresh
    // Não redirecionar automaticamente para endpoints de login/register
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/refresh') &&
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/register')) {
      
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          console.log('🔄 AXIOS - Attempting token refresh...');
          const response = await axios.post(
            `${API_BASE_URL}/api/auth/refresh`,
            {
              refresh_token: refreshToken,
            }
          );

          const { token } = response.data;
          localStorage.setItem('access_token', token);
          console.log('✅ AXIOS - Token refreshed successfully');

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } else {
          console.log('❌ AXIOS - No refresh token available, redirecting to login');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } catch (refreshError) {
        console.log('❌ AXIOS - Token refresh failed, redirecting to login:', refreshError);
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    } else if (error.response?.status === 401 && originalRequest.url?.includes('/auth/refresh')) {
      // Se o próprio endpoint de refresh retornou 401, limpar tokens e redirecionar
      console.log('❌ AXIOS - Refresh token is invalid, redirecting to login');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
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

  toggle: (id: string) => api.patch(`/api/automations/${id}/toggle`, {}),

  getStats: () => api.get('/api/automations/stats'),
};

// LN Markets API
export const lnmarketsAPI = {
  getPositions: () => api.get('/api/lnmarkets-robust/dashboard'),
  getMarketData: (market: string) => api.get('/api/lnmarkets-robust/dashboard'),
  getLatestPrices: (symbols?: string) => api.get(`/api/market/prices/latest${symbols ? `?symbols=${symbols}` : ''}`),
};

export default api;
