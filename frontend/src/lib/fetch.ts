/**
 * Utility function for making API requests with proper URL handling
 */

const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:13010';
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const apiUrl = getApiUrl();
  const url = endpoint.startsWith('/') ? `${apiUrl}${endpoint}` : `${apiUrl}/${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response;
};

export const apiGet = (endpoint: string, options: RequestInit = {}) => 
  apiFetch(endpoint, { ...options, method: 'GET' });

export const apiPost = (endpoint: string, data?: any, options: RequestInit = {}) => 
  apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = (endpoint: string, data?: any, options: RequestInit = {}) => 
  apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiDelete = (endpoint: string, options: RequestInit = {}) => 
  apiFetch(endpoint, { ...options, method: 'DELETE' });
