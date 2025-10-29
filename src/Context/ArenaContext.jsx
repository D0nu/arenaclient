import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { ArenaGameService } from  "../services/arenaGameService"
const ArenaContext = createContext();

export function ArenaProvider({ children }) {
  const { user, token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const arenaServiceRef = useRef(null);

  // Initialize Arena Game Service
  useEffect(() => {
    if (!arenaServiceRef.current) {
      arenaServiceRef.current = new ArenaGameService();
    }
  }, []);

  // Connect to Arena Arcade when user is authenticated
  useEffect(() => {
    if (!user || !token) {
      disconnectArena();
      return;
    }

    // Set up event listeners
    setupEventListeners();

    return () => {
      cleanupEventListeners();
    };
  }, [user, token]);

  const setupEventListeners = () => {
    const service = arenaServiceRef.current;
    if (!service) return;

    // Arena Events
    service.on('arena_countdown_started', (data) => {
      console.log("⏰ Arena countdown started:", data);
      setGameState(prev => ({ ...prev, ...data }));
      addEvent('arena_countdown_started', data);
    });

    service.on('countdown_update', (data) => {
      console.log("⏱️ Countdown update:", data);
      addEvent('countdown_update', data);
    });

    service.on('arena_begins', (data) => {
      console.log("🎮 Arena begins:", data);
      setGameState(prev => ({ ...prev, ...data, arenaActive: true }));
      addEvent('arena_begins', data);
    });

    // Boost Events
    service.on('player_boost_activated', (data) => {
      console.log("🚀 Player boost activated:", data);
      addEvent('player_boost_activated', data);
    });

    service.on('boost_cycle_update', (data) => {
      console.log("🔄 Boost cycle update:", data);
      addEvent('boost_cycle_update', data);
    });

    service.on('boost_cycle_complete', (data) => {
      console.log("✅ Boost cycle complete:", data);
      addEvent('boost_cycle_complete', data);
    });

    // Package Events
    service.on('package_drop', (data) => {
      console.log("🎁 Package dropped:", data);
      setPackages(prev => [...prev, data]);
      addEvent('package_drop', data);
    });

    service.on('immediate_item_drop', (data) => {
      console.log("📦 Immediate item drop:", data);
      addEvent('immediate_item_drop', data);
    });

    // Game Events
    service.on('event_triggered', (data) => {
      console.log("🎯 Game event triggered:", data);
      addEvent('event_triggered', data);
    });

    service.on('player_joined', (data) => {
      console.log("👤 Player joined:", data);
      addEvent('player_joined', data);
    });

    service.on('game_completed', (data) => {
      console.log("🏆 Game completed:", data);
      setGameState(prev => ({ ...prev, ...data, status: 'completed' }));
      addEvent('game_completed', data);
    });

    service.on('game_stopped', (data) => {
      console.log("🛑 Game stopped:", data);
      setGameState(prev => ({ ...prev, ...data, status: 'stopped' }));
      addEvent('game_stopped', data);
    });

    // Connection status
    setConnected(service.getConnectionStatus());
  };

  const cleanupEventListeners = () => {
    const service = arenaServiceRef.current;
    if (!service) return;

    // Remove all event listeners
    const events = [
      'arena_countdown_started',
      'countdown_update',
      'arena_begins',
      'player_boost_activated',
      'boost_cycle_update',
      'boost_cycle_complete',
      'package_drop',
      'immediate_item_drop',
      'event_triggered',
      'player_joined',
      'game_completed',
      'game_stopped'
    ];

    events.forEach(event => {
      service.off(event);
    });
  };

  const addEvent = (type, data) => {
    const event = {
      type,
      data,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    };
    
    setEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events
  };

  // Initialize game with stream URL
  const initializeGame = async (streamUrl) => {
    if (!user || !token) {
      throw new Error("User must be authenticated to initialize game");
    }

    setLoading(true);
    try {
      const result = await arenaServiceRef.current.initializeGame(streamUrl, token);
      
      if (result.success) {
        setGameState(result.data);
        setConnected(true);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to initialize game:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Boost a player
  const boostPlayer = async (playerId, amount, username) => {
    if (!gameState || !arenaServiceRef.current) {
      throw new Error("Game not initialized");
    }

    try {
      const result = await arenaServiceRef.current.boostPlayer(
        gameState.gameId,
        playerId,
        amount,
        username
      );
      
      return result;
    } catch (error) {
      console.error("Boost player failed:", error);
      throw error;
    }
  };

  // Get game details
  const getGameDetails = async (gameId) => {
    try {
      const result = await arenaServiceRef.current.getGameDetails(gameId);
      return result;
    } catch (error) {
      console.error("Get game details failed:", error);
      throw error;
    }
  };

  // Drop immediate item
  const dropImmediateItem = async (itemId, targetPlayer) => {
    if (!gameState) {
      throw new Error("Game not initialized");
    }

    try {
      const result = await arenaServiceRef.current.dropImmediateItem(
        gameState.gameId,
        itemId,
        targetPlayer
      );
      
      return result;
    } catch (error) {
      console.error("Drop item failed:", error);
      throw error;
    }
  };

  // Get items catalog
  const getItemsCatalog = async () => {
    try {
      const result = await arenaServiceRef.current.getItemsCatalog();
      return result;
    } catch (error) {
      console.error("Get items catalog failed:", error);
      throw error;
    }
  };

  // Update stream URL
  const updateStreamUrl = async (streamUrl, oldStreamUrl) => {
    if (!gameState) {
      throw new Error("Game not initialized");
    }

    try {
      const result = await arenaServiceRef.current.updateStreamUrl(
        gameState.gameId,
        streamUrl,
        oldStreamUrl
      );
      
      return result;
    } catch (error) {
      console.error("Update stream URL failed:", error);
      throw error;
    }
  };

  // Disconnect from arena
  const disconnectArena = () => {
    if (arenaServiceRef.current) {
      arenaServiceRef.current.disconnect();
      setConnected(false);
      setGameState(null);
      setEvents([]);
      setPackages([]);
    }
  };

  // Clear events
  const clearEvents = () => {
    setEvents([]);
  };

  // Send custom message to arena (legacy support)
  const sendToArena = (type, payload) => {
    console.warn("sendToArena is deprecated. Use specific methods like boostPlayer instead.");
    // You can implement custom message sending here if needed
  };

  const value = {
    // State
    connected,
    events,
    packages,
    gameState,
    loading,
    
    // Game Management
    initializeGame,
    disconnectArena,
    getGameDetails,
    updateStreamUrl,
    
    // Player Actions
    boostPlayer,
    dropImmediateItem,
    getItemsCatalog,
    
    // Utilities
    clearEvents,
    sendToArena, // Legacy support
    
    // Service instance (advanced usage)
    arenaService: arenaServiceRef.current
  };

  return (
    <ArenaContext.Provider value={value}>
      {children}
    </ArenaContext.Provider>
  );
}

export const useArena = () => {
  const ctx = useContext(ArenaContext);
  if (!ctx) throw new Error("useArena must be used within an ArenaProvider");
  return ctx;
};