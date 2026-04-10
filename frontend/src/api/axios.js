import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || '/api';

// Ensure the URL always ends with /api/
const apiBase = (rawBaseURL.endsWith('/api') || rawBaseURL.endsWith('/api/')) 
  ? rawBaseURL 
  : rawBaseURL.replace(/\/$/, '') + '/api';

const api = axios.create({
  baseURL: apiBase.replace(/\/$/, '') + '/',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
