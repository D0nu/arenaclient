// AuthContext.jsx - Add detailed debugging
import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

axios.defaults.withCredentials = true;
axios.defaults.baseURL = "http://localhost:5001/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Debug effect
  useEffect(() => {
    console.log("🔍 AuthContext State Update:", {
      user: user ? `✅ ${user.email}` : '❌ null',
      token: token ? `✅ ${token.substring(0, 10)}...` : '❌ null',
      isAuthenticated: !!user && !!token,
      loading
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

  const fetchUser = async () => {
    try {
      console.log("🔄 Starting fetchUser...");
      
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
      setUser(null);
      setToken(null);
      clearStoredToken();
    } finally {
      setLoading(false);
      console.log("🏁 fetchUser completed, loading:", false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email, password) => {
    console.log("🔐 Starting login...");
    const { data } = await axios.post("/auth/login", { email, password });
    setUser(data.user);
    setToken(data.token);
    
    if (data.token) {
      storeToken(data.token);
    }
    
    console.log("✅ Login completed");
    return data;
  };

  const signup = async (userData) => {
    console.log("👤 Starting signup...");
    const { data } = await axios.post("/auth/signup", userData);
    setUser(data.user);
    setToken(data.token);
    
    if (data.token) {
      storeToken(data.token);
    }
    
    console.log("✅ Signup completed");
    return data;
  };

  const logout = async () => {
    try {
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

  const updateUserBalance = (newBalance) => {
    if (user) {
      setUser(prev => ({ ...prev, coinBalance: newBalance }));
    }
  };

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
        refreshUser: fetchUser,
        updateUserBalance,
        updateUserData,
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