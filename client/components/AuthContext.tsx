'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'restaurant' | 'admin';
  is_blocked: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string, role: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('quickbite_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await api.get('/auth/profile');
          setUser(response.data.user);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Token might be invalid/expired, clear it
          localStorage.removeItem('quickbite_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;
      
      localStorage.setItem('quickbite_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);

      // Redirect depending on user role
      if (receivedUser.role === 'admin') {
        router.push('/admin');
      } else if (receivedUser.role === 'restaurant') {
        router.push('/restaurant-dashboard');
      } else {
        router.push('/');
      }

      return { success: true, message: 'Welcome back!' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check credentials.'
      };
    }
  };

  const register = async (name: string, email: string, password: string, role: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      const { token: receivedToken, user: receivedUser } = response.data;

      localStorage.setItem('quickbite_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);

      if (receivedUser.role === 'restaurant') {
        router.push('/restaurant-dashboard');
      } else {
        router.push('/');
      }

      return { success: true, message: 'Account created successfully!' };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('quickbite_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error refreshing profile:', error);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
