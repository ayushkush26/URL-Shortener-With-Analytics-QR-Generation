import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

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
  const [token, setToken] = useState(localStorage.getItem('accessToken'));

  // Init Auth logic
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        setToken(storedToken);
        try {
          // Decode token to check expiry (basic check)
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          if (payload.exp * 1000 > Date.now()) {
            // First set basic info from token to avoid flicker
            setUser({
              id: payload.userId,
              email: payload.email || 'user@example.com',
            });

            // Verify with backend and get full profile
            try {
              const { default: apiInstance } = await import('../api/axios');
              const { data } = await apiInstance.get('/auth/profile');
              if (data && data.user) {
                setUser(data.user);
              }
            } catch (err) {
              console.error('Failed to fetch full profile:', err);
              // If api fails (e.g. 401), allow logout logic below if strict, 
              // but for now we keep the token-based user as fallback or logout if invalid.
              // If the token is invalid, the interceptor might have already handled it.
            }
          } else {
            localStorage.removeItem('accessToken');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('accessToken');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password, twoFACode) => {
    console.log("Login attempt...", { email, has2FA: !!twoFACode }); // DEBUG
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        twoFACode,
      });

      console.log("Login response:", response.data); // DEBUG

      if (response.data.requires2FA) {
        return { success: false, requires2FA: true, message: response.data.message };
      }

      const { accessToken, user: userData } = response.data;

      console.log("Setting user/token...", { accessToken: !!accessToken, user: userData }); // DEBUG
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('accessToken', accessToken);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error); // DEBUG
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const register = async (email, password, firstName, lastName) => {
    try {
      await api.post('/auth/register', {
        email,
        password,
        firstName,
        lastName,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('accessToken');
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    setUser, // Exposed for profile updates
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
