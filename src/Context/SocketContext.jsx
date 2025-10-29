// SocketContext.jsx - Fixed with better timing handling
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within a SocketProvider");
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Debug effect
  useEffect(() => {
    console.log("🔌 SocketContext State:", {
      user: user ? `✅ ${user.email}` : '❌ null',
      token: token ? `✅ ${token.substring(0, 10)}...` : '❌ null',
      isAuthenticated,
      authLoading,
      socket: socket ? `✅ ${socket.id}` : '❌ null',
      isConnected,
      isInitialized
    });
  }, [user, token, isAuthenticated, authLoading, socket, isConnected, isInitialized]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      console.log("⏳ Auth still loading, waiting...");
      return;
    }

    // Only create socket if we have both user and token
    if (!isAuthenticated || !user || !token) {
      console.log("🚫 Not authenticated or missing user/token, skipping socket creation", {
        isAuthenticated,
        userExists: !!user,
        tokenExists: !!token
      });
      
      // Clean up existing socket if any
      if (socket) {
        console.log("🧹 Cleaning up existing socket due to missing auth");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // If socket already exists and is connected, don't create a new one
    if (socket && socket.connected) {
      console.log("🔌 Socket already exists and connected, reusing");
      return;
    }

    console.log("🚀 Creating new socket connection for:", user.email);

    const socketUrl = process.env.NODE_ENV === "production"
      ? "https://your-production-domain.com"
      : "http://localhost:5001";

    const newSocket = io(socketUrl, {
      auth: { token: token.trim() },
      transports: ["websocket", "polling"],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    // Connection successful
    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      setIsInitialized(true);
    });

    // Disconnected
    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setIsConnected(false);
    });

    // Connection error
    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection failed:", error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Reconnected
    newSocket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setConnectionError(null);
    });

    setSocket(newSocket);
    setIsInitialized(true);

    // Cleanup
    return () => {
      console.log("🧹 Socket cleanup");
      if (newSocket && newSocket.connected) {
        newSocket.disconnect();
      }
    };
  }, [isAuthenticated, authLoading, user?.id, token]); // Depend on isAuthenticated and authLoading

  const value = {
    socket,
    isConnected,
    connectionError,
    isSocketReady: () => socket && socket.connected && isAuthenticated
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};