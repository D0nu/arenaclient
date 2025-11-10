// AuthContext.jsx - Updated with proper refreshUser
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
// REMOVE: import { useSocket } from "./SocketContext"; // No longer needed here

const AuthContext = createContext();

// ✅ Environment-aware base URL configuration
const getBaseURL = () => {
  const baseURL = import.meta.env.VITE_API_URL;
  console.log("🌍 Environment Configuration:", {
    VITE_API_URL: baseURL,
    NODE_ENV: import.meta.env.MODE,
    isProduction: import.meta.env.PROD,
    isDevelopment: import.meta.env.DEV
  });

  if (!baseURL) {
    console.warn("⚠️ VITE_API_URL not set, falling back to localhost");
    return "http://localhost:5001/api";
  }

  // Ensure baseURL includes /api if not already present
  if (baseURL.includes('/api')) {
    return baseURL;
  } else {
    return `${baseURL}/api`;
  }
};

// ✅ Set axios defaults with environment-aware URL
axios.defaults.withCredentials = true;
axios.defaults.baseURL = getBaseURL();

console.log("🚀 Axios configured with baseURL:", axios.defaults.baseURL);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  // REMOVE: const { socket } = useSocket(); // No socket dependency here

  // Debug effect
  useEffect(() => {
    console.log("🔍 AuthContext State Update:", {
      user: user ? `✅ ${user.email}` : '❌ null',
      token: token ? `✅ ${token.substring(0, 10)}...` : '❌ null',
      isAuthenticated: !!user && !!token,
      loading,
      baseURL: axios.defaults.baseURL
    });
  }, [user, token, loading]);

  const getStoredToken = () => {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      return null;
    }
  };

  const storeToken = (newToken) => {
    try {
      localStorage.setItem('authToken', newToken);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  };

  const clearStoredToken = () => {
    try {
      localStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error clearing token:', error);
    }
  };

  // ✅ PROPER refreshUser function using axios
  const refreshUser = useCallback(async () => {
    try {
      console.log('🔄 Refreshing user data...');
      const currentToken = token || getStoredToken();
      
      if (!currentToken) {
        console.warn('❌ No token available for refresh');
        return;
      }

      console.log('📡 Making request to:', `${axios.defaults.baseURL}/auth/me`);
      
      const { data } = await axios.get("/auth/me", {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      
      console.log('✅ User data refreshed:', data.user);
      
      // Update user state
      setUser(data.user);
      
      // Update token if a new one was provided
      if (data.token) {
        console.log('🔄 Updating token from refresh');
        setToken(data.token);
        storeToken(data.token);
      }
      
      return data.user;
    } catch (error) {
      console.error('❌ Failed to refresh user:', error);
      // If refresh fails, clear auth state
      if (error.response?.status === 401) {
        console.log('🚫 Unauthorized, clearing auth state');
        setUser(null);
        setToken(null);
        clearStoredToken();
      }
      throw error;
    }
  }, [token]);

  // ✅ Use useCallback to prevent infinite re-renders
  const fetchUser = useCallback(async () => {
    try {
      console.log("🔄 Starting fetchUser...");
      console.log("📡 API Base URL:", axios.defaults.baseURL);
      
      const storedToken = getStoredToken();
      console.log("📦 Stored token:", storedToken ? `Found (${storedToken.length} chars)` : 'Not found');

      const { data } = await axios.get("/auth/me");
      console.log("✅ User profile fetched:", data.user);

      setUser(data.user);
      
      // CRITICAL FIX: Handle token properly
      if (data.token) {
        console.log("🎯 Using token from backend response");
        setToken(data.token);
        storeToken(data.token);
      } else if (storedToken) {
        console.log("🔄 Using stored token since no token in response");
        setToken(storedToken);
      } else {
        console.warn("⚠️ No token available anywhere");
        setToken(null);
      }
      
    } catch (error) {
      console.warn("❌ Not authenticated:", error.response?.data?.message || error.message);
      console.error("📡 Request details:", {
        url: `${axios.defaults.baseURL}/auth/me`,
        method: 'GET',
        error: error.message
      });
      setUser(null);
      setToken(null);
      clearStoredToken();
    } finally {
      setLoading(false);
      console.log("🏁 fetchUser completed, loading:", false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // REMOVED: Socket listeners moved to separate hook

  const login = async (email, password) => {
    console.log("🔐 Starting login...");
    console.log("📡 API Base URL:", axios.defaults.baseURL);
    
    try {
      const { data } = await axios.post("/auth/login", { email, password });
      setUser(data.user);
      setToken(data.token);
      
      if (data.token) {
        storeToken(data.token);
      }
      
      console.log("✅ Login completed");
      return data;
    } catch (error) {
      console.error("❌ Login failed:", error.response?.data || error.message);
      throw error;
    }
  };

  const signup = async (userData) => {
    console.log("👤 Starting signup...");
    console.log("📡 API Base URL:", axios.defaults.baseURL);
    
    try {
      const { data } = await axios.post("/auth/signup", userData);
      setUser(data.user);
      setToken(data.token);
      
      if (data.token) {
        storeToken(data.token);
      }
      
      console.log("✅ Signup completed");
      return data;
    } catch (error) {
      console.error("❌ Signup failed:", error.response?.data || error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("📡 API Base URL for logout:", axios.defaults.baseURL);
      await axios.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setToken(null);
      clearStoredToken();
      console.log("✅ Logout completed");
    }
  };

      const updateUserBalance = useCallback((newBalance) => {
        setUser(prev => {
          if (!prev) return prev;
          console.log("🔄 UPDATING BALANCE IN CONTEXT:", { 
            from: prev.coinBalance, 
            to: newBalance 
          });
          return { 
            ...prev, 
            coinBalance: newBalance 
          };
        });
      }, []);

  const updateUserData = (newUserData) => {
    setUser(prev => ({ ...prev, ...newUserData }));
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        signup,
        logout,
        refreshUser, 
        updateUserBalance,
        updateUserData,
        
        baseURL: axios.defaults.baseURL
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};