import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<any>;
  verifyOtp: (payload: { tempToken: string; otp: string }) => Promise<any>;
  demoLogin: (role: string, institutionCode?: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('dt_token');
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (e) {
          localStorage.removeItem('dt_token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    return api.login(credentials);
  };

  const verifyOtp = async (payload: { tempToken: string; otp: string }) => {
    const res = await api.verifyOtp(payload);
    if (res.success && res.accessToken) {
      localStorage.setItem('dt_token', res.accessToken);
      setUser(res.user);
    }
    return res;
  };

  const demoLogin = async (role: string, institutionCode?: string) => {
    const res = await api.demoLogin(role, institutionCode);
    if (res.success && res.accessToken) {
      localStorage.setItem('dt_token', res.accessToken);
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore
    }
    localStorage.removeItem('dt_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyOtp, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
