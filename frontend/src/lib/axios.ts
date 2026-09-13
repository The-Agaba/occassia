import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { apiErrorMessage } from './errorMessages';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  // Let normal page reads survive a cold free-tier wake-up while keeping
  // login's explicit five-minute timeout independent below.
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const message = apiErrorMessage(error, 'The request could not be completed.');
    console.error('[API]', { method: error.config?.method?.toUpperCase(), url: error.config?.url, status: error.response?.status ?? 'NETWORK_ERROR', message, details: error.response?.data || error.message });
    if (error.response) {
      error.response.data = { ...(typeof error.response.data === 'object' ? error.response.data : {}), message: error.response.data?.message || message };
    } else {
      error.response = { data: { message } } as any;
    }
    error.userMessage = message;
    const original = error.config;
    const method = original?.method?.toUpperCase();
    const retryable = !original?._retryNetwork && ['GET', 'HEAD'].includes(method || '') && (!error.response || error.response.status >= 500);
    if (retryable) {
      original._retryNetwork = true;
      await new Promise((resolve) => setTimeout(resolve, 700));
      return api(original);
    }
    const isLoginRequest = original?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !original._retry && !isLoginRequest) {
      original._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          useAuthStore.getState().setAuth(data.token, data.refreshToken, data.user);
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original);
        } catch {
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
