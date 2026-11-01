import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Request Interceptor: Attach JWT Bearer token
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('smartcampus_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Unable to access localStorage for auth token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unified error handling and session expiration handling
apiClient.interceptors.response.use(
  (response) => response.data, // Unwrap response body automatically
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Handle Token Expiry or Unauthorized Access
      if (status === 401) {
        try {
          localStorage.removeItem('smartcampus_token');
          localStorage.removeItem('smartcampus_user');
          window.dispatchEvent(new Event('smartcampus_auth_logout'));
        } catch (e) {
          console.warn('Error clearing auth tokens:', e);
        }
      }

      const formattedError = new Error(
        data?.message || (status === 403 ? 'Access forbidden: Insufficient permissions' : 'Request failed')
      );
      formattedError.status = status;
      formattedError.errors = data?.errors || null;
      formattedError.data = data;
      return Promise.reject(formattedError);
    }

    if (error.request) {
      const networkError = new Error('Network error: Unable to reach Smart Campus server. Please check your connection.');
      networkError.status = 0;
      return Promise.reject(networkError);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
