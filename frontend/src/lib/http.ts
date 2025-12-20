import axios from 'axios';

let envBaseRaw = import.meta.env.VITE_API_URL || 'http://localhost:5000';
let envBase = String(envBaseRaw).trim();
envBase = envBase.replace(/^['"]+/, '').replace(/['";]+$/, '');
const normalizedBase = envBase.endsWith('/api')
  ? envBase
  : envBase.replace(/\/$/, '') + '/api';

export const api = axios.create({
  baseURL: normalizedBase,
  withCredentials: true,
});

/**
 * Set or clear auth token
 */
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem('authToken', token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem('authToken');
  }
}

/**
 * 🔥 IMPORTANT: restore token on app reload
 */
const savedToken = localStorage.getItem('authToken');
if (savedToken) {
  api.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
}
