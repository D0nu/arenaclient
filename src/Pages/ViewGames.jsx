// ViewGamesPage.jsx - UPDATED
import React, { useState, useEffect } from 'react';
import { useSocket } from '../Context/SocketContext';
import { useAuth } from '../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useAudioManager } from '../hooks/useAudioManager';

const ViewGamesPage = () => {
  useAudioManager();
  const [activeGames, setActiveGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const { socket } = useSocket();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // ✅ Redirect unauthenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('🚫 User not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    console.log("🧠 ViewGamesPage mounted, requesting ACTIVE GAMES...");
    socket.emit('get-active-games');
    setLoading(true);

    // ✅ Handle ACTIVE GAMES (games that have started)
    const handleActiveGamesList = (games) => {
      console.log('🎯 Active games received:', games);
      setActiveGames(Array.isArray(games) ? games : []);
      setLoading(false);
    };

    // ✅ Handle real-time updates
    const handleActiveGamesUpdated = (games) => {
      console.log('🔄 Active games updated:', games);
      setActiveGames(Array.isArray(games) ? games : []);
    };

    // ✅ Handle when a game starts
    const handleGameStarted = (data) => {
      console.log('🚀 Game started, refreshing list:', data);
      socket.emit('get-active-games');
    };

    // ✅ Handle when a game ends
    const handleGameEnded = (data) => {
      console.log('🏁 Game ended, refreshing list:', data);
      socket.emit('get-active-games');
    };

    // Register listeners
    socket.on('active-games-list', handleActiveGamesList);
    socket.on('active-games-updated', handleActiveGamesUpdated);
    socket.on('game-started', handleGameStarted);
    socket.on('game-ended', handleGameEnded);

    // ✅ Clean-up
    return () => {
      socket.off('active-games-list', handleActiveGamesList);
      socket.off('active-games-updated', handleActiveGamesUpdated);
      socket.off('game-started', handleGameStarted);
      socket.off('game-ended', handleGameEnded);
    };
  }, [socket, isAuthenticated]);

  // ✅ NEW: Handle watching a game (spectator mode)
  const handleWatchGame = (game) => {
    console.log('👁️ Watching game:', game.roomCode);
    // Navigate to spectator view
    navigate(`/spectate/${game.roomCode}`);
  };

  // ✅ Beautiful loading component
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading active games...</p>
          <p className="text-gray-400 text-sm mt-2">Finding exciting matches to watch</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
          >
            ← Back to Lobby
          </button>

          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎮 Live Games
          </h1>

          <div className="text-white text-lg bg-purple-600/20 px-4 py-2 rounded-xl border border-purple-500">
            {activeGames.length} game{activeGames.length !== 1 ? 's' : ''} live
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="max-w-7xl mx-auto">
        {activeGames.length === 0 ? (
          // No active games state
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Live Games</h2>
            <p className="text-gray-400 text-lg mb-8">
              There are no active games to watch right now.<br />
              Be the first to start a game!
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl transition-all transform hover:scale-105"
            >
              Create a Game
            </button>
          </div>
        ) : (
          // Active games grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeGames.map((game) => (
              <GameCard 
                key={game.roomCode} 
                game={game} 
                onWatchGame={handleWatchGame}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Game Card Component
const GameCard = ({ game, onWatchGame }) => {
  const getGameModeDisplay = (mode) => {
    const modes = {
      'question-vs-game': 'Q&A vs Game',
      'question-vs-question': 'Q&A Only',
      'game-vs-game': 'Games Only'
    };
    return modes[mode] || mode;
  };

  const getWagerDisplay = (wager) => {
    return wager > 0 ? `${wager} coins` : 'Free Play';
  };

  const getTimeElapsed = (startedAt) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just started';
    if (diffMins === 1) return '1 min ago';
    return `${diffMins} mins ago`;
  };

  return (
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-purple-500 hover:border-purple-400 transition-all duration-300 hover:transform hover:scale-105">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{game.roomCode}</h3>
          <p className="text-gray-400 text-sm">{getGameModeDisplay(game.mode)}</p>
        </div>
        <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
          🔴 LIVE
        </div>
      </div>

      {/* Game Info */}
      <div className="space-y-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Wager:</span>
          <span className="text-yellow-400 font-medium">{getWagerDisplay(game.wager)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Players:</span>
          <span className="text-white font-medium">{game.players?.length || 0} playing</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Started:</span>
          <span className="text-gray-300 text-sm">{getTimeElapsed(game.startedAt)}</span>
        </div>
      </div>

      {/* Players List */}
      <div className="mb-4">
        <h4 className="text-gray-400 text-sm font-medium mb-2">Players:</h4>
        <div className="space-y-2">
          {game.players?.map((player, index) => (
            <div key={index} className="flex items-center gap-3 bg-gray-700/50 rounded-lg p-2">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {player.avatar || '👤'}
              </div>
              <span className="text-white text-sm">{player.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Watch Button */}
      <button
        onClick={() => onWatchGame(game)}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 font-semibold"
      >
        <span>👁️ Watch Game</span>
      </button>
    </div>
  );
};

export default ViewGamesPage;