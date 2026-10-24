'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; address: string }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      setUser(res.data?.user || null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    api
      .get<{ user: User }>('/auth/me')
      .then((res) => {
        if (isMounted) {
          setUser(res.data?.user || null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ user: User; token?: string }>('/auth/login', { email, password });
    if (res.data?.token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', res.data.token);
    }
    if (res.data?.user) {
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error('User profile data not returned by authentication service.');
  };

  const register = async (data: { name: string; email: string; password: string; address: string }): Promise<User> => {
    const res = await api.post<{ user: User; token?: string }>('/auth/register', data);
    if (res.data?.token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', res.data.token);
    }
    if (res.data?.user) {
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error('User profile data not returned by registration service.');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
