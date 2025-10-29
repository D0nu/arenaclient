// src/services/arenaGameService.js
import { io } from 'socket.io-client';

const ARENA_SERVER_URL = import.meta.env.VITE_ARENA_SERVER_URL || 'wss://airdrop-arcade.onrender.com';
const GAME_API_URL = import.meta.env.VITE_GAME_API_URL || 'https://airdrop-arcade.onrender.com/api';
const VORLD_APP_ID = import.meta.env.VITE_VORLD_APP_ID || '';
const ARENA_GAME_ID = import.meta.env.VITE_ARENA_GAME_ID || '';

export class ArenaGameService {
  constructor() {
    this.socket = null;
    this.gameState = null;
    this.isConnected = false;
    this.eventCallbacks = new Map();
    this.userToken = '';
  }

  // Initialize game with stream URL
  async initializeGame(streamUrl, userToken) {
    try {
      this.userToken = userToken;
      
      console.log('🎮 Initializing Arena game...', {
        streamUrl,
        gameApiUrl: GAME_API_URL,
        arenaGameId: ARENA_GAME_ID
      });

      const response = await fetch(`${GAME_API_URL}/games/init`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'X-Arena-Arcade-Game-ID': ARENA_GAME_ID,
          'X-Vorld-App-ID': VORLD_APP_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ streamUrl })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        this.gameState = data.data;
        console.log('✅ Game initialized successfully:', this.gameState.gameId);
        
        // Connect to WebSocket
        await this.connectWebSocket();
        
        return {
          success: true,
          data: this.gameState
        };
      } else {
        throw new Error(data.error || 'Failed to initialize game');
      }
    } catch (error) {
      console.error('❌ Game initialization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Connect to WebSocket
  async connectWebSocket() {
    try {
      if (!this.gameState?.websocketUrl) {
        throw new Error('No WebSocket URL available in game state');
      }

      console.log('🔌 Connecting to WebSocket:', this.gameState.websocketUrl);

      this.socket = io(this.gameState.websocketUrl, {
        transports: ['websocket', 'polling'],
        auth: {
          token: this.userToken,
          appId: VORLD_APP_ID
        },
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Set up event listeners
      this.setupEventListeners();

      return new Promise((resolve, reject) => {
        this.socket.on('connect', () => {
          console.log('✅ Connected to Arena WebSocket');
          this.isConnected = true;
          resolve(true);
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ WebSocket connection failed:', error);
          this.isConnected = false;
          reject(error);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('❌ Failed to connect to WebSocket:', error);
      throw error;
    }
  }

  // Set up WebSocket event listeners
  setupEventListeners() {
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
      this.socket.on(event, (data) => {
        console.log(`📡 WebSocket Event: ${event}`, data);
        
        // Update game state for relevant events
        this.updateGameState(event, data);
        
        // Trigger registered callbacks
        if (this.eventCallbacks.has(event)) {
          this.eventCallbacks.get(event).forEach(callback => {
            try {
              callback(data);
            } catch (error) {
              console.error(`Error in ${event} callback:`, error);
            }
          });
        }
      });
    });

    // Handle connection events
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ WebSocket reconnection failed:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ WebSocket reconnection failed after max attempts');
    });

    this.socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });
  }

  // Update game state based on events
  updateGameState(event, data) {
    switch (event) {
      case 'arena_countdown_started':
        this.gameState = { ...this.gameState, ...data, countdownStarted: true };
        break;
      case 'arena_begins':
        this.gameState = { ...this.gameState, ...data, arenaActive: true };
        break;
      case 'game_completed':
      case 'game_stopped':
        this.gameState = { ...this.gameState, ...data, status: event === 'game_completed' ? 'completed' : 'stopped' };
        break;
      default:
        // Merge data into game state for other events
        this.gameState = { ...this.gameState, ...data };
    }
  }

  // Register event callback
  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event).push(callback);
  }

  // Remove event callback
  off(event, callback) {
    if (this.eventCallbacks.has(event)) {
      const callbacks = this.eventCallbacks.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Boost a player
  async boostPlayer(gameId, playerId, amount, username) {
    try {
      console.log('🚀 Boosting player:', { gameId, playerId, amount, username });

      const response = await fetch(`${GAME_API_URL}/games/boost/player/${gameId}/${playerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'X-Arena-Arcade-Game-ID': ARENA_GAME_ID,
          'X-Vorld-App-ID': VORLD_APP_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, username })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Boost successful:', data.data);
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.error || 'Failed to boost player');
      }
    } catch (error) {
      console.error('❌ Boost player failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get game details
  async getGameDetails(gameId) {
    try {
      const response = await fetch(`${GAME_API_URL}/games/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'X-Arena-Arcade-Game-ID': ARENA_GAME_ID,
          'X-Vorld-App-ID': VORLD_APP_ID
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        this.gameState = data.data;
        return {
          success: true,
          data: this.gameState
        };
      } else {
        throw new Error(data.error || 'Failed to get game details');
      }
    } catch (error) {
      console.error('❌ Get game details failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get items catalog
  async getItemsCatalog() {
    try {
      const response = await fetch(`${GAME_API_URL}/items/catalog`, {
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'X-Arena-Arcade-Game-ID': ARENA_GAME_ID,
          'X-Vorld-App-ID': VORLD_APP_ID
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.error || 'Failed to get items catalog');
      }
    } catch (error) {
      console.error('❌ Get items catalog failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Drop immediate item
  async dropImmediateItem(gameId, itemId, targetPlayer) {
    try {
      console.log('📦 Dropping item:', { gameId, itemId, targetPlayer });

      const response = await fetch(`${GAME_API_URL}/items/drop/${gameId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'X-Arena-Arcade-Game-ID': ARENA_GAME_ID,
          'X-Vorld-App-ID': VORLD_APP_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemId, targetPlayer })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Item drop successful:', data.data);
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.error || 'Failed to drop item');
      }
    } catch (error) {
      console.error('❌ Drop item failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update stream URL
  async updateStreamUrl(gameId, streamUrl, oldStreamUrl) {
    try {
      const response = await fetch(`${GAME_API_URL}/games/${gameId}/stream-url`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'X-Arena-Arcade-Game-ID': ARENA_GAME_ID,
          'X-Vorld-App-ID': VORLD_APP_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ streamUrl, oldStreamUrl })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.error || 'Failed to update stream URL');
      }
    } catch (error) {
      console.error('❌ Update stream URL failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Disconnect from WebSocket
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from Arena WebSocket');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.eventCallbacks.clear();
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Get current game state
  getGameState() {
    return this.gameState;
  }

  // Get socket instance (for advanced usage)
  getSocket() {
    return this.socket;
  }
}

export default ArenaGameService;