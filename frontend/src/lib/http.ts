import axios from 'axios';

// Normalize base URL: ensure it contains the '/api' prefix used by the backend
// Use environment variable or default to localhost
let envBaseRaw = import.meta.env.VITE_API_URL || 'http://localhost:5000';
let envBase = String(envBaseRaw).trim();
// Strip surrounding quotes and any trailing semicolon
envBase = envBase.replace(/^['"]+/, '').replace(/['";]+$/, '');
const normalizedBase = envBase.endsWith('/api') ? envBase : envBase.replace(/\/$/, '') + '/api';

const api = axios.create({
  // Now guaranteed to point at backend API root, e.g. http://localhost:5000/api
  baseURL: normalizedBase,
  withCredentials: true,
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('authToken', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('authToken');
  }
}

export { api };
// export default api;