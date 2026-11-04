import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('dhruva_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('dhruva_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('dhruva_token');
      if (savedToken) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
          localStorage.setItem('dhruva_user', JSON.stringify(res.data));
        } catch (err) {
          console.warn('Existing session invalid or expired:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('dhruva:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('dhruva:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authAPI.login({ email, password });
      const { access_token, user: userData } = res.data;
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('dhruva_token', access_token);
      localStorage.setItem('dhruva_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Invalid email or password.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (fullName, email, password) => {
    setError(null);
    try {
      const res = await authAPI.register({
        full_name: fullName,
        email,
        password,
      });
      const { access_token, user: userData } = res.data;
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('dhruva_token', access_token);
      localStorage.setItem('dhruva_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Registration failed. Please check your details.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('dhruva_token');
    localStorage.removeItem('dhruva_user');
  };

  const updatePreferences = async (newPrefs) => {
    try {
      const res = await authAPI.updatePreferences(newPrefs);
      setUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, preferences: res.data };
        localStorage.setItem('dhruva_user', JSON.stringify(updated));
        return updated;
      });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to update preferences.';
      return { success: false, error: message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        error,
        login,
        register,
        logout,
        updatePreferences,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
