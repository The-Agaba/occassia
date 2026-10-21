import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api';
import axios from 'axios';

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { refreshToken, setAuth, logout, token } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!token && refreshToken) {
          const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
          setAuth(res.data.token, res.data.refreshToken, res.data.user);
        } else if (token) {
          await authApi.me();
        }
      } catch (error: any) {
        // Only log out if the backend explicitly rejected credentials (401 / 403)
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          logout();
        }
      }
    };
    
    initAuth();
  }, []);

  return <>{children}</>;
}
