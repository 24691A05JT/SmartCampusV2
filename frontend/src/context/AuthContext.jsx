import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Auth state from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('smartcampus_token');
      const storedUser = localStorage.getItem('smartcampus_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error hydrating auth state:', err);
      localStorage.removeItem('smartcampus_token');
      localStorage.removeItem('smartcampus_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen to external logout event (e.g. from 401 axios interceptor)
  useEffect(() => {
    const handleForcedLogout = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('smartcampus_auth_logout', handleForcedLogout);
    return () => window.removeEventListener('smartcampus_auth_logout', handleForcedLogout);
  }, []);

  // Save session helper
  const setSession = useCallback((authToken, authUser) => {
    setToken(authToken);
    setUser(authUser);
    if (authToken && authUser) {
      localStorage.setItem('smartcampus_token', authToken);
      localStorage.setItem('smartcampus_user', JSON.stringify(authUser));
    } else {
      localStorage.removeItem('smartcampus_token');
      localStorage.removeItem('smartcampus_user');
    }
  }, []);

  // Login handler
  const login = useCallback(async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { token: receivedToken, user: receivedUser } = response.data;
      setSession(receivedToken, receivedUser);
      return response;
    } catch (error) {
      throw error;
    }
  }, [setSession]);

  // Register handler
  const register = useCallback(async (formData) => {
    try {
      const response = await apiClient.post('/auth/register', formData);
      const { token: receivedToken, user: receivedUser } = response.data;
      if (receivedToken && receivedUser) {
        setSession(receivedToken, receivedUser);
      }
      return response;
    } catch (error) {
      throw error;
    }
  }, [setSession]);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout').catch(() => {});
    } finally {
      setSession(null, null);
    }
  }, [setSession]);

  // Update profile in state and storage
  const updateUser = useCallback((updatedUser) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedUser };
      localStorage.setItem('smartcampus_user', JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    role: user?.role || null,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    setSession // Exposed for direct testing / mock testing
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
