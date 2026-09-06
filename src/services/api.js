import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${backendUrl}`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error unwrapping
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If offline or network error, mark flag on error
    if (!navigator.onLine || error.code === 'ERR_NETWORK') {
      error.isOffline = true;
    }
    return Promise.reject(error);
  }
);

export default api;
