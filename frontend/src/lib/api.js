import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor (optional, e.g., for auth tokens)
api.interceptors.request.use(
  (config) => {
    // You can add logic here to attach tokens if needed
    const userStr = localStorage.getItem('mentoring_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Optional: Auto-logout on invalid token
      // localStorage.removeItem('mentoring_user');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
