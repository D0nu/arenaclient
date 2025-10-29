import React, { useState, useEffect } from 'react';
import { useSocket } from '../Context/SocketContext';
import { useAuth } from '../Context/AuthContext';
import { useGame } from '../Context/GameContext';

const ViewerPanel = ({ 
  isStreamer = false, 
  gameSession, 
  selectedPlayer, 
  onPlayerSelect 
}) => {
  const [recentInteractions, setRecentInteractions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { socket } = useSocket();
  const { user, token, updateUserBalance } = useAuth();
  const { state } = useGame();

  const coinBalance = user?.coinBalance || 0;

  // Available interactions for viewers
  const viewerInteractions = [
    { id: 'cheer', name: 'Cheer', cost: 10, emoji: '🎉', description: 'Send encouragement' },
    { id: 'speed_boost', name: 'Speed Boost', cost: 50, emoji: '⚡', description: 'Temporary speed increase' },
    { id: 'health_pack', name: 'Health Pack', cost: 75, emoji: '❤️', description: 'Restore some health' },
    { id: 'confuse', name: 'Confuse Enemy', cost: 100, emoji: '😵', description: 'Confuse opponent' },
    { id: 'double_points', name: 'Double Points', cost: 150, emoji: '2️⃣', description: 'Double points for 30s' },
    { id: 'ultimate', name: 'Ultimate Power', cost: 300, emoji: '💥', description: 'Special ability' }
  ];

  // Get players from gameSession or game state
  const getPlayers = () => {
    if (gameSession?.players) {
      return gameSession.players;
    }
    if (state?.players) {
      return state.players;
    }
    if (state?.gameData?.teams) {
      // Flatten teams into single players array
      return [
        ...(state.gameData.teams.A || []),
        ...(state.gameData.teams.B || [])
      ];
    }
    return [];
  };

  const players = getPlayers();

  useEffect(() => {
    if (!socket) return;

    // Listen for interaction results
    socket.on('viewer-interaction-result', (data) => {
      console.log('🎯 Viewer interaction result:', data);
      setIsLoading(false);
      
      const normalizedInteraction = {
        id: Date.now(),
        message: data.message || `Used ${data.cost} coins for ${data.interactionName}`,
        timestamp: new Date(),
        type: data.type || 'interaction',
        success: data.success !== false,
        cost: data.cost || 0
      };
      
      setRecentInteractions(prev => [normalizedInteraction, ...prev.slice(0, 4)]);
      
      // Update user balance if cost is provided
      if (data.cost && data.newBalance !== undefined) {
        updateUserBalance(data.newBalance);
      }
    });

    socket.on('airdrop-received', (data) => {
      console.log('🎉 Airdrop received:', data);
      
      const airdropInteraction = {
        id: Date.now(),
        message: `🎉 Received ${data.amount || 0} coins from airdrop!`,
        timestamp: new Date(),
        type: 'airdrop',
        success: true,
        amount: data.amount
      };
      
      setRecentInteractions(prev => [airdropInteraction, ...prev.slice(0, 4)]);
      
      // Update balance
      if (data.newBalance !== undefined) {
        updateUserBalance(data.newBalance);
      }
    });

    socket.on('airdrop-error', (data) => {
      console.error('❌ Airdrop error:', data);
      setIsLoading(false);
      
      const errorInteraction = {
        id: Date.now(),
        message: `❌ Airdrop failed: ${data.message || data.error}`,
        timestamp: new Date(),
        type: 'error',
        success: false
      };
      
      setRecentInteractions(prev => [errorInteraction, ...prev.slice(0, 4)]);
    });

    socket.on('purchase-success', (data) => {
      console.log('✅ Purchase successful:', data);
      
      const purchaseInteraction = {
        id: Date.now(),
        message: `🛒 Purchased ${data.amount} coins!`,
        timestamp: new Date(),
        type: 'purchase',
        success: true,
        amount: data.amount
      };
      
      setRecentInteractions(prev => [purchaseInteraction, ...prev.slice(0, 4)]);
      
      // Update balance
      if (data.newBalance !== undefined) {
        updateUserBalance(data.newBalance);
      }
    });

    socket.on('purchase-failed', (data) => {
      console.error('❌ Purchase failed:', data);
      
      const errorInteraction = {
        id: Date.now(),
        message: `❌ Purchase failed: ${data.error}`,
        timestamp: new Date(),
        type: 'error',
        success: false
      };
      
      setRecentInteractions(prev => [errorInteraction, ...prev.slice(0, 4)]);
    });

    // Listen for game state updates to refresh player list
    socket.on('game-state-updated', (gameState) => {
      console.log('🔄 Game state updated in ViewerPanel');
      // Player list might have changed, but we don't need to do anything special
      // as we're getting players from props/state dynamically
    });

    return () => {
      socket.off('viewer-interaction-result');
      socket.off('airdrop-received');
      socket.off('airdrop-error');
      socket.off('purchase-success');
      socket.off('purchase-failed');
      socket.off('game-state-updated');
    };
  }, [socket, updateUserBalance]);

  const handleInteraction = async (interaction) => {
    if (coinBalance < interaction.cost) {
      alert(`Not enough coins! You need ${interaction.cost} but have ${coinBalance}`);
      return;
    }

    if (!selectedPlayer) {
      alert('Please select a player to interact with first!');
      return;
    }

    const gameId = gameSession?._id || gameSession?.id || gameSession?.roomCode;
    if (!gameId) {
      alert('No active game session selected');
      return;
    }

    // Show pending interaction immediately
    const pendingInteraction = {
      id: Date.now(),
      message: `⏳ Using ${interaction.cost} coins for ${interaction.name} on ${selectedPlayer.name}...`,
      timestamp: new Date(),
      type: 'pending',
      success: false
    };

    setRecentInteractions(prev => [pendingInteraction, ...prev.slice(0, 4)]);
    setIsLoading(true);

    try {
      // Send interaction to server
      socket.emit('viewer-interaction', {
        interactionId: interaction.id,
        gameId: gameId,
        cost: interaction.cost,
        targetPlayer: selectedPlayer.id, // Send player ID
        targetPlayerName: selectedPlayer.name, // Send player name for display
        timestamp: new Date(),
        userId: user?._id
      });

    } catch (error) {
      console.error('❌ Interaction failed:', error);
      setIsLoading(false);
      
      const errorInteraction = {
        id: Date.now(),
        message: `❌ Failed to use ${interaction.name} on ${selectedPlayer.name}`,
        timestamp: new Date(),
        type: 'error',
        success: false
      };
      
      setRecentInteractions(prev => [errorInteraction, ...prev.slice(0, 4)]);
    }
  };

  const buyCoins = async (amount) => {
    try {
      setIsLoading(true);
      
      socket.emit('coin-purchase', { 
        amount, 
        userId: user._id,
        newBalance: coinBalance + amount 
      });

    } catch (error) {
      console.error('Failed to buy coins:', error);
      setIsLoading(false);
      alert('Failed to complete purchase. Please try again.');
    }
  };

  const claimAirdrop = async () => {
    try {
      setIsLoading(true);
      console.log('🎯 Claiming Vorld airdrop for app:', import.meta.env.VITE_VORLD_APP_ID);
      
      const gameId = gameSession?._id || gameSession?.id || gameSession?.roomCode;
      
      socket.emit('claim-airdrop', { 
        userId: user._id,
        vorldAppId: import.meta.env.VITE_VORLD_APP_ID,
        gameId: gameId 
      });
    } catch (error) {
      console.error('Failed to claim airdrop:', error);
      setIsLoading(false);
    }
  };

  const getInteractionColor = (type) => {
    switch (type) {
      case 'airdrop': return 'text-green-400';
      case 'purchase': return 'text-blue-400';
      case 'error': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-purple-400';
    }
  };

  // Get player display name with avatar
  const getPlayerDisplayName = (player) => {
    return `${player.avatar || '👤'} ${player.name}${player.team ? ` (Team ${player.team})` : ''}`;
  };

  return (
    <div className="viewer-panel bg-gray-900/80 border-2 border-purple-500 rounded-2xl p-4 backdrop-blur-sm h-fit">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-white">
              {isStreamer ? '🎬 Streamer Controls' : '👁️ Viewer Controls'}
            </h3>
          </div>

          {/* Coin Balance & Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-yellow-600/20 border-2 border-yellow-500 rounded-xl px-4 py-2">
              <span className="text-yellow-400 font-bold text-lg">🪙 {coinBalance.toLocaleString()}</span>
              <span className="text-yellow-300 text-sm">coins</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={claimAirdrop}
                disabled={isLoading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg text-sm transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Claiming...' : 'Claim Airdrop'}
              </button>
              
              <button
                onClick={() => buyCoins(100)}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy 100 Coins
              </button>
            </div>
          </div>
        </div>

        {/* Player Selection */}
        {players.length > 0 && (
          <div className="mb-6">
            <label className="block text-white text-sm font-medium mb-2">
              Select Player to Interact With:
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => onPlayerSelect && onPlayerSelect(player)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedPlayer?.id === player.id
                      ? 'bg-purple-600 text-white border-2 border-purple-400'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span className="text-base">{player.avatar || '👤'}</span>
                  <span>{player.name}</span>
                  {player.team && (
                    <span className="text-xs opacity-75">(Team {player.team})</span>
                  )}
                </button>
              ))}
            </div>
            
            {/* Selected Player Display */}
            {selectedPlayer && (
              <div className="mt-3 p-3 bg-purple-600/20 border border-purple-500/50 rounded-lg">
                <p className="text-white text-sm">
                  <span className="font-semibold">Selected:</span> {getPlayerDisplayName(selectedPlayer)}
                </p>
                <p className="text-purple-300 text-xs mt-1">
                  Use interactions below to affect this player
                </p>
              </div>
            )}
          </div>
        )}

        {/* Interactions Grid */}
        <div className="mb-6">
          <h4 className="text-white font-semibold mb-3">Available Interactions</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {viewerInteractions.map((interaction) => (
              <button
                key={interaction.id}
                onClick={() => handleInteraction(interaction)}
                disabled={coinBalance < interaction.cost || isLoading || !selectedPlayer}
                className="bg-gray-800 hover:bg-gray-700 border border-purple-500/30 rounded-xl p-3 text-center transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative"
                title={!selectedPlayer ? "Select a player first" : coinBalance < interaction.cost ? "Not enough coins" : interaction.description}
              >
                <div className="text-2xl mb-1">{interaction.emoji}</div>
                <div className="text-white font-medium text-sm">{interaction.name}</div>
                <div className="text-yellow-400 text-xs mt-1">{interaction.cost} coins</div>
                
                {/* Hover description */}
                <div className="absolute inset-0 bg-black/80 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="text-white text-xs p-2 text-center">
                    {interaction.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Interaction Help Text */}
          {!selectedPlayer && (
            <div className="mt-3 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-yellow-300 text-sm text-center">
                ⚠️ Select a player above to enable interactions
              </p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-black/30 rounded-xl p-4 border border-gray-700">
          <h4 className="text-white font-semibold mb-3">Recent Activity</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {recentInteractions.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent activity</p>
            ) : (
              recentInteractions.map((interaction) => (
                <div
                  key={interaction.id}
                  className={`flex items-center justify-between text-sm p-2 rounded-lg bg-gray-800/50 ${getInteractionColor(interaction.type)}`}
                >
                  <span className="flex-1">{interaction.message}</span>
                  <span className="text-gray-400 text-xs whitespace-nowrap ml-2">
                    {interaction.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-xs text-gray-400">
          <p>💡 Select a player and use coins to interact with the game!</p>
          <p className="mt-1">🎮 Cheers and power-ups affect the selected player</p>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
              <p className="text-white text-sm">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewerPanel;