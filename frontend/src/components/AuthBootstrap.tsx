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
      } catch (error) {
        // Silently fail - let user see login page if auth fails
        if (refreshToken) {
          logout();
        }
      }
    };
    
    initAuth();
  }, []);

  return <>{children}</>;
}
