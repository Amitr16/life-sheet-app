import React, { createContext, useContext, useState, useEffect } from 'react';
import ApiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {
    // Only check auth status if a token exists in localStorage or cookies
    const hasToken = Boolean(localStorage.getItem('authToken'));
    if (hasToken) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getProfile();
      setUser(response.user);
    } catch (error) {
      // User is not logged in
      setUser(null);
      // Only set error if it's not a 401 (unauthorized)
      if (error.message && !error.message.toLowerCase().includes('not authenticated')) {
        setError(error.message);
      } else {
        setError(null); // Don't show error for expected unauthenticated state
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      const response = await ApiService.login(credentials);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      const response = await ApiService.register(userData);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await ApiService.logout();
      setUser(null);
    } catch (error) {
      setError(error.message);
      // Even if logout fails on server, clear local state
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await ApiService.updateProfile(profileData);
      setUser(response.user);
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    setUser,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    isAuthenticated: !!user,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

