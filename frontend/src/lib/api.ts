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
    console.log('🔑 Token preview:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Authorization header set:', '[REDACTED]');
      console.log('🔑 Final headers:', { ...config.headers, Authorization: '[REDACTED]' });
    } else {
      console.log('❌ No token found in localStorage');
    }
    
    // Special logging for coupon requests
    if (config.url?.includes('/admin/coupons')) {
      console.log('🎫 COUPON REQUEST - Special logging for coupon endpoint');
      console.log('🎫 COUPON REQUEST - Method:', config.method);
      console.log('🎫 COUPON REQUEST - URL:', config.url);
      console.log('🎫 COUPON REQUEST - Data:', config.data);
      console.log('🎫 COUPON REQUEST - Headers:', config.headers);
    }
    
    return config;
  },
  error => {
    console.log('❌ AXIOS REQUEST INTERCEPTOR - Error:', error);
    console.log('❌ AXIOS REQUEST INTERCEPTOR - Error type:', typeof error);
    console.log('❌ AXIOS REQUEST INTERCEPTOR - Error message:', error.message);
    console.log('❌ AXIOS REQUEST INTERCEPTOR - Error stack:', error.stack);
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
      headers: response.headers,
      timestamp: new Date().toISOString()
    });
    
    // Special logging for login responses
    if (response.config.url?.includes('/auth/login')) {
      console.log('🔑 LOGIN RESPONSE - Special logging for login endpoint');
      console.log('🔑 LOGIN RESPONSE - Status:', response.status);
      console.log('🔑 LOGIN RESPONSE - Data:', response.data);
      console.log('🔑 LOGIN RESPONSE - Headers:', response.headers);
    }
    
    // Special logging for coupon responses
    if (response.config.url?.includes('/admin/coupons')) {
      console.log('🎫 COUPON RESPONSE - Special logging for coupon endpoint');
      console.log('🎫 COUPON RESPONSE - Status:', response.status);
      console.log('🎫 COUPON RESPONSE - Data:', response.data);
      console.log('🎫 COUPON RESPONSE - Headers:', response.headers);
    }
    
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
    
    // Special logging for login errors
    if (error.config?.url?.includes('/auth/login')) {
      console.log('🔑 LOGIN ERROR - Special logging for login endpoint');
      console.log('🔑 LOGIN ERROR - Status:', error.response?.status);
      console.log('🔑 LOGIN ERROR - Data:', error.response?.data);
      console.log('🔑 LOGIN ERROR - Headers:', error.response?.headers);
      console.log('🔑 LOGIN ERROR - Message:', error.message);
    }
    
    // Special logging for coupon errors
    if (error.config?.url?.includes('/admin/coupons')) {
      console.log('🎫 COUPON ERROR - Special logging for coupon endpoint');
      console.log('🎫 COUPON ERROR - Status:', error.response?.status);
      console.log('🎫 COUPON ERROR - Data:', error.response?.data);
      console.log('🎫 COUPON ERROR - Headers:', error.response?.headers);
      console.log('🎫 COUPON ERROR - Request config:', error.config);
    }
    
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

  login: (data: { emailOrUsername: string; password: string }) => {
    console.log('🔄 AUTH API - login function called');
    
    // Use the working configuration from our Node.js test
    const config = {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    };
    
    // Return the working axios call
    return api.post('/api/auth/login', data, config);
  },

  refresh: (data: { refresh_token: string }) =>
    api.post('/api/auth/refresh', data),

  logout: () => api.post('/api/auth/logout'),

  getProfile: () => api.get('/api/auth/me'),
};

// Registration API for phased registration
export const registrationAPI = {
  // Step 1: Save personal data
  savePersonalData: (data: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    couponCode?: string;
    emailMarketingConsent?: boolean;
    termsConsent?: boolean;
  }) => api.post('/api/registration/personal-data', data),

  // Step 2: Select plan
  selectPlan: (data: {
    planId: 'free' | 'basic' | 'advanced' | 'pro' | 'lifetime';
    billingPeriod: 'monthly' | 'quarterly' | 'yearly';
    sessionToken?: string;
    fingerprint?: string;
  }) => api.post('/api/registration/select-plan', data),

  // Validate verification code
  validateVerificationCode: (data: {
    sessionToken: string;
    code: string;
    fingerprint?: string;
  }) => api.post('/api/registration/validate-code', data),

  // Resend verification code
  resendVerificationCode: (data: {
    sessionToken: string;
  }) => api.post('/api/registration/resend-code', data),

  // Step 3: Process payment
  processPayment: (data: {
    paymentMethod: 'lightning' | 'lnmarkets';
    lightningAddress?: string;
    sessionToken?: string;
  }) => api.post('/api/registration/payment', data),

  // Step 4: Save credentials
  saveCredentials: (data: {
    lnMarketsApiKey: string;
    lnMarketsApiSecret: string;
    lnMarketsPassphrase: string;
    sessionToken?: string;
  }) => api.post('/api/registration/credentials', data),

  // Get registration progress
  getProgress: (sessionToken?: string) => 
    api.get('/api/registration/progress', {
      params: { sessionToken }
    }),
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
