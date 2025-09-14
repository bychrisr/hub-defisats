import { api } from './api';

/**
 * Utility function for making API requests with proper URL handling
 * Using Axios to ensure proxy compatibility
 */

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Convert RequestInit to Axios config
  const axiosConfig = {
    method: options.method || 'GET',
    url,
    data: options.body,
    headers: {
      // Merge default headers with custom headers
      ...options.headers,
    },
  };

  const response = await api(axiosConfig);
  
  // Return a Response-like object for compatibility
  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText: response.statusText,
    json: async () => response.data,
    text: async () => JSON.stringify(response.data),
  };
};

export const apiGet = (endpoint: string, options: RequestInit = {}) => 
  apiFetch(endpoint, { ...options, method: 'GET' });

export const apiPost = (endpoint: string, data?: any, options: RequestInit = {}) => 
  apiFetch(endpoint, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = (endpoint: string, data?: any, options: RequestInit = {}) => 
  apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiDelete = (endpoint: string, options: RequestInit = {}) => 
  apiFetch(endpoint, { ...options, method: 'DELETE' });
